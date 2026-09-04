import { deriveKey, encryptBuffer, decryptBuffer } from "./crypto.js";

export class WebRTCManager {
  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
        {
          urls: import.meta.env.VITE_TURN_URL || "turn:free.expressturn.com:3478",
          username: import.meta.env.VITE_TURN_USERNAME || "000000002098956879",
          credential: import.meta.env.VITE_TURN_CREDENTIAL || "6IQuqYhjHuBAp2IG/vqaayJnwWY=",
        }
      ],
    });

    this.dataChannel = null;

    // E2EE Key
    this.cryptoKey = null;
    this.isEncrypted = false;
    this.receiveQueue = Promise.resolve();

    // callbacks
    this.onIceCandidate = null;
    this.onConnected = null;
    this.onSendProgress = null;
    this.onReceiveProgress = null;
    this.onConnectionFailed = null;
    this.onFileReceived = null;
    this.onReset = null;
    this.onDisconnected = null;
    this.onClose = null;
    this.onPromptSend = null;

    this.wasEverConnected = false;
    this.receivedBuffers = [];
    this.receivedSize = 0;
    this.incomingMeta = null;
    this.isChannelOpen = false;

    this.relayMode = false;
    this.sendRelayMessage = null;
    this.pendingCandidates = [];

    this.peer.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    this.peer.onconnectionstatechange = () => {
      const state = this.peer.connectionState;
      console.log("[RTC] PC state:", state);
      
      // If we've already fallen back to Relay Mode, ignore WebRTC connection failures
      if (this.relayMode) return;
      
      if (state === "failed" || state === "closed") {
        if (this.wasEverConnected) {
          this.isChannelOpen = false;
          this.onDisconnected?.();
        } else {
          this.onConnectionFailed?.();
        }
      }
    };

    this.peer.ondatachannel = (event) => {
      console.log("[RTC] DataChannel received");
      this.dataChannel = event.channel;
      this.setupReceiverChannel();
    };
  }

  async initCrypto(roomId) {
    if (!roomId) return;
    try {
      this.cryptoKey = await deriveKey(roomId);
      this.isEncrypted = true;
      console.log("[RTC] E2EE AES-256-GCM Key Initialized for room:", roomId);
    } catch (err) {
      console.error("[RTC] Failed to initialize E2EE key:", err);
    }
  }

  createDataChannel() {
    this.dataChannel = this.peer.createDataChannel("file");
    this.setupSenderChannel();
  }

  setupSenderChannel() {
    if (!this.dataChannel) return;
    this.dataChannel.binaryType = "arraybuffer";

    this.dataChannel.onopen = () => {
      this.isChannelOpen = true;
      this.wasEverConnected = true;
      this.onConnected?.();
    };

    this.dataChannel.onmessage = this.handleDataChannelMessage;

    this.dataChannel.onclose = () => {
      if (this.relayMode) return;
      if (this.wasEverConnected) {
        this.isChannelOpen = false;
        this.onDisconnected?.();
      }
    };
  }

  setupReceiverChannel() {
    if (!this.dataChannel) return;
    this.dataChannel.binaryType = "arraybuffer";

    this.dataChannel.onopen = () => {
      this.isChannelOpen = true;
      this.wasEverConnected = true;
      this.onConnected?.();
    };

    this.dataChannel.onmessage = this.handleDataChannelMessage;

    this.dataChannel.onclose = () => {
      if (this.relayMode) return;
      if (this.wasEverConnected) {
        this.isChannelOpen = false;
        this.onDisconnected?.();
      }
    };
  }

  handleDataChannelMessage = (event) => {
    if (typeof event.data === "string") {
      const msg = JSON.parse(event.data);

      if (msg.type === "META") {
        this.incomingMeta = msg.meta;
        this.receivedBuffers = [];
        this.receivedSize = 0;
        this.receiveQueue = Promise.resolve();
        this.onReceiveProgress?.(0);
      } else if (msg.type === "PROMPT_SEND") {
        this.onPromptSend?.();
      } else if (msg.type === "RESET") {
        this.onReset?.();
      } else if (msg.type === "DONE" && this.incomingMeta) {
        this.receiveQueue.then(() => {
          if (!this.incomingMeta) return;
          const blob = new Blob(this.receivedBuffers, {
            type: this.incomingMeta.type,
          });

          const file = new File([blob], this.incomingMeta.name, {
            type: this.incomingMeta.type,
          });

          this.onFileReceived?.(file);
          this.receivedBuffers = [];
          this.incomingMeta = null;
        });
      }
      return;
    }

    // Binary chunk - handle decrypt in ordered queue
    const rawBuffer = event.data;
    this.receiveQueue = this.receiveQueue.then(async () => {
      let chunkBytes;
      if (this.cryptoKey) {
        const decrypted = await decryptBuffer(this.cryptoKey, rawBuffer);
        chunkBytes = new Uint8Array(decrypted);
      } else {
        chunkBytes = new Uint8Array(rawBuffer);
      }
      this.receivedBuffers.push(chunkBytes);
      this.receivedSize += chunkBytes.byteLength;

      if (this.incomingMeta && this.onReceiveProgress) {
        const percent = Math.floor(
          (this.receivedSize / this.incomingMeta.size) * 100
        );
        this.onReceiveProgress(percent);
      }
    }).catch(err => {
      console.error("[RTC] Error decrypting binary chunk:", err);
    });
  };

  async createOffer() {
    this.createDataChannel();
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async createAnswer() {
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(sdp) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
    for (const candidate of this.pendingCandidates) {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("[RTC] Pending ICE error:", e));
    }
    this.pendingCandidates = [];
  }

  async addIceCandidate(candidate) {
    if (this.peer.remoteDescription) {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("[RTC] ICE error:", e));
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  switchToRelayMode(isInitiator = true) {
    if (this.relayMode) return;
    this.relayMode = true;
    this.isChannelOpen = true;
    if (isInitiator) {
      this.sendRelayMessage?.({ type: "relay-init" });
    }
    this.onConnected?.();
  }

  handleRelayMessage(msg) {
    if (msg.type === "relay-init") {
      this.switchToRelayMode(false);
      return;
    } else if (msg.type === "relay-meta") {
      this.incomingMeta = msg.meta;
      this.receivedBuffers = [];
      this.receivedSize = 0;
      this.receiveQueue = Promise.resolve();
      this.onReceiveProgress?.(0);
    } else if (msg.type === "relay-prompt-send") {
      this.onPromptSend?.();
    } else if (msg.type === "relay-reset") {
      this.onReset?.();
    } else if (msg.type === "relay-chunk") {
      const binaryString = atob(msg.data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      this.receiveQueue = this.receiveQueue.then(async () => {
        let chunkBytes;
        if (this.cryptoKey) {
          const decrypted = await decryptBuffer(this.cryptoKey, bytes.buffer);
          chunkBytes = new Uint8Array(decrypted);
        } else {
          chunkBytes = bytes;
        }

        this.receivedBuffers.push(chunkBytes);
        this.receivedSize += chunkBytes.byteLength;

        if (this.incomingMeta && this.onReceiveProgress) {
          const percent = Math.floor(
            (this.receivedSize / this.incomingMeta.size) * 100
          );
          this.onReceiveProgress(percent);
        }
      }).catch(err => {
        console.error("[RTC] Error decrypting relay chunk:", err);
      });
    } else if (msg.type === "relay-done" && this.incomingMeta) {
      this.receiveQueue.then(() => {
        if (!this.incomingMeta) return;
        const blob = new Blob(this.receivedBuffers, {
          type: this.incomingMeta.type,
        });

        const file = new File([blob], this.incomingMeta.name, {
          type: this.incomingMeta.type,
        });

        this.onFileReceived?.(file);
        this.receivedBuffers = [];
        this.incomingMeta = null;
      });
    }
  }

  async sendFile(file) {
    if (!this.isChannelOpen) {
      throw new Error("Channel not open");
    }

    if (this.relayMode) {
      this.sendRelayMessage?.({
        type: "relay-meta",
        meta: { name: file.name, size: file.size, type: file.type }
      });
      
      let offset = 0;
      const CHUNK_SIZE = 64 * 1024;
      
      const pump = async () => {
        while (offset < file.size) {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const rawBuffer = await slice.arrayBuffer();
          
          const payloadBuffer = this.cryptoKey
            ? await encryptBuffer(this.cryptoKey, rawBuffer)
            : rawBuffer;

          let binary = '';
          const bytes = new Uint8Array(payloadBuffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          this.sendRelayMessage?.({
            type: "relay-chunk",
            data: base64
          });
          
          offset += rawBuffer.byteLength;
          this.onSendProgress?.(Math.floor((offset / file.size) * 100));
          
          // Yield to event loop to prevent blocking UI during large encodes
          await new Promise(r => setTimeout(r, 0)); 
        }
        this.sendRelayMessage?.({ type: "relay-done" });
      };
      
      await pump();
      return;
    }

    const channel = this.dataChannel;

    channel.send(
      JSON.stringify({
        type: "META",
        meta: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      })
    );

    let offset = 0;
    const CHUNK_SIZE = 64 * 1024; // 64 KB
    const LOW_WATER = 1 * 1024 * 1024; // 1 MB
    const HIGH_WATER = 8 * 1024 * 1024; // 8 MB

    channel.bufferedAmountLowThreshold = LOW_WATER;

    return new Promise((resolve) => {
      const pump = async () => {
        while (offset < file.size && channel.bufferedAmount < HIGH_WATER) {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const rawBuffer = await slice.arrayBuffer();

          const payloadBuffer = this.cryptoKey
            ? await encryptBuffer(this.cryptoKey, rawBuffer)
            : rawBuffer;

          channel.send(payloadBuffer);
          offset += rawBuffer.byteLength;

          this.onSendProgress?.(Math.floor((offset / file.size) * 100));
        }

        if (offset < file.size) {
          channel.onbufferedamountlow = pump;
        } else {
          channel.send(JSON.stringify({ type: "DONE" }));
          channel.onbufferedamountlow = null;
          resolve();
        }
      };

      pump();
    });
  }
}


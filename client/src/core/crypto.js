/**
 * WebCrypto API (AES-256-GCM) End-to-End Encryption Helper
 */

// Derive an AES-256-GCM key from a shared secret string (such as room ID)
export async function deriveKey(secret) {
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret + "-e2ee-salt-peerly");
  const hashBuffer = await crypto.subtle.digest("SHA-256", secretData);

  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt an ArrayBuffer using AES-256-GCM.
// Returns an ArrayBuffer containing 12-byte IV + Ciphertext (with 16-byte GCM tag).
export async function encryptBuffer(cryptoKey, buffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    buffer
  );

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return combined.buffer;
}

// Decrypt an ArrayBuffer (12-byte IV + Ciphertext) using AES-256-GCM.
// Returns the decrypted raw ArrayBuffer.
export async function decryptBuffer(cryptoKey, combinedBuffer) {
  const combinedArray = new Uint8Array(combinedBuffer);
  const iv = combinedArray.slice(0, 12);
  const ciphertext = combinedArray.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );

  return decrypted;
}

// Encrypt string / object payload to Base64
export async function encryptJSON(cryptoKey, obj) {
  const jsonStr = JSON.stringify(obj);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(jsonStr);
  const encryptedBuf = await encryptBuffer(cryptoKey, encoded.buffer);
  
  let binary = "";
  const bytes = new Uint8Array(encryptedBuf);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decrypt Base64 payload to object
export async function decryptJSON(cryptoKey, base64Str) {
  const binary = atob(base64Str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decryptedBuf = await decryptBuffer(cryptoKey, bytes.buffer);
  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(decryptedBuf);
  return JSON.parse(jsonStr);
}

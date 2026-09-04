import { motion } from "framer-motion";
import {
  Zap,
  ServerOff,
  HardDrive,
  Lock,
  UserCheck,
  Activity,
} from "lucide-react";
import clsx from "clsx";

const features = [
  {
    title: "Direct P2P Transfer",
    desc: "Files stream straight between browsers over WebRTC DataChannels. No intermediary server ever touches your data.",
    metric: "0 servers",
    badgeStyle: "border-accent/40 bg-accent/10 text-accent shadow-[0_0_12px_rgba(79,140,255,0.25)]",
    icon: Zap,
    className: "md:col-span-2 md:row-span-2",
    large: true,
  },
  {
    title: "No Server Storage",
    desc: "Your files never leave the connection. Nothing is uploaded, cached, or stored anywhere.",
    metric: "0 bytes stored",
    badgeStyle: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
    icon: ServerOff,
    className: "",
  },
  {
    title: "Large File Support",
    desc: "Chunked streaming with backpressure handling keeps transfers stable at any size.",
    metric: "64KB chunks",
    badgeStyle: "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
    icon: HardDrive,
    className: "",
  },
  {
    title: "Secure by Design",
    desc: "WebRTC encrypts all data in transit. No plaintext. No leaks.",
    metric: "DTLS 1.2+",
    badgeStyle: "border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
    icon: Lock,
    className: "",
  },
  {
    title: "Connection Control",
    desc: "Accept or decline requests. You decide who gets access.",
    metric: "Full control",
    badgeStyle: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    icon: UserCheck,
    className: "",
  },
  {
    title: "Real-Time Progress",
    desc: "Live progress tracking with chunk-level updates. See exactly how much has been sent and received, in real time.",
    metric: "Live updates",
    badgeStyle: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
    icon: Activity,
    className: "md:col-span-4",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight md:text-5xl text-foreground"
          >
            Everything you need.
            <br />
            <span className="text-muted">Nothing you don't.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-subtle"
          >
            Built for speed, simplicity, and security. Every feature serves a
            purpose.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[minmax(240px,auto)]">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={clsx(
                "group relative flex flex-col justify-between overflow-hidden",
                "rounded-2xl border border-border bg-card p-6 md:p-7 shadow-sm",
                "transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_40px_-12px_rgba(79,140,255,0.15)]",
                f.className
              )}
            >
              {/* Hover glow */}
              <div className="absolute -right-12 -top-12 h-32 w-32 bg-accent/[0.04] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div
                  className={clsx(
                    "inline-flex items-center justify-center rounded-xl bg-elevated text-muted group-hover:text-accent transition-colors",
                    f.large
                      ? "h-12 w-12 mb-6"
                      : "h-10 w-10 mb-4"
                  )}
                >
                  <f.icon size={f.large ? 22 : 18} />
                </div>
                <h3
                  className={clsx(
                    "font-semibold tracking-tight text-foreground",
                    f.large ? "text-xl mb-2" : "text-[15px] mb-1.5"
                  )}
                >
                  {f.title}
                </h3>
                <p
                  className={clsx(
                    "text-subtle leading-relaxed",
                    f.large ? "text-sm max-w-sm" : "text-xs"
                  )}
                >
                  {f.desc}
                </p>
              </div>

              {/* Metric badge */}
              <div className="relative z-10 mt-5 pt-2">
                <span
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm transition-transform group-hover:scale-105",
                    f.badgeStyle
                  )}
                >
                  {f.metric}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

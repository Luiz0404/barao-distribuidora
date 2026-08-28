import React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export default function Loader() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg)] relative overflow-hidden" data-testid="app-loader">
      <div className="smoke-layer" />
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="crown-glow"
      >
        <Crown className="w-20 h-20 text-gold" strokeWidth={1.4} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7 }}
        className="mt-6 text-4xl sm:text-5xl font-display font-black gold-text tracking-tight"
      >
        BARÃO
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-2 text-sm sm:text-base text-white/60 tracking-widest uppercase"
      >
        Distribuidora & Tabacaria
      </motion.p>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 180 }}
        transition={{ delay: 0.9, duration: 0.9 }}
        className="mt-8 h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent"
      />
    </div>
  );
}

import React from "react";
import { motion } from "framer-motion";
import { Flame, MapPin, Rocket, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_BG = "https://images.unsplash.com/photo-1627697586788-478c362e1ce0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwxfHxiZWVyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzg3OTQyODI1fDA&ixlib=rb-4.1.0&q=85";
const LOGO_URL = "/logo.jpg";

export default function Hero({ whatsapp }) {
  const waLink = `https://wa.me/${whatsapp || "5566992575143"}?text=${encodeURIComponent("Olá, Barão Distribuidora! Quero fazer um pedido.")}`;
  return (
    <section id="hero" className="relative min-h-[100svh] flex items-center overflow-hidden pt-24">
      <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[var(--bg)]" />
      <div className="smoke-layer" />
      <div className="grain-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 grid lg:grid-cols-[1.15fr_.85fr] gap-10 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold)]/40 bg-white/5 backdrop-blur text-xs uppercase tracking-widest text-[var(--gold-bright)]"
          >
            <Flame className="w-3.5 h-3.5" /> Tudo para o seu Rolê
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08 }}
            className="mt-5 font-display-tight font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95]"
            data-testid="hero-title"
          >
            <span className="block gold-text">BARÃO</span>
            <span className="block text-white/95 text-3xl sm:text-4xl lg:text-5xl mt-2 font-semibold tracking-tight">Distribuidora & Tabacaria</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-base sm:text-lg text-white/70 leading-relaxed"
          >
            Bebidas geladas, artigos de tabacaria, combos e entrega rápida — a coroa do rolê chegou pra facilitar sua noite.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a href={waLink} target="_blank" rel="noreferrer" data-testid="hero-wa-btn">
              <Button className="btn-gold-glow rounded-full h-14 px-7 text-base font-bold">
                <Flame className="w-5 h-5 mr-2" /> Fazer pedido via WhatsApp
              </Button>
            </a>
            <a href="#categorias" onClick={(e) => { e.preventDefault(); document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" }); }} data-testid="hero-products-btn">
              <Button className="btn-outline-gold rounded-full h-14 px-6 text-base font-semibold">
                Ver produtos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
              <MapPin className="w-3.5 h-3.5 text-[var(--gold-bright)]" /> Loja Física + Retirada
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
              <Rocket className="w-3.5 h-3.5 text-[var(--ember)]" /> Delivery Rápido
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:flex justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-[var(--gold)]/20 blur-3xl scale-90" />
          <img src={LOGO_URL} alt="Barão logo" className="relative w-[420px] h-[420px] object-contain drop-shadow-[0_25px_60px_rgba(212,175,55,0.35)]" />
        </motion.div>
      </div>
    </section>
  );
}

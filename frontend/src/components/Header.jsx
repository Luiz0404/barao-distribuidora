import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, Menu, ShoppingCart, X, MapPin, Flame, Package, Wine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

const LOGO_URL = "/logo.jpg";

const NAV = [
  { id: "hero", label: "Início" },
  { id: "categorias", label: "Categorias" },
  { id: "promocao", label: "Promoção do Dia" },
  { id: "combos", label: "Combos" },
  { id: "localizacao", label: "Localização" },
];

export default function Header({ whatsapp }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const waLink = `https://wa.me/${whatsapp || "5566992575143"}`;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-[background,backdrop-filter,border-color] duration-300 ${scrolled ? "bg-black/70 backdrop-blur-xl border-b border-[var(--line-gold)]" : "bg-transparent border-b border-transparent"}`}
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-8 py-3">
        <button onClick={() => scrollTo("hero")} className="flex items-center gap-3 group" data-testid="logo-btn">
          <img src={LOGO_URL} alt="Barão" className="w-11 h-11 rounded-full object-cover ring-2 ring-[var(--gold)]/40 group-hover:ring-[var(--gold)] transition-[box-shadow] duration-300" />
          <div className="hidden sm:block text-left leading-tight">
            <div className="font-display font-black text-lg gold-text tracking-tight">BARÃO</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">Distribuidora & Tabacaria</div>
          </div>
        </button>

        <nav className="ml-6 hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => scrollTo(n.id)}
              className="px-3 py-2 text-sm text-white/75 hover:text-[var(--gold-bright)] rounded-md transition-colors duration-200"
              data-testid={`nav-${n.id}`}
            >{n.label}</button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a href={waLink} target="_blank" rel="noreferrer" className="hidden md:inline-flex" data-testid="header-wa-btn">
            <Button className="btn-gold-glow rounded-full h-10 px-5 font-semibold">
              <Flame className="w-4 h-4 mr-2" /> Pedir Agora
            </Button>
          </a>

          <button
            onClick={() => setCartOpen(true)}
            className="relative h-11 w-11 grid place-items-center rounded-full border border-white/10 hover:border-[var(--gold)]/60 hover:bg-white/5 transition-colors"
            data-testid="cart-open-btn"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[var(--ember)] text-white text-[11px] font-bold grid place-items-center"
                  data-testid="cart-count"
                >{count}</motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setOpen(true)}
            className="lg:hidden h-11 w-11 grid place-items-center rounded-full border border-white/10 hover:border-[var(--gold)]/60"
            data-testid="mobile-menu-btn"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg lg:hidden"
            data-testid="mobile-menu-overlay"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-gold" />
                <span className="gold-text font-display font-bold">BARÃO</span>
              </div>
              <button onClick={() => setOpen(false)} className="h-10 w-10 grid place-items-center rounded-full border border-white/10" data-testid="mobile-menu-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-2">
              {NAV.map((n) => (
                <button key={n.id} onClick={() => scrollTo(n.id)} className="text-left text-2xl font-display font-semibold py-3 border-b border-white/5 hover:text-[var(--gold-bright)]" data-testid={`mobile-nav-${n.id}`}>
                  {n.label}
                </button>
              ))}
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-4">
                <Button className="btn-gold-glow w-full rounded-full h-12 text-base font-bold">Pedir via WhatsApp</Button>
              </a>
              <button onClick={() => { setOpen(false); navigate("/admin/login"); }} className="mt-2 text-xs text-white/40 hover:text-white" data-testid="mobile-admin-link">Painel do Proprietário</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

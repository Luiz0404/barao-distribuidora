import React from "react";
import { Crown, Instagram, MessageCircle } from "lucide-react";

export default function Footer({ config }) {
  const wa = config?.whatsapp || "5566992575143";
  const ig = config?.instagram || "@barao_distribuidoraspc";
  const igHandle = ig.replace(/^@/, "");
  return (
    <footer className="relative border-t border-white/10 mt-16 bg-[#08080a]">
      <div className="section-divider" />
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-gold" />
            <div>
              <div className="font-display font-black text-2xl gold-text tracking-tight">BARÃO</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/50">Distribuidora & Tabacaria</div>
            </div>
          </div>
          <p className="mt-4 text-white/60 text-sm max-w-sm">Tudo para o seu Rolê. Bebidas geladas, artigos de tabacaria e delivery rápido.</p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-[var(--gold-bright)] mb-3">Contato</div>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/80 hover:text-[var(--gold-bright)] transition-colors" data-testid="footer-wa">
            <MessageCircle className="w-4 h-4" /> {wa.startsWith("55") ? `(${wa.slice(2,4)}) ${wa.slice(4,9)}-${wa.slice(9)}` : wa}
          </a>
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-white/80 hover:text-[var(--gold-bright)] transition-colors" data-testid="footer-ig">
            <Instagram className="w-4 h-4" /> {ig}
          </a>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-[var(--gold-bright)] mb-3">Rolê Garantido</div>
          <p className="font-display font-bold text-2xl text-white leading-tight">Partiu Rolê?<br/><span className="gold-text">Chama o Barão!</span></p>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Barão Distribuidora & Tabacaria — Tudo para seu Rolê
      </div>
    </footer>
  );
}

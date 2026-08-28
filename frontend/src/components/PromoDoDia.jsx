import React from "react";
import { motion } from "framer-motion";
import { Flame, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { fileUrl } from "@/lib/api";

function money(v) { return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`; }

export default function PromoDoDia({ promotions }) {
  const { addItem } = useCart();
  const active = (promotions || []).filter(p => p.product);

  return (
    <section id="promocao" className="relative py-24 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[#150a06] to-[var(--bg)]" />
      <div className="smoke-layer" />
      <div className="relative max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--ember)] mb-3">
              <Flame className="w-4 h-4" /> Oferta relâmpago
            </div>
            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight" data-testid="promo-title">
              Promoção do <span className="ember-text">Dia</span>
            </h2>
          </div>
        </div>

        {active.length === 0 ? (
          <div className="surface-card p-10 text-center text-white/60" data-testid="promo-empty">
            Nenhuma promoção ativa no momento. Volte em breve — o Barão sempre solta oferta!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((promo, i) => {
              const p = promo.product;
              const img = promo.image_url ? fileUrl(promo.image_url) : (p.image_url ? fileUrl(p.image_url) : null);
              const off = p.price ? Math.round((1 - promo.promo_price / p.price) * 100) : 0;
              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="surface-card overflow-hidden hover-lift relative"
                  data-testid={`promo-card-${promo.id}`}
                >
                  <div className="relative aspect-[16/10] bg-[var(--surface-2)] overflow-hidden">
                    {img && <img src={img} alt={p.name} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    {off > 0 && (
                      <span className="absolute top-4 left-4 bg-[var(--ember)] text-white text-sm font-bold px-3 py-1.5 rounded-full">
                        -{off}%
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white">{p.name}</h3>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-white/40 line-through text-sm">{money(p.price)}</div>
                      <div className="text-3xl font-black gold-text">{money(promo.promo_price)}</div>
                    </div>
                    <Button
                      onClick={() => addItem({ ...p, promo_price: promo.promo_price })}
                      className="btn-ember w-full mt-4 rounded-full h-12 font-bold"
                      data-testid={`promo-add-${promo.id}`}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar ao carrinho
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

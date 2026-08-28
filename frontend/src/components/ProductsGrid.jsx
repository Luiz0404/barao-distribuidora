import React from "react";
import { motion } from "framer-motion";
import { Plus, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { fileUrl } from "@/lib/api";

function money(v) { return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`; }

function ProductCard({ p, index }) {
  const { addItem } = useCart();
  const hasPromo = p.promo_price && p.promo_price > 0 && p.promo_price < p.price;
  const off = hasPromo ? Math.round((1 - p.promo_price / p.price) * 100) : 0;
  const img = p.image_url ? fileUrl(p.image_url) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: (index % 8) * 0.04 }}
      className="surface-card overflow-hidden hover-lift flex flex-col"
      data-testid={`product-card-${p.id}`}
    >
      <div className="relative aspect-square bg-[var(--surface-2)] overflow-hidden">
        {img ? (
          <img src={img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/25"><ImageOff className="w-10 h-10" /></div>
        )}
        {hasPromo && (
          <span className="absolute top-3 left-3 bg-[var(--ember)] text-white text-xs font-bold px-2.5 py-1 rounded-full">-{off}%</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-semibold text-lg leading-tight text-white line-clamp-2">{p.name}</h3>
        {p.description && <p className="mt-1 text-sm text-white/55 line-clamp-2">{p.description}</p>}
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            {hasPromo && <div className="text-xs text-white/40 line-through">{money(p.price)}</div>}
            <div className="text-xl font-bold gold-text">{money(hasPromo ? p.promo_price : p.price)}</div>
          </div>
          <Button
            onClick={() => addItem(p)}
            className="btn-gold-glow rounded-full h-10 px-4 font-semibold"
            data-testid={`add-to-cart-${p.id}`}
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export default function ProductsGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="surface-card aspect-[3/4] animate-pulse bg-white/[0.03]" />
        ))}
      </div>
    );
  }
  if (!products?.length) {
    return (
      <div className="surface-card p-10 text-center text-white/60" data-testid="products-empty">
        Nenhum produto cadastrado nesta categoria ainda.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" data-testid="products-grid">
      {products.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
    </div>
  );
}

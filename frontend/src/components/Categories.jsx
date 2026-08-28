import React from "react";
import { motion } from "framer-motion";
import { Wine, Flame, Package, Snowflake, ChevronRight } from "lucide-react";
import { fileUrl } from "@/lib/api";

const ICONS = { bebidas: Wine, tabacaria: Flame, combos: Package, "gelo-carvao": Snowflake };
const IMGS = {
  bebidas: "https://images.unsplash.com/photo-1766589221103-2fc159a1d270?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxiZWVyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzg3OTQyODI1fDA&ixlib=rb-4.1.0&q=85",
  tabacaria: "https://images.unsplash.com/photo-1662468527222-e4edb1cda938?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxob29rYWglMjBkYXJrfGVufDB8fHx8MTc4Nzk0MjgyNXww&ixlib=rb-4.1.0&q=85",
  combos: "https://images.unsplash.com/photo-1693409166438-fc92119a0060?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxjb2NrdGFpbCUyMGRyaW5rcyUyMGRhcmt8ZW58MHx8fHwxNzg3OTQyODI1fDA&ixlib=rb-4.1.0&q=85",
  "gelo-carvao": "https://images.unsplash.com/photo-1590430752967-d0e116909be1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxpY2UlMjBjdWJlcyUyMGJsYWNrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODc5NDI4MjV8MA&ixlib=rb-4.1.0&q=85",
};

export default function Categories({ categories, onPick, active }) {
  return (
    <section id="categorias" className="py-24 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--gold-bright)] mb-3">Explore</div>
            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight" data-testid="categories-title">
              Categorias do <span className="gold-text">Barão</span>
            </h2>
            <p className="mt-3 text-white/60 max-w-xl">Escolha uma categoria e descubra tudo que preparamos pra você.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat, i) => {
            const Icon = ICONS[cat.slug] || Package;
            const bg = cat.image_url ? fileUrl(cat.image_url) : IMGS[cat.slug];
            const isActive = active === cat.slug;
            return (
              <motion.button
                key={cat.id}
                onClick={() => onPick(cat.slug)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden surface-card hover-lift text-left ${isActive ? "gold-ring" : ""}`}
                data-testid={`category-${cat.slug}`}
              >
                {bg && <img src={bg} alt={cat.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500 group-hover:scale-110" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                <div className="relative h-full flex flex-col justify-between p-4 sm:p-5">
                  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--gold-bright)]">
                    <Icon className="w-4 h-4" /> {isActive ? "Selecionada" : "Categoria"}
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-2xl sm:text-3xl leading-tight text-white">{cat.name}</h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm text-white/70 group-hover:text-[var(--gold-bright)] transition-colors">
                      Ver produtos <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import ProductsGrid from "@/components/ProductsGrid";
import PromoDoDia from "@/components/PromoDoDia";
import Localizacao from "@/components/Localizacao";
import Footer from "@/components/Footer";
import FloatingWhatsapp from "@/components/FloatingWhatsapp";
import CartSheet from "@/components/CartSheet";
import { Wine } from "lucide-react";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [config, setConfig] = useState(null);
  const [activeCat, setActiveCat] = useState("bebidas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, p, pr, cf] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
          api.get("/promotions"),
          api.get("/config"),
        ]);
        setCategories(c.data);
        setProducts(p.data);
        setPromotions(pr.data);
        setConfig(cf.data);
        if (c.data.length && !c.data.find(x => x.slug === activeCat)) setActiveCat(c.data[0].slug);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => products.filter(p => p.category_slug === activeCat), [products, activeCat]);
  const activeCatObj = categories.find(c => c.slug === activeCat);

  return (
    <div className="min-h-screen">
      <Header whatsapp={config?.whatsapp} />
      <Hero whatsapp={config?.whatsapp} />
      <Categories categories={categories} onPick={setActiveCat} active={activeCat} />

      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex items-center gap-3 mb-8">
            <Wine className="w-5 h-5 text-[var(--gold-bright)]" />
            <h2 className="font-display font-bold text-2xl sm:text-3xl">{activeCatObj?.name || "Produtos"}</h2>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <ProductsGrid products={filtered} loading={loading} />
        </div>
      </section>

      <PromoDoDia promotions={promotions} />
      <Localizacao config={config} />
      <Footer config={config} />
      <FloatingWhatsapp whatsapp={config?.whatsapp} />
      <CartSheet whatsapp={config?.whatsapp} />
    </div>
  );
}

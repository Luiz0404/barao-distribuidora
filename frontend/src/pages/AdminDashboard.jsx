import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Crown, LogOut, Plus, Pencil, Trash2, Upload, Tag, Package, Flame, Settings, ImageOff, ExternalLink } from "lucide-react";

function money(v) { return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`; }

function useUpload() {
  const [uploading, setUploading] = useState(false);
  const upload = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      return r.data.url;
    } finally { setUploading(false); }
  };
  return { upload, uploading };
}

function ImagePicker({ value, onChange, testid }) {
  const inputRef = useRef();
  const { upload, uploading } = useUpload();
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-20 rounded-lg bg-black/40 border border-white/10 overflow-hidden grid place-items-center flex-shrink-0">
        {value ? <img src={fileUrl(value)} alt="" className="w-full h-full object-cover" /> : <ImageOff className="w-6 h-6 text-white/30" />}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try { const url = await upload(f); onChange(url); toast.success("Imagem enviada"); }
          catch { toast.error("Falha no upload"); }
        }} data-testid={`${testid}-file`} />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-outline-gold rounded-full h-9 px-4" data-testid={`${testid}-btn`}>
          <Upload className="w-4 h-4 mr-1.5" /> {uploading ? "Enviando..." : (value ? "Trocar foto" : "Enviar foto")}
        </Button>
        {value && <button type="button" onClick={() => onChange(null)} className="text-xs text-red-400 hover:text-red-300 text-left" data-testid={`${testid}-remove`}>Remover</button>}
      </div>
    </div>
  );
}

/* ============ PRODUCTS ============ */
function ProductsManager({ categories }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const empty = { name: "", description: "", category_slug: categories[0]?.slug || "", price: 0, promo_price: null, image_url: null, active: true };
  const [form, setForm] = useState(empty);

  const load = async () => { setLoading(true); const r = await api.get("/products?all=true"); setItems(r.data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = { ...form, price: Number(form.price), promo_price: form.promo_price ? Number(form.promo_price) : null };
      if (editing) await api.put(`/products/${editing.id}`, body);
      else await api.post("/products", body);
      toast.success("Produto salvo");
      setEditing(null); setForm({ ...empty, category_slug: categories[0]?.slug || "" });
      load();
    } catch (e) { toast.error("Erro ao salvar"); }
  };
  const edit = (p) => { setEditing(p); setForm({ ...p, promo_price: p.promo_price || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const del = async (id) => { if (!window.confirm("Excluir produto?")) return; await api.delete(`/products/${id}`); toast.success("Excluído"); load(); };
  const toggle = async (p) => { await api.put(`/products/${p.id}`, { ...p, active: !p.active }); load(); };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-4">{editing ? "Editar produto" : "Novo produto"}</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="prod-name" /></div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category_slug} onValueChange={(v) => setForm({ ...form, category_slug: v })}>
              <SelectTrigger className="bg-black/40 border-white/10 mt-1.5" data-testid="prod-category"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="prod-desc" /></div>
          <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="prod-price" /></div>
          <div><Label>Preço promocional (opcional)</Label><Input type="number" step="0.01" value={form.promo_price || ""} onChange={(e) => setForm({ ...form, promo_price: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="prod-promo" /></div>
          <div className="sm:col-span-2"><Label>Foto</Label><div className="mt-1.5"><ImagePicker value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} testid="prod-img" /></div></div>
          <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="prod-active" /><span className="text-sm text-white/70">Produto ativo</span></div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} className="btn-gold-glow rounded-full h-11 px-6 font-bold" data-testid="prod-save"><Plus className="w-4 h-4 mr-1" /> {editing ? "Salvar alterações" : "Adicionar produto"}</Button>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm({ ...empty, category_slug: categories[0]?.slug || "" }); }} data-testid="prod-cancel">Cancelar</Button>}
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-3">Produtos cadastrados ({items.length})</div>
        {loading ? <div className="text-white/50 text-sm">Carregando...</div> : (
          <div className="divide-y divide-white/5" data-testid="products-list">
            {items.map(p => (
              <div key={p.id} className="py-3 flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">{p.image_url && <img src={fileUrl(p.image_url)} className="w-full h-full object-cover" alt="" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-white/50">{p.category_slug} · {money(p.promo_price || p.price)} {!p.active && <span className="text-red-400">· indisponível</span>}</div>
                </div>
                <Switch checked={p.active} onCheckedChange={() => toggle(p)} data-testid={`prod-toggle-${p.id}`} />
                <button onClick={() => edit(p)} className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-white/30" data-testid={`prod-edit-${p.id}`}><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(p.id)} className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`prod-del-${p.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            ))}
            {!items.length && <div className="py-10 text-center text-white/50">Nenhum produto ainda.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ CATEGORIES ============ */
function CategoriesManager({ onChange }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const empty = { name: "", slug: "", image_url: null, active: true, order: 0 };
  const [form, setForm] = useState(empty);

  const load = async () => { const r = await api.get("/categories?all=true"); setItems(r.data); onChange?.(r.data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const body = { ...form, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), order: Number(form.order) };
    try {
      if (editing) await api.put(`/categories/${editing.id}`, body);
      else await api.post("/categories", body);
      toast.success("Categoria salva"); setEditing(null); setForm(empty); load();
    } catch { toast.error("Erro ao salvar"); }
  };
  const del = async (id) => { if (!window.confirm("Excluir categoria?")) return; await api.delete(`/categories/${id}`); load(); };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-4">{editing ? "Editar categoria" : "Nova categoria"}</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="cat-name" /></div>
          <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ex: bebidas" className="bg-black/40 border-white/10 mt-1.5" data-testid="cat-slug" /></div>
          <div><Label>Ordem</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="cat-order" /></div>
          <div className="flex items-center gap-2 mt-6"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="cat-active" /><span className="text-sm text-white/70">Ativa</span></div>
          <div className="sm:col-span-2"><Label>Imagem</Label><div className="mt-1.5"><ImagePicker value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} testid="cat-img" /></div></div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} className="btn-gold-glow rounded-full h-11 px-6 font-bold" data-testid="cat-save">{editing ? "Salvar" : "Adicionar"}</Button>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm(empty); }}>Cancelar</Button>}
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-3">Categorias ({items.length})</div>
        <div className="divide-y divide-white/5">
          {items.map(c => (
            <div key={c.id} className="py-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-black/40 overflow-hidden">{c.image_url && <img src={fileUrl(c.image_url)} className="w-full h-full object-cover" alt="" />}</div>
              <div className="flex-1"><div className="font-semibold">{c.name}</div><div className="text-xs text-white/50">/{c.slug} {!c.active && <span className="text-red-400">· inativa</span>}</div></div>
              <button onClick={() => { setEditing(c); setForm(c); }} className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-white/30" data-testid={`cat-edit-${c.id}`}><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(c.id)} className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`cat-del-${c.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ PROMOTIONS ============ */
function PromotionsManager({ products }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const empty = { product_id: products[0]?.id || "", promo_price: 0, starts_at: "", ends_at: "", image_url: null, active: true };
  const [form, setForm] = useState(empty);

  const load = async () => { const r = await api.get("/promotions?all=true"); setItems(r.data); };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!form.product_id && products.length) setForm(f => ({ ...f, product_id: products[0].id })); }, [products]);

  const save = async () => {
    const body = {
      product_id: form.product_id,
      promo_price: Number(form.promo_price),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      image_url: form.image_url,
      active: form.active,
    };
    try {
      if (editing) await api.put(`/promotions/${editing.id}`, body);
      else await api.post("/promotions", body);
      toast.success("Promoção salva"); setEditing(null); setForm({ ...empty, product_id: products[0]?.id || "" }); load();
    } catch { toast.error("Erro ao salvar"); }
  };
  const del = async (id) => { if (!window.confirm("Excluir promoção?")) return; await api.delete(`/promotions/${id}`); load(); };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-4">{editing ? "Editar promoção" : "Nova promoção"}</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Produto</Label>
            <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
              <SelectTrigger className="bg-black/40 border-white/10 mt-1.5" data-testid="promo-product"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {money(p.price)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Preço promocional</Label><Input type="number" step="0.01" value={form.promo_price} onChange={(e) => setForm({ ...form, promo_price: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="promo-price" /></div>
          <div className="flex items-center gap-2 mt-6"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="promo-active" /><span className="text-sm text-white/70">Ativa</span></div>
          <div><Label>Início (opcional)</Label><Input type="datetime-local" value={form.starts_at?.slice?.(0,16) || ""} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="promo-start" /></div>
          <div><Label>Fim (opcional)</Label><Input type="datetime-local" value={form.ends_at?.slice?.(0,16) || ""} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="promo-end" /></div>
          <div className="sm:col-span-2"><Label>Imagem da promoção (opcional)</Label><div className="mt-1.5"><ImagePicker value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} testid="promo-img" /></div></div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} className="btn-ember rounded-full h-11 px-6 font-bold" data-testid="promo-save">{editing ? "Salvar" : "Criar promoção"}</Button>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm({ ...empty, product_id: products[0]?.id || "" }); }}>Cancelar</Button>}
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-3">Promoções ({items.length})</div>
        <div className="divide-y divide-white/5">
          {items.map(p => (
            <div key={p.id} className="py-3 flex items-center gap-3">
              <div className="flex-1"><div className="font-semibold">{p.product?.name || "—"}</div><div className="text-xs text-white/50">Por {money(p.promo_price)} {!p.active && <span className="text-red-400">· inativa</span>}</div></div>
              <button onClick={() => { setEditing(p); setForm({ ...p, starts_at: p.starts_at || "", ends_at: p.ends_at || "" }); }} className="h-9 w-9 grid place-items-center rounded-full border border-white/10" data-testid={`promo-edit-${p.id}`}><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(p.id)} className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`promo-del-${p.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>
          ))}
          {!items.length && <div className="py-8 text-center text-white/50">Nenhuma promoção cadastrada.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============ CONFIG ============ */
function ConfigManager() {
  const [form, setForm] = useState({ whatsapp: "", instagram: "", address: "", hours: "", map_embed: "" });
  const load = async () => { const r = await api.get("/config"); setForm({ whatsapp: r.data.whatsapp || "", instagram: r.data.instagram || "", address: r.data.address || "", hours: r.data.hours || "", map_embed: r.data.map_embed || "" }); };
  useEffect(() => { load(); }, []);
  const save = async () => { try { await api.put("/config", form); toast.success("Configuração salva"); } catch { toast.error("Erro"); } };

  return (
    <div className="surface-card p-5 space-y-4 max-w-2xl">
      <div><Label>WhatsApp (só números, com DDI)</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5566992575143" className="bg-black/40 border-white/10 mt-1.5" data-testid="cfg-wa" /></div>
      <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="cfg-ig" /></div>
      <div><Label>Endereço</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="cfg-address" /></div>
      <div><Label>Horários de funcionamento</Label><Textarea value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="cfg-hours" /></div>
      <div><Label>Google Maps embed URL (opcional)</Label><Input value={form.map_embed} onChange={(e) => setForm({ ...form, map_embed: e.target.value })} placeholder="https://www.google.com/maps/embed?..." className="bg-black/40 border-white/10 mt-1.5" data-testid="cfg-map" /></div>
      <Button onClick={save} className="btn-gold-glow rounded-full h-11 px-6 font-bold" data-testid="cfg-save">Salvar configurações</Button>
    </div>
  );
}

/* ============ DASHBOARD ============ */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [tab, setTab] = useState("dashboard");

  const loadAll = async () => {
    const [c, p, pr] = await Promise.all([api.get("/categories?all=true"), api.get("/products?all=true"), api.get("/promotions?all=true")]);
    setCategories(c.data); setProducts(p.data); setPromotions(pr.data);
  };
  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (tab === "dashboard") loadAll(); }, [tab]);

  const logoutAndGo = () => { logout(); nav("/"); };

  const stats = [
    { label: "Produtos", value: products.length, icon: Package, testid: "stat-products" },
    { label: "Ativos", value: products.filter(p => p.active).length, icon: Tag, testid: "stat-active" },
    { label: "Indisponíveis", value: products.filter(p => !p.active).length, icon: ImageOff, testid: "stat-inactive" },
    { label: "Promoções", value: promotions.filter(p => p.active).length, icon: Flame, testid: "stat-promos" },
    { label: "Categorias", value: categories.length, icon: Tag, testid: "stat-categories" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Crown className="w-6 h-6 text-gold" />
          <div>
            <div className="font-display font-black gold-text text-xl leading-tight">Painel Barão</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">{user?.email}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="text-xs text-white/60 hover:text-white flex items-center gap-1" data-testid="view-site-link"><ExternalLink className="w-3.5 h-3.5" /> Ver site</a>
            <Button onClick={logoutAndGo} variant="ghost" className="text-white/70 hover:text-white" data-testid="logout-btn"><LogOut className="w-4 h-4 mr-1" /> Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[var(--surface)] border border-white/10 p-1 rounded-full">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Dashboard</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Produtos</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Categorias</TabsTrigger>
            <TabsTrigger value="promotions" data-testid="tab-promotions" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Promoções</TabsTrigger>
            <TabsTrigger value="config" data-testid="tab-config" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="surface-card p-5" data-testid={s.testid}>
                  <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest">
                    <s.icon className="w-4 h-4 text-[var(--gold-bright)]" /> {s.label}
                  </div>
                  <div className="mt-3 text-4xl font-display font-black gold-text">{s.value}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-6"><ProductsManager categories={categories} /></TabsContent>
          <TabsContent value="categories" className="mt-6"><CategoriesManager onChange={setCategories} /></TabsContent>
          <TabsContent value="promotions" className="mt-6"><PromotionsManager products={products} /></TabsContent>
          <TabsContent value="config" className="mt-6"><ConfigManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

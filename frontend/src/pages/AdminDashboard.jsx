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
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Crown, LogOut, Plus, Pencil, Trash2, Upload, Tag, Package, Flame, ImageOff,
  ExternalLink, DollarSign, ShoppingBag, TrendingUp, Ticket, Calendar, MessageCircle,
} from "lucide-react";

function money(v) { return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`; }
function fmtDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

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
          const f = e.target.files?.[0]; if (!f) return;
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

/* ============ DASHBOARD OVERVIEW ============ */
function DashboardOverview({ categories, products, promotions }) {
  const [stats, setStats] = useState({ orders_today: 0, revenue_today: 0, orders_total: 0, revenue_total: 0, top_products: [], recent_orders: [] });
  useEffect(() => { api.get("/orders/stats").then(r => setStats(r.data)).catch(() => {}); }, []);

  const cards = [
    { label: "Vendas hoje", value: money(stats.revenue_today), icon: DollarSign, color: "gold-text", testid: "stat-revenue-today" },
    { label: "Pedidos hoje", value: stats.orders_today, icon: ShoppingBag, color: "gold-text", testid: "stat-orders-today" },
    { label: "Total de vendas", value: money(stats.revenue_total), icon: TrendingUp, color: "text-white", testid: "stat-revenue-total" },
    { label: "Total de pedidos", value: stats.orders_total, icon: ShoppingBag, color: "text-white", testid: "stat-orders-total" },
    { label: "Produtos ativos", value: products.filter(p => p.active).length, icon: Package, color: "text-white", testid: "stat-products-active" },
    { label: "Promoções ativas", value: promotions.filter(p => p.active).length, icon: Flame, color: "text-white", testid: "stat-promos-active" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((s) => (
          <div key={s.label} className="surface-card p-4" data-testid={s.testid}>
            <div className="flex items-center gap-2 text-white/50 text-[11px] uppercase tracking-widest">
              <s.icon className="w-3.5 h-3.5 text-[var(--gold-bright)]" /> {s.label}
            </div>
            <div className={`mt-2 text-2xl sm:text-3xl font-display font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="surface-card p-5" data-testid="top-products-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[var(--gold-bright)]" />
            <div className="font-display font-bold text-lg">Top produtos vendidos</div>
          </div>
          {stats.top_products?.length ? (
            <ul className="space-y-2.5">
              {stats.top_products.map((p, i) => (
                <li key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 grid place-items-center text-xs font-bold gold-text">{i + 1}</div>
                  <div className="flex-1 min-w-0"><div className="font-semibold truncate">{p.name}</div><div className="text-xs text-white/50">{p.qty} unid. vendidas</div></div>
                  <div className="gold-text font-bold">{money(p.revenue)}</div>
                </li>
              ))}
            </ul>
          ) : <div className="text-white/50 text-sm py-4">Nenhuma venda registrada ainda.</div>}
        </div>

        <div className="surface-card p-5" data-testid="recent-orders-card">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-[var(--gold-bright)]" />
            <div className="font-display font-bold text-lg">Últimos pedidos</div>
          </div>
          {stats.recent_orders?.length ? (
            <ul className="space-y-3">
              {stats.recent_orders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{o.customer_name}</div>
                    <div className="text-xs text-white/50">{o.items?.length || 0} itens · {fmtDate(o.created_at)}</div>
                  </div>
                  <div className="gold-text font-bold">{money(o.total)}</div>
                </li>
              ))}
            </ul>
          ) : <div className="text-white/50 text-sm py-4">Nenhum pedido registrado ainda.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============ PRODUCTS ============ */
function ProductsManager({ categories, onChange }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const empty = { name: "", description: "", category_slug: categories[0]?.slug || "", price: 0, promo_price: null, image_url: null, active: true };
  const [form, setForm] = useState(empty);

  const load = async () => { setLoading(true); const r = await api.get("/products?all=true"); setItems(r.data); onChange?.(r.data); setLoading(false); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = { ...form, price: Number(form.price), promo_price: form.promo_price ? Number(form.promo_price) : null };
      if (editing) await api.put(`/products/${editing.id}`, body);
      else await api.post("/products", body);
      toast.success("Produto salvo");
      setEditing(null); setForm({ ...empty, category_slug: categories[0]?.slug || "" });
      load();
    } catch { toast.error("Erro ao salvar"); }
  };
  const edit = (p) => { setEditing(p); setForm({ ...p, promo_price: p.promo_price || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const del = async (id) => { try { await api.delete(`/products/${id}`); toast.success("Excluído"); load(); } catch { toast.error("Erro ao excluir"); } };
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
                <ConfirmDialog
                  title="Excluir produto?"
                  description={`Tem certeza que deseja excluir "${p.name}"? Todas as promoções vinculadas serão removidas.`}
                  confirmLabel="Excluir"
                  testid={`prod-del-${p.id}`}
                  onConfirm={() => del(p.id)}
                >
                  <button className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`prod-del-${p.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
                </ConfirmDialog>
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
  const del = async (id) => { try { await api.delete(`/categories/${id}`); toast.success("Excluída"); load(); } catch { toast.error("Erro ao excluir"); } };

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
              <ConfirmDialog
                title="Excluir categoria?"
                description={`Deseja excluir "${c.name}"? Produtos vinculados podem ficar sem categoria válida.`}
                confirmLabel="Excluir"
                testid={`cat-del-${c.id}`}
                onConfirm={() => del(c.id)}
              >
                <button className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`cat-del-${c.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
              </ConfirmDialog>
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
    } catch (err) {
      const d = err?.response?.data?.detail; toast.error(typeof d === "string" ? d : "Erro ao salvar");
    }
  };
  const del = async (id) => { try { await api.delete(`/promotions/${id}`); toast.success("Excluída"); load(); } catch { toast.error("Erro"); } };

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
              <ConfirmDialog
                title="Excluir promoção?"
                description="Esta promoção deixará de aparecer na página inicial."
                confirmLabel="Excluir"
                testid={`promo-del-${p.id}`}
                onConfirm={() => del(p.id)}
              >
                <button className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`promo-del-${p.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
              </ConfirmDialog>
            </div>
          ))}
          {!items.length && <div className="py-8 text-center text-white/50">Nenhuma promoção cadastrada.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============ ORDERS ============ */
function OrdersManager() {
  const [scope, setScope] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = async () => { setLoading(true); const r = await api.get(`/orders?scope=${scope}`); setItems(r.data); setLoading(false); };
  useEffect(() => { load(); }, [scope]);

  const del = async (id) => { try { await api.delete(`/orders/${id}`); toast.success("Pedido removido"); load(); } catch { toast.error("Erro"); } };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="surface-card inline-flex p-1 rounded-full">
          <button onClick={() => setScope("all")} className={`px-4 py-1.5 text-sm rounded-full ${scope === "all" ? "bg-[var(--gold)] text-black font-bold" : "text-white/70"}`} data-testid="orders-filter-all">Todos</button>
          <button onClick={() => setScope("today")} className={`px-4 py-1.5 text-sm rounded-full ${scope === "today" ? "bg-[var(--gold)] text-black font-bold" : "text-white/70"}`} data-testid="orders-filter-today">Hoje</button>
        </div>
        <div className="text-xs text-white/50 ml-auto">{items.length} pedido{items.length === 1 ? "" : "s"}</div>
      </div>

      <div className="surface-card divide-y divide-white/5" data-testid="orders-list">
        {loading && <div className="p-6 text-white/50 text-sm">Carregando...</div>}
        {!loading && !items.length && <div className="p-10 text-center text-white/50">Nenhum pedido {scope === "today" ? "hoje" : "registrado"}.</div>}
        {items.map((o) => {
          const isOpen = expanded === o.id;
          return (
            <div key={o.id} className="p-4" data-testid={`order-row-${o.id}`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 grid place-items-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-[var(--gold-bright)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{o.customer_name}</div>
                  <div className="text-xs text-white/50 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(o.created_at)}</span>
                    <span>·</span>
                    <span>{o.items?.length || 0} itens</span>
                    {o.coupon_code && <><span>·</span><span className="inline-flex items-center gap-1 text-[var(--gold-bright)]"><Ticket className="w-3 h-3" /> {o.coupon_code}</span></>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="gold-text font-bold">{money(o.total)}</div>
                  {o.discount > 0 && <div className="text-[10px] text-[var(--ember)]">-{money(o.discount)}</div>}
                </div>
                <button onClick={() => setExpanded(isOpen ? null : o.id)} className="text-xs text-white/60 hover:text-white px-3 py-1 rounded-full border border-white/10" data-testid={`order-toggle-${o.id}`}>
                  {isOpen ? "Ocultar" : "Detalhes"}
                </button>
                <ConfirmDialog
                  title="Excluir pedido?"
                  description="Este pedido será removido do histórico."
                  confirmLabel="Excluir"
                  testid={`order-del-${o.id}`}
                  onConfirm={() => del(o.id)}
                >
                  <button className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`order-del-${o.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
                </ConfirmDialog>
              </div>
              {isOpen && (
                <div className="mt-3 pl-13 pl-[52px] pr-2">
                  <div className="rounded-xl bg-black/40 border border-white/5 p-3 text-sm">
                    <ul className="divide-y divide-white/5">
                      {(o.items || []).map((it, i) => (
                        <li key={i} className="py-1.5 flex justify-between">
                          <span className="text-white/85">{it.qty}× {it.name}</span>
                          <span className="gold-text">{money(it.qty * it.unit_price)}</span>
                        </li>
                      ))}
                    </ul>
                    {o.notes && <div className="mt-2 pt-2 border-t border-white/5 text-white/60"><span className="text-white/40">Obs:</span> {o.notes}</div>}
                    <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-xs">
                      <span className="text-white/50">Subtotal: {money(o.subtotal)}{o.discount > 0 ? ` · Desconto: -${money(o.discount)}` : ""}</span>
                      <span className="font-bold gold-text">Total {money(o.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ COUPONS ============ */
function CouponsManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const empty = { code: "", percent_off: 10, active: true, expires_at: "", max_uses: null };
  const [form, setForm] = useState(empty);

  const load = async () => { const r = await api.get("/coupons"); setItems(r.data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const body = {
      code: (form.code || "").trim().toUpperCase(),
      percent_off: Number(form.percent_off),
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
    };
    try {
      if (editing) await api.put(`/coupons/${editing.id}`, body);
      else await api.post("/coupons", body);
      toast.success("Cupom salvo"); setEditing(null); setForm(empty); load();
    } catch (err) {
      const d = err?.response?.data?.detail; toast.error(typeof d === "string" ? d : "Erro ao salvar");
    }
  };
  const del = async (id) => { try { await api.delete(`/coupons/${id}`); toast.success("Excluído"); load(); } catch { toast.error("Erro"); } };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[var(--gold-bright)]" /> {editing ? "Editar cupom" : "Novo Cupom do Rolê"}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Código</Label>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Ex.: BARAO10" className="bg-black/40 border-white/10 mt-1.5 uppercase tracking-widest" data-testid="coupon-code" />
          </div>
          <div><Label>Desconto (%)</Label><Input type="number" min="1" max="100" value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="coupon-percent" /></div>
          <div><Label>Expira em (opcional)</Label><Input type="datetime-local" value={form.expires_at?.slice?.(0,16) || ""} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="coupon-expires" /></div>
          <div><Label>Máximo de usos (opcional)</Label><Input type="number" min="1" value={form.max_uses || ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="bg-black/40 border-white/10 mt-1.5" data-testid="coupon-max-uses" /></div>
          <div className="flex items-center gap-2 mt-4 sm:col-span-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="coupon-active" /><span className="text-sm text-white/70">Cupom ativo</span></div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} className="btn-gold-glow rounded-full h-11 px-6 font-bold" data-testid="coupon-save">
            <Plus className="w-4 h-4 mr-1" /> {editing ? "Salvar" : "Criar cupom"}
          </Button>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm(empty); }} data-testid="coupon-cancel">Cancelar</Button>}
        </div>
        <p className="mt-3 text-xs text-white/40">Clientes digitam esse código no checkout e ganham desconto no total do pedido.</p>
      </div>

      <div className="surface-card p-5">
        <div className="font-display font-bold text-lg mb-3">Cupons ({items.length})</div>
        <div className="divide-y divide-white/5" data-testid="coupons-list">
          {items.map(c => (
            <div key={c.id} className="py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 grid place-items-center"><Ticket className="w-4 h-4 text-[var(--gold-bright)]" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold tracking-widest">{c.code}</div>
                <div className="text-xs text-white/50">
                  {c.percent_off}% off · usado {c.uses || 0}{c.max_uses ? `/${c.max_uses}` : ""} vez{(c.uses || 0) === 1 ? "" : "es"}
                  {c.expires_at && ` · expira ${fmtDate(c.expires_at)}`}
                  {!c.active && <span className="text-red-400"> · inativo</span>}
                </div>
              </div>
              <button onClick={() => { setEditing(c); setForm({ ...c, expires_at: c.expires_at || "" }); }} className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-white/30" data-testid={`coupon-edit-${c.id}`}><Pencil className="w-4 h-4" /></button>
              <ConfirmDialog
                title="Excluir cupom?"
                description={`O cupom "${c.code}" deixará de ser válido.`}
                confirmLabel="Excluir"
                testid={`coupon-del-${c.id}`}
                onConfirm={() => del(c.id)}
              >
                <button className="h-9 w-9 grid place-items-center rounded-full border border-white/10 hover:border-red-400/50" data-testid={`coupon-del-${c.id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
              </ConfirmDialog>
            </div>
          ))}
          {!items.length && <div className="py-8 text-center text-white/50">Nenhum cupom criado ainda.</div>}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[var(--surface)] border border-white/10 p-1 rounded-full flex flex-wrap h-auto">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Dashboard</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Pedidos</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Produtos</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Categorias</TabsTrigger>
            <TabsTrigger value="promotions" data-testid="tab-promotions" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Promoções</TabsTrigger>
            <TabsTrigger value="coupons" data-testid="tab-coupons" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Cupons</TabsTrigger>
            <TabsTrigger value="config" data-testid="tab-config" className="rounded-full data-[state=active]:bg-[var(--gold)] data-[state=active]:text-black">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardOverview categories={categories} products={products} promotions={promotions} /></TabsContent>
          <TabsContent value="orders" className="mt-6"><OrdersManager /></TabsContent>
          <TabsContent value="products" className="mt-6"><ProductsManager categories={categories} onChange={setProducts} /></TabsContent>
          <TabsContent value="categories" className="mt-6"><CategoriesManager onChange={setCategories} /></TabsContent>
          <TabsContent value="promotions" className="mt-6"><PromotionsManager products={products} /></TabsContent>
          <TabsContent value="coupons" className="mt-6"><CouponsManager /></TabsContent>
          <TabsContent value="config" className="mt-6"><ConfigManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

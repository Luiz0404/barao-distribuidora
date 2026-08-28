import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Ticket, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";

function money(v) { return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`; }

export default function CheckoutDialog({ open, setOpen, whatsapp }) {
  const { items, subtotal, discount, total, priceOf, clear, setOpen: setCartOpen, coupon, setCoupon } = useCart();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [sending, setSending] = useState(false);

  const apply = async () => {
    const c = (codeInput || "").trim().toUpperCase();
    if (!c) return;
    setApplying(true);
    try {
      const r = await api.post("/coupons/validate", { code: c });
      setCoupon(r.data);
      setCodeInput("");
      toast.success(`Cupom ${r.data.code} aplicado — ${r.data.percent_off}% off`);
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Cupom inválido");
    } finally { setApplying(false); }
  };

  const removeCoupon = () => { setCoupon(null); toast.info("Cupom removido"); };

  const send = async () => {
    if (!items.length) return;
    setSending(true);
    try {
      const payload = {
        customer_name: name || "Cliente",
        notes: notes || "",
        items: items.map((i) => ({ product_id: i.id, name: i.name, qty: i.qty, unit_price: priceOf(i) })),
        subtotal, discount, total,
        coupon_code: coupon?.code || null,
      };
      try { await api.post("/orders", payload); } catch (_) { /* best-effort: still open WA */ }

      const lines = items.map((i) => `${i.qty}x ${i.name} — ${money(priceOf(i) * i.qty)}`).join("\n");
      const couponLine = coupon ? `\nCupom: ${coupon.code} (-${coupon.percent_off}%) → ${money(discount)} de desconto` : "";
      const msg =
`Olá, Barão Distribuidora! Gostaria de fazer um pedido.

Nome: ${name || "—"}

PEDIDO:
${lines}${couponLine}

Subtotal: ${money(subtotal)}${coupon ? `\nDesconto: -${money(discount)}` : ""}
TOTAL: ${money(total)}

Observações:
${notes || "Sem observações."}`;
      const url = `https://wa.me/${whatsapp || "5566992575143"}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
      clear();
      setOpen(false);
      setCartOpen(false);
      toast.success("Pedido enviado — obrigado! 🍻");
    } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[var(--surface)] border border-white/10 text-white max-w-md" data-testid="checkout-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Finalizar Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ck-name" className="text-white/70">Seu nome</Label>
            <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" className="bg-black/40 border-white/10 mt-1.5" data-testid="checkout-name" />
          </div>
          <div>
            <Label htmlFor="ck-notes" className="text-white/70">Observações (opcional)</Label>
            <Textarea id="ck-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Endereço, ponto de referência, preferências..." className="bg-black/40 border-white/10 mt-1.5 min-h-[80px]" data-testid="checkout-notes" />
          </div>

          <div className="rounded-xl border border-[var(--line-gold)] bg-black/40 p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--gold-bright)] mb-2">
              <Ticket className="w-3.5 h-3.5" /> Cupom do Rolê
            </div>
            {coupon ? (
              <div className="flex items-center gap-2" data-testid="coupon-applied">
                <div className="flex-1 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="font-semibold">{coupon.code}</div>
                    <div className="text-xs text-white/60">{coupon.percent_off}% de desconto</div>
                  </div>
                </div>
                <button onClick={removeCoupon} className="h-8 w-8 grid place-items-center rounded-full border border-white/10 hover:border-red-400/60" data-testid="coupon-remove"><X className="w-4 h-4 text-red-400" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="Ex.: BARAO10" className="bg-black/40 border-white/10 uppercase tracking-widest" data-testid="coupon-input" />
                <Button onClick={apply} disabled={applying || !codeInput.trim()} className="btn-outline-gold rounded-full h-10 px-4 font-semibold" data-testid="coupon-apply">
                  {applying ? "..." : "Aplicar"}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 p-3 bg-black/30 max-h-40 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-1 text-sm">
                <span className="text-white/80 truncate mr-2">{i.qty}× {i.name}</span>
                <span className="gold-text font-semibold whitespace-nowrap">{money(priceOf(i) * i.qty)}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-white/10 space-y-1 text-sm">
              <div className="flex justify-between text-white/70"><span>Subtotal</span><span data-testid="checkout-subtotal">{money(subtotal)}</span></div>
              {coupon && <div className="flex justify-between text-[var(--ember)]"><span>Desconto ({coupon.percent_off}%)</span><span data-testid="checkout-discount">-{money(discount)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-white/10">
                <span>Total</span><span className="gold-text" data-testid="checkout-total">{money(total)}</span>
              </div>
            </div>
          </div>

          <Button onClick={send} disabled={!items.length || sending} className="btn-gold-glow w-full rounded-full h-12 font-bold text-base" data-testid="checkout-send-wa">
            <MessageCircle className="w-5 h-5 mr-2" /> {sending ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

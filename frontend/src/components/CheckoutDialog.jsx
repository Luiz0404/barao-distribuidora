import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

function money(v) { return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`; }

export default function CheckoutDialog({ open, setOpen, whatsapp }) {
  const { items, total, priceOf, clear, setOpen: setCartOpen } = useCart();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const send = () => {
    const lines = items.map((i) => `${i.qty}x ${i.name} — ${money(priceOf(i) * i.qty)}`).join("\n");
    const msg = `Olá, Barão Distribuidora! Gostaria de fazer um pedido.\n\nNome: ${name || "—"}\n\nPEDIDO:\n${lines}\n\nObservações:\n${notes || "Sem observações."}\n\nTOTAL: ${money(total)}`;
    const url = `https://wa.me/${whatsapp || "5566992575143"}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    clear();
    setOpen(false);
    setCartOpen(false);
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
            <Textarea id="ck-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Endereço, ponto de referência, preferências..." className="bg-black/40 border-white/10 mt-1.5 min-h-[90px]" data-testid="checkout-notes" />
          </div>

          <div className="rounded-xl border border-white/10 p-3 bg-black/30 max-h-40 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-1 text-sm">
                <span className="text-white/80">{i.qty}× {i.name}</span>
                <span className="gold-text font-semibold">{money(priceOf(i) * i.qty)}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between font-bold">
              <span>Total</span><span className="gold-text">{money(total)}</span>
            </div>
          </div>

          <Button onClick={send} disabled={!items.length} className="btn-gold-glow w-full rounded-full h-12 font-bold text-base" data-testid="checkout-send-wa">
            <MessageCircle className="w-5 h-5 mr-2" /> Enviar pedido pelo WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { fileUrl } from "@/lib/api";
import CheckoutDialog from "@/components/CheckoutDialog";

function money(v) { return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`; }

export default function CartSheet({ whatsapp }) {
  const { items, open, setOpen, incItem, decItem, removeItem, clear, total, priceOf } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="bg-[var(--surface)] border-l border-[var(--line)] text-white w-full sm:max-w-md p-0 flex flex-col" data-testid="cart-sheet">
          <SheetHeader className="p-5 border-b border-white/10">
            <SheetTitle className="text-white font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[var(--gold-bright)]" /> Seu Carrinho
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-white/50" data-testid="cart-empty">
                Seu carrinho está vazio. Adicione produtos para continuar.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map((i) => (
                  <li key={i.id} className="p-4 flex gap-3" data-testid={`cart-item-${i.id}`}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--surface-2)] flex-shrink-0">
                      {i.image_url && <img src={fileUrl(i.image_url)} alt={i.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{i.name}</div>
                      <div className="text-xs text-white/50 mt-0.5">{money(priceOf(i))} un.</div>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => decItem(i.id)} className="w-7 h-7 rounded-full border border-white/10 grid place-items-center hover:bg-white/5" data-testid={`cart-dec-${i.id}`}><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-sm w-6 text-center font-semibold" data-testid={`cart-qty-${i.id}`}>{i.qty}</span>
                        <button onClick={() => incItem(i.id)} className="w-7 h-7 rounded-full border border-white/10 grid place-items-center hover:bg-white/5" data-testid={`cart-inc-${i.id}`}><Plus className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeItem(i.id)} className="ml-auto w-7 h-7 rounded-full border border-white/10 grid place-items-center hover:bg-red-500/10 hover:border-red-500/50" data-testid={`cart-remove-${i.id}`}><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                      </div>
                    </div>
                    <div className="text-sm font-bold gold-text whitespace-nowrap">{money(priceOf(i) * i.qty)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-white/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Total</span>
                <span className="text-2xl font-black gold-text" data-testid="cart-total">{money(total)}</span>
              </div>
              <Button onClick={() => setCheckoutOpen(true)} className="btn-gold-glow w-full rounded-full h-12 font-bold text-base" data-testid="cart-checkout-btn">
                <MessageCircle className="w-5 h-5 mr-2" /> Finalizar pedido
              </Button>
              <button onClick={clear} className="w-full text-xs text-white/40 hover:text-white/80" data-testid="cart-clear-btn">Limpar carrinho</button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutDialog open={checkoutOpen} setOpen={setCheckoutOpen} whatsapp={whatsapp} />
    </>
  );
}

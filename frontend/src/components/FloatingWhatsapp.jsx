import React from "react";
import { MessageCircle } from "lucide-react";

export default function FloatingWhatsapp({ whatsapp }) {
  const wa = whatsapp || "5566992575143";
  return (
    <a
      href={`https://wa.me/${wa}?text=${encodeURIComponent("Olá, Barão Distribuidora!")}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#25D366] grid place-items-center shadow-[0_10px_40px_-6px_rgba(37,211,102,0.5)] hover:brightness-110 transition-[filter] duration-200"
      data-testid="floating-whatsapp"
      aria-label="Chamar Barão no WhatsApp"
    >
      <span className="pulse-ring" />
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
}

import React from "react";
import { MapPin, Clock, Navigation, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Localizacao({ config }) {
  const address = config?.address || "Configure o endereço no painel";
  const hours = config?.hours || "Segunda a Domingo — 10h às 00h";
  const embed = config?.map_embed;
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const wa = config?.whatsapp || "5566992575143";

  return (
    <section id="localizacao" className="py-24 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--gold-bright)] mb-3">Onde estamos</div>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight" data-testid="localizacao-title">
            Passa lá no <span className="gold-text">Barão</span>
          </h2>

          <div className="mt-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 grid place-items-center flex-shrink-0"><MapPin className="w-5 h-5 text-[var(--gold-bright)]" /></div>
              <div>
                <div className="text-xs text-white/50 uppercase tracking-widest">Endereço</div>
                <div className="text-white/90" data-testid="localizacao-address">{address}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 grid place-items-center flex-shrink-0"><Clock className="w-5 h-5 text-[var(--gold-bright)]" /></div>
              <div>
                <div className="text-xs text-white/50 uppercase tracking-widest">Horário</div>
                <div className="text-white/90 whitespace-pre-line" data-testid="localizacao-hours">{hours}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={mapsSearch} target="_blank" rel="noreferrer" data-testid="btn-como-chegar">
              <Button className="btn-gold-glow rounded-full h-12 px-5 font-semibold"><Navigation className="w-4 h-4 mr-2" /> Como Chegar</Button>
            </a>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" data-testid="btn-loc-pedir">
              <Button className="btn-outline-gold rounded-full h-12 px-5 font-semibold"><MessageCircle className="w-4 h-4 mr-2" /> Fazer pedido</Button>
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/3] surface-card overflow-hidden">
          {embed ? (
            <iframe title="Mapa" src={embed} className="w-full h-full" loading="lazy" />
          ) : (
            <iframe
              title="Mapa"
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="w-full h-full grayscale-[.3] contrast-125"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </section>
  );
}

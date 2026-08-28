import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Crown, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Bem-vindo, Barão!");
      nav("/admin");
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Falha ao entrar");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 relative overflow-hidden">
      <div className="smoke-layer" />
      <div className="grain-overlay" />
      <div className="relative w-full max-w-md surface-card p-8 sm:p-10" data-testid="admin-login-card">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white/80 mb-6" data-testid="back-home-link">← Voltar ao site</Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-11 w-11 rounded-full bg-[var(--gold)]/10 grid place-items-center border border-[var(--gold)]/30">
            <Crown className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="font-display font-black text-2xl gold-text">Painel Barão</div>
            <div className="text-xs text-white/50 uppercase tracking-widest">Acesso restrito</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/60">Faça login para gerenciar produtos, promoções e configurações da loja.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="login-email" className="text-white/70">E-mail</Label>
            <Input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="bg-black/40 border-white/10 mt-1.5" data-testid="login-email" />
          </div>
          <div>
            <Label htmlFor="login-password" className="text-white/70">Senha</Label>
            <Input id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="bg-black/40 border-white/10 mt-1.5" data-testid="login-password" />
          </div>
          <Button type="submit" disabled={loading} className="btn-gold-glow w-full rounded-full h-12 font-bold" data-testid="login-submit">
            {loading ? "Entrando..." : (<><LogIn className="w-4 h-4 mr-2" /> Entrar</>)}
          </Button>
        </form>
        <p className="mt-6 text-xs text-white/40 flex items-center gap-1"><Lock className="w-3 h-3" /> Apenas o proprietário tem acesso a esta área.</p>
      </div>
    </div>
  );
}

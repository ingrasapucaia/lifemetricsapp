import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get("error");
      const errorDescription = params.get("error_description");
      if (error) {
        toast.error(errorDescription || `Erro no login: ${error}`);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (user && !profileLoading) {
      if (profile && !profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, profile, profileLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === "Email not confirmed") {
        toast.error("Verifique seu e-mail antes de fazer login. Enviamos um link de confirmação quando você se cadastrou.");
      } else if (error.message === "Invalid login credentials") {
        toast.error("E-mail ou senha incorretos. Verifique e tente novamente.");
      } else {
        toast.error(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">metrics</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">performance pessoal</p>
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6 space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="space-y-1.5">
                <Label>Senha</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <Link to="/cadastro" className="text-sm text-primary hover:underline block">Não tem conta? Criar agora</Link>
              <Link to="/recuperar-senha" className="text-xs text-muted-foreground hover:underline block">Esqueci minha senha</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

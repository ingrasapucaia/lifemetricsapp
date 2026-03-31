import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { isPasswordPwned } from "@/lib/password-check";

const KIWIFY_LINK = "https://pay.kiwify.com.br"; // TODO: substituir pelo link real

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) { toast.error("As senhas não coincidem"); return; }
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true);

    // Check if email has an active purchase (secure RPC)
    const { data: hasPending, error: rpcError } = await supabase
      .rpc("check_pending_premium", { check_email: email.toLowerCase().trim() });

    if (rpcError || !hasPending) {
      toast.error(
        "Esse e-mail não tem um plano ativo. Verifique se usou o mesmo e-mail da sua compra ou adquira seu acesso.",
        { duration: 8000 }
      );
      setLoading(false);
      return;
    }

    const { pwned, count } = await isPasswordPwned(password);
    if (pwned) {
      toast.error(`Esta senha já apareceu em ${count.toLocaleString("pt-BR")} vazamentos de dados. Escolha uma senha mais segura.`);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">metrics</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">crie sua conta</p>
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6 space-y-5">
            {/* Aviso sobre e-mail da compra */}
            <div className="flex items-start gap-2 rounded-lg bg-accent border border-border p-3">
              <AlertTriangle size={18} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">
                <strong>Importante:</strong> Use o mesmo e-mail da sua compra para ativar seu acesso premium.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
              </div>
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
              <div className="space-y-1.5">
                <Label>Confirmar senha</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? "Criando..." : "Criar conta"}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <Link to="/login" className="text-sm text-primary hover:underline block">Já tenho conta. Entrar</Link>
              <a
                href={KIWIFY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:underline block"
              >
                Ainda não comprou? Adquira seu acesso
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

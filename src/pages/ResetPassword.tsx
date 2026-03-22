import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">metrics</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">recuperar senha</p>
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 size={48} className="mx-auto text-primary" />
                <p className="text-sm text-foreground font-medium">Link enviado!</p>
                <p className="text-xs text-muted-foreground">
                  Verifique sua caixa de entrada para redefinir a senha.
                </p>
                <Link to="/login" className="text-sm text-primary hover:underline block mt-4">
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
                <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-2">
                  <ArrowLeft size={14} /> Voltar para o login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, CircleDot, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Assessment {
  id: string;
  name: string;
  average_score: number;
  created_at: string;
}

export default function LifeWheel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAssessments();
  }, [user]);

  async function loadAssessments() {
    const { data, error } = await supabase
      .from("life_wheel_assessments")
      .select("id, name, average_score, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) setAssessments(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("life_wheel_assessments").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir avaliação");
    } else {
      setAssessments((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success("Avaliação excluída");
    }
    setDeleteId(null);
  }

  function getScoreColor(score: number) {
    if (score >= 8) return "bg-green-100 text-green-700";
    if (score >= 6) return "bg-yellow-100 text-yellow-700";
    if (score >= 4) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Roda da Vida</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Avalie cada área da sua vida de 1-10.</p>
        </div>
        {assessments.length > 0 && (
          <Button size="sm" onClick={() => navigate("/roda-da-vida/nova")}>
            <Plus size={16} className="mr-1" /> Nova avaliação
          </Button>
        )}
      </div>

      {/* List or empty */}
      {assessments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <CircleDot size={48} className="text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">Nenhuma avaliação ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie sua primeira Roda da Vida para fazer uma análise 360º da sua vida e descobrir como você pode evoluir.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/roda-da-vida/nova")}>
              <Plus size={16} className="mr-1" /> Criar minha primeira avaliação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getScoreColor(a.average_score)}`}>
                    {Number(a.average_score).toFixed(1)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/roda-da-vida/${a.id}`)}>
                        <Eye size={14} className="mr-2" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(a.id)} className="text-destructive">
                        <Trash2 size={14} className="mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

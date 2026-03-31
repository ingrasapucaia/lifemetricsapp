import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useTasks, Task, TaskInsert, TaskUpdate } from "@/hooks/useTasks";
import TaskModal from "@/components/tasks/TaskModal";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, StickyNote } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getLifeArea } from "@/types";

const PRIORITY_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" };

const LIFE_AREA_BAR_COLORS: Record<string, string> = {
  saude: "#9FE1CB",
  profissional: "#B5D4F4",
  financeiro: "#C0DD97",
  estudos: "#CECBF6",
  autocuidado: "#F4C0D1",
  espiritualidade: "#FAC775",
  familia: "#F5C4B3",
  relacionamentos: "#FCDDE8",
  esportes: "#7BE3E6",
  hobbie: "#D4B8F0",
  contribuicao_social: "#D3D1C7",
};

function getTaskBarColor(lifeAreas: string[] | null): string {
  if (!lifeAreas || lifeAreas.length === 0) return "#E5E5EA";
  return LIFE_AREA_BAR_COLORS[lifeAreas[0]] || "#E5E5EA";
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const aTime = a.due_time || "";
    const bTime = b.due_time || "";
    if (aTime && !bTime) return -1;
    if (!aTime && bTime) return 1;
    if (aTime && bTime) return aTime.localeCompare(bTime);
    return 0;
  });
}

interface AgendaProps {
  selectedDate?: string;
}

export default function Agenda({ selectedDate }: AgendaProps) {
  const { tasks, toggleTask, addTask, updateTask, deleteTask } = useTasks();
  const dateStr = selectedDate || format(new Date(), "yyyy-MM-dd");
  const dateTasks = sortTasks(tasks.filter((t) => t.date === dateStr));

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [noteTask, setNoteTask] = useState<Task | null>(null);
  const [noteText, setNoteText] = useState("");
  const [delTarget, setDelTarget] = useState<string | null>(null);

  const handleSave = async (data: TaskInsert | TaskUpdate, id?: string) => {
    if (id) {
      await updateTask(id, data);
    } else {
      await addTask(data as TaskInsert);
    }
  };

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  const handleAddNote = (task: Task) => {
    setNoteTask(task);
    setNoteText(task.note || "");
  };

  const handleSaveNote = async () => {
    if (!noteTask) return;
    await updateTask(noteTask.id, { note: noteText.trim() || null });
    setNoteTask(null);
    toast.success("Nota salva!");
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    await deleteTask(delTarget);
    setDelTarget(null);
    toast("Tarefa excluída");
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-foreground" style={{ fontSize: 16 }}>Agenda</h2>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {format(new Date(dateStr + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: pt })}
          </p>
        </div>
        <button
          onClick={() => { setEditTask(null); setModalOpen(true); }}
          className="text-xs text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1"
        >
          <Plus size={14} /> Nova tarefa
        </button>
      </div>

      {dateTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nenhuma tarefa para este dia</p>
      ) : (
        <div className="space-y-2">
          {dateTasks.map((task) => {
            const borderColor = getTaskBorderColor(task.life_areas);
            return (
              <Card key={task.id} className={cn("transition-all duration-200 overflow-hidden", task.completed && "opacity-50")}>
                <CardContent className="py-3.5 pr-4 pl-0 flex items-center gap-3">
                  {/* Colored left border */}
                  <div className="w-[3px] self-stretch rounded-full shrink-0" style={{ backgroundColor: borderColor }} />

                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="rounded-full h-5 w-5 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block font-medium truncate",
                      task.completed && "line-through text-muted-foreground"
                    )} style={{ fontSize: 14 }}>
                      {task.title}
                    </span>
                    {task.due_time && (
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        {task.due_time}
                      </span>
                    )}
                  </div>

                  {task.note && <StickyNote size={14} className="text-muted-foreground shrink-0" />}
                  <span
                    className="rounded-full font-medium shrink-0"
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      backgroundColor: PRIORITY_COLORS[task.priority].bg,
                      color: PRIORITY_COLORS[task.priority].text,
                    }}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-lg hover:bg-muted/50 transition-colors shrink-0">
                        <MoreVertical size={16} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(task)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddNote(task)}>
                        {task.note ? "Ver/editar nota" : "Adicionar nota"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDelTarget(task.id)}>Apagar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onOpenChange={(o) => { setModalOpen(o); if (!o) setEditTask(null); }}
        task={editTask}
        defaultDate={dateStr}
        onSave={handleSave}
      />

      {/* Note dialog */}
      <AlertDialog open={!!noteTask} onOpenChange={(o) => !o && setNoteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nota da tarefa</AlertDialogTitle>
            <AlertDialogDescription>{noteTask?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Adicionar uma nota..."
            className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveNote}>Salvar nota</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

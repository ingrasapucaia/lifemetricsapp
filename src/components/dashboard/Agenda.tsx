import { useState, useMemo } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useTasks, Task, TaskInsert, TaskUpdate } from "@/hooks/useTasks";
import TaskModal from "@/components/tasks/TaskModal";
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

const PRIORITY_COLORS = {
  alta: { bg: "#FCEBEB", text: "#A32D2D" },
  media: { bg: "#FDF3DC", text: "#7A5C00" },
  baixa: { bg: "#F1EFE8", text: "#5F5E5A" },
};

const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 };
const PRIORITY_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" };

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority first
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    // Uncompleted first
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0;
  });
}

export default function Agenda() {
  const { tasks, toggleTask, addTask, updateTask, deleteTask } = useTasks();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayTasks = sortTasks(tasks.filter((t) => t.date === today));

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
        <h2 className="text-base font-semibold text-foreground">Agenda</h2>
        <button
          onClick={() => { setEditTask(null); setModalOpen(true); }}
          className="text-xs text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1"
        >
          <Plus size={14} /> Nova tarefa
        </button>
      </div>

      {todayTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nenhuma tarefa para hoje</p>
      ) : (
        <div className="space-y-1.5">
          {todayTasks.map((task) => (
            <Card key={task.id} className={cn("transition-all duration-200", task.completed && "opacity-50")}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="rounded-full"
                />
                <span className={cn(
                  "flex-1 text-sm font-medium truncate",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </span>
                {task.note && <StickyNote size={14} className="text-muted-foreground shrink-0" />}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{
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
          ))}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onOpenChange={(o) => { setModalOpen(o); if (!o) setEditTask(null); }}
        task={editTask}
        defaultDate={today}
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

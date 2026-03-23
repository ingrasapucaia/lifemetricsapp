import { useState, useMemo, useCallback } from "react";
import { useTasks, Task, TaskInsert, TaskUpdate } from "@/hooks/useTasks";
import { useStore } from "@/hooks/useStore";
import TaskModal from "@/components/tasks/TaskModal";
import { DailyRecord, MOOD_TAGS, getMoodTag, Habit, formatSleepHours } from "@/types";
import { LifeAreaBadge } from "@/components/LifeAreaBadge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { MoreVertical, Plus, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isHabitCompleted } from "@/lib/metrics";

const PRIORITY_COLORS = {
  alta: { bg: "#FCEBEB", text: "#A32D2D" },
  media: { bg: "#FDF3DC", text: "#7A5C00" },
  baixa: { bg: "#F1EFE8", text: "#5F5E5A" },
};
const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 };
const PRIORITY_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" };

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0;
  });
}

function TimeSelect({ hours, minutes, onChangeHours, onChangeMinutes }: {
  hours: number; minutes: number;
  onChangeHours: (h: number) => void; onChangeMinutes: (m: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={String(hours)} onValueChange={(v) => onChangeHours(Number(v))}>
        <SelectTrigger className="w-[72px] rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Array.from({ length: 24 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}h</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(minutes)} onValueChange={(v) => onChangeMinutes(Number(v))}>
        <SelectTrigger className="w-[80px] rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Array.from({ length: 60 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}min</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function calculateSleepDuration(sleepTime: string, wakeTime: string): number {
  if (!sleepTime || !wakeTime) return 0;
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let sleepMins = sh * 60 + sm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= sleepMins) wakeMins += 24 * 60;
  return +(( wakeMins - sleepMins) / 60).toFixed(2);
}

export default function AgendaTab() {
  const { tasks, toggleTask, addTask, updateTask, deleteTask } = useTasks();
  const { records, habits, upsertRecord } = useStore();
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const dateStr = selected ? format(selected, "yyyy-MM-dd") : "";
  const today = format(new Date(), "yyyy-MM-dd");
  const isPast = dateStr < today;

  const dayTasks = useMemo(() => sortTasks(tasks.filter((t) => t.date === dateStr)), [tasks, dateStr]);
  const completedCount = dayTasks.filter((t) => t.completed).length;

  // Dates that have tasks for calendar indicators
  const taskDates = useMemo(() => new Set(tasks.map((t) => t.date)), [tasks]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [noteTask, setNoteTask] = useState<Task | null>(null);
  const [noteText, setNoteText] = useState("");
  const [delTarget, setDelTarget] = useState<string | null>(null);

  const handleSave = async (data: TaskInsert | TaskUpdate, id?: string) => {
    if (id) await updateTask(id, data);
    else await addTask(data as TaskInsert);
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    await deleteTask(delTarget);
    setDelTarget(null);
    toast("Tarefa excluída");
  };

  const handleSaveNote = async () => {
    if (!noteTask) return;
    await updateTask(noteTask.id, { note: noteText.trim() || null });
    setNoteTask(null);
    toast.success("Nota salva!");
  };

  // Retroactive records
  const selRecord = records.find((r) => r.date === dateStr);
  const activeHabits = habits.filter((h) => h.active);

  const handleRecordUpdate = useCallback((u: Partial<DailyRecord>) => {
    upsertRecord({ date: dateStr, ...u });
    toast("Salvo");
  }, [dateStr, upsertRecord]);

  const sleepTime = selRecord?.sleepTime || "";
  const wakeUp = selRecord?.wakeUpTime || "";
  const [sleepH, sleepM] = sleepTime ? sleepTime.split(":").map(Number) : [23, 0];
  const [wakeH, wakeM] = wakeUp ? wakeUp.split(":").map(Number) : [7, 0];

  const updateSleepTime = (h: number, m: number) => {
    const newSleepTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const newSleep = calculateSleepDuration(newSleepTime, wakeUp);
    handleRecordUpdate({ sleepTime: newSleepTime, sleepHours: newSleep });
  };
  const updateWakeTime = (h: number, m: number) => {
    const newWakeTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const newSleep = calculateSleepDuration(sleepTime, newWakeTime);
    handleRecordUpdate({ wakeUpTime: newWakeTime, sleepHours: newSleep });
  };

  const goals = useStore().goals;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mt-4">
      {/* Calendar */}
      <Card className="w-fit h-fit">
        <CardContent className="p-2">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            locale={ptBR}
            modifiers={{ hasTasks: (d: Date) => taskDates.has(format(d, "yyyy-MM-dd")) }}
            modifiersStyles={{
              hasTasks: { fontWeight: 700, textDecoration: "underline", textDecorationColor: "hsl(168,64%,38%)", textUnderlineOffset: "3px" },
            }}
          />
        </CardContent>
      </Card>

      {/* Day panel */}
      <div className="space-y-4">
        {dateStr && (
          <>
            {/* Header */}
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"} · {completedCount} {completedCount === 1 ? "concluída" : "concluídas"}
              </p>
              <Button
                size="sm"
                className="mt-2 rounded-xl gap-1.5"
                onClick={() => { setEditTask(null); setModalOpen(true); }}
              >
                <Plus size={14} /> Nova tarefa
              </Button>
            </div>

            {/* Tasks list */}
            {dayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">Nenhuma tarefa para este dia</p>
            ) : (
              <div className="space-y-1.5">
                {dayTasks.map((task) => {
                  const goal = task.goal_id ? goals.find((g) => g.id === task.goal_id) : null;
                  return (
                    <Card key={task.id} className={cn("transition-all duration-200", task.completed && "opacity-50")}>
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                            className="rounded-full"
                          />
                          {task.icon && <span className="text-sm">{task.icon}</span>}
                          <span className={cn(
                            "flex-1 text-sm font-medium truncate",
                            task.completed && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </span>
                          {task.note && <StickyNote size={14} className="text-muted-foreground shrink-0" />}
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                            style={{ backgroundColor: PRIORITY_COLORS[task.priority].bg, color: PRIORITY_COLORS[task.priority].text }}
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
                              <DropdownMenuItem onClick={() => { setEditTask(task); setModalOpen(true); }}>Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setNoteTask(task); setNoteText(task.note || ""); }}>
                                {task.note ? "Ver/editar nota" : "Adicionar nota"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDelTarget(task.id)}>Apagar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* Life areas + goal */}
                        <div className="flex items-center gap-1.5 flex-wrap pl-9">
                          {task.life_areas?.map((a) => (
                            <LifeAreaBadge key={a} value={a} size="sm" />
                          ))}
                          {goal && (
                            <span className="text-[10px] text-muted-foreground">
                              {goal.icon} {goal.title}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Retroactive: habits + check-in for past days */}
            {isPast && (
              <div className="space-y-4 border-t pt-4 mt-4">
                {/* Habits */}
                <div>
                  <p className="text-sm font-medium mb-2">Hábitos do dia</p>
                  <div className="space-y-1.5">
                    {activeHabits.map((h) => {
                      const checks = selRecord?.habitChecks || {};
                      return (
                        <div key={h.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                          {h.targetType === "check" ? (
                            <Checkbox
                              checked={checks[h.id] === true}
                              onCheckedChange={(c) => handleRecordUpdate({ habitChecks: { ...checks, [h.id]: !!c } })}
                            />
                          ) : (
                            <Input
                              type="number"
                              className="w-20 h-8 text-sm rounded-lg"
                              value={typeof checks[h.id] === "number" ? (checks[h.id] as number) : ""}
                              onChange={(e) => handleRecordUpdate({ habitChecks: { ...checks, [h.id]: Number(e.target.value) } })}
                            />
                          )}
                          <span className="text-sm">{h.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Check-in */}
                <div>
                  <p className="text-sm font-medium mb-2">Check-in</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Humor</p>
                      <Select
                        value={selRecord?.mood || ""}
                        onValueChange={(v) => handleRecordUpdate({ mood: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione">
                            {selRecord?.mood && getMoodTag(selRecord.mood) && (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
                                style={{ backgroundColor: `hsl(${getMoodTag(selRecord.mood)!.bgHsl})` }}
                              >
                                {getMoodTag(selRecord.mood)!.label}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MOOD_TAGS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Dormi às</p>
                      <TimeSelect
                        hours={sleepH} minutes={sleepM}
                        onChangeHours={(h) => updateSleepTime(h, sleepM)}
                        onChangeMinutes={(m) => updateSleepTime(sleepH, m)}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Acordei às</p>
                      <TimeSelect
                        hours={wakeH} minutes={wakeM}
                        onChangeHours={(h) => updateWakeTime(h, wakeM)}
                        onChangeMinutes={(m) => updateWakeTime(wakeH, m)}
                      />
                    </div>
                    {(sleepTime || wakeUp) && (
                      <p className="text-xs text-muted-foreground">
                        Dormiu {formatSleepHours(calculateSleepDuration(sleepTime, wakeUp))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TaskModal
        open={modalOpen}
        onOpenChange={(o) => { setModalOpen(o); if (!o) setEditTask(null); }}
        task={editTask}
        defaultDate={dateStr || today}
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
    </div>
  );
}

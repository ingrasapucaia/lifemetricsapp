import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, getWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Clock, Pencil, CalendarIcon, ClipboardList, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LIFE_AREAS, Task, TaskPriority, TASK_PRIORITY_COLORS, getLifeArea } from "@/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export default function Agenda() {
  const { tasks, goals, toggleTask, addTask, updateTask, deleteTask, appendTasks } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [lifeArea, setLifeArea] = useState("");
  const [goalId, setGoalId] = useState("");

  // Paste list state
  const [pasteSheetOpen, setPasteSheetOpen] = useState(false);
  const [pasteDate, setPasteDate] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
  const monthLabel = format(weekStart, "MMMM", { locale: ptBR }).toUpperCase();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    for (const key in map) {
      map[key].sort((a, b) => {
        // Completed tasks first
        if (a.completed !== b.completed) return a.completed ? -1 : 1;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });
    }
    return map;
  }, [tasks]);

  const resetForm = () => {
    setTitle("");
    setTime("");
    setPriority("media");
    setLifeArea("");
    setGoalId("");
    setEditingTask(null);
  };

  const openPaste = (dateStr: string) => {
    setPasteDate(dateStr);
    setPasteText("");
    setPasteSheetOpen(true);
  };

  const handlePaste = async () => {
    if (!pasteText.trim()) return;
    setPasteLoading(true);
    const { data, error } = await supabase.functions.invoke("parse-tasks", {
      body: { text: pasteText.trim(), date: pasteDate },
    });
    setPasteLoading(false);
    if (error || data?.error) {
      toast.error("Erro ao organizar tarefas. Tente novamente.");
      return;
    }
    const created: Task[] = (data.tasks || []).map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      date: t.date,
      time: t.time || undefined,
      completed: t.completed,
      priority: (t.priority || "media") as Task["priority"],
      lifeArea: t.life_area || undefined,
      goalId: t.goal_id || undefined,
      createdAt: t.created_at,
    }));
    appendTasks(created);
    setPasteSheetOpen(false);
    toast.success(`${created.length} tarefas adicionadas!`);
  };

  const openCreate = (dateStr: string) => {
    resetForm();
    setSheetDate(dateStr);
    setSheetOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setSheetDate(task.date);
    setTitle(task.title);
    setTime(task.time ? task.time.slice(0, 5) : "");
    setPriority(task.priority);
    setLifeArea(task.lifeArea || "");
    setGoalId(task.goalId || "");
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        date: sheetDate,
        time: time || undefined,
        priority,
        lifeArea: lifeArea && lifeArea !== "none" ? lifeArea : undefined,
        goalId: goalId && goalId !== "none" ? goalId : undefined,
      });
    } else {
      addTask({
        title: title.trim(),
        date: sheetDate,
        time: time || undefined,
        completed: false,
        priority,
        lifeArea: lifeArea && lifeArea !== "none" ? lifeArea : undefined,
        goalId: goalId && goalId !== "none" ? goalId : undefined,
      });
    }
    setSheetOpen(false);
  };

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status !== "concluido" && g.status !== "arquivada"),
    [goals]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
            SEMANA {weekNumber} • {monthLabel}
          </p>
          <h1 className="text-xl font-bold tracking-tight mt-1">Agenda</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-8 px-3" onClick={() => setWeekOffset(0)}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-5">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateStr] || [];
          const isToday = isSameDay(day, new Date());
          const completedCount = dayTasks.filter((t) => t.completed).length;

          return (
            <Card key={dateStr} className={cn("overflow-hidden transition-all shadow-none border border-[#E5E5EA]", isToday && "ring-1 ring-primary/30")}>
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[36px]">
                    <p className={cn("text-2xl font-bold leading-none", isToday ? "text-[#1C1C1E]" : "text-foreground")}>
                      {format(day, "dd")}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{WEEKDAYS[day.getDay()]}</p>
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", isToday ? "text-[#1C1C1E]" : "text-foreground")}>
                      {format(day, "EEEE", { locale: ptBR })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{format(day, "d 'de' MMMM", { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {completedCount}/{dayTasks.length}
                    </span>
                  )}
                  <button
                    onClick={() => openPaste(dateStr)}
                    className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors"
                    title="Colar lista de tarefas"
                  >
                    <ClipboardList size={13} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => openCreate(dateStr)}
                    className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Tasks list */}
              {dayTasks.length > 0 ? (
                <div className="border-t border-border/50">
                  {dayTasks.map((task) => {
                    const area = getLifeArea(task.lifeArea);
                    const priorityColor = TASK_PRIORITY_COLORS[task.priority];

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 border-b border-border/30 last:border-b-0 transition-colors",
                          task.completed && ""
                        )}
                      >
                        {/* Priority dot */}
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: priorityColor.text }} />

                        {/* Check toggle */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            task.completed
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 hover:border-primary/50"
                          )}
                        >
                          {task.completed && <Check size={10} strokeWidth={3} />}
                        </button>

                        {/* Content - clickable for edit */}
                        <button
                          onClick={() => openEdit(task)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className={cn("text-sm leading-snug", task.completed && "line-through text-muted-foreground")}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.time && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock size={9} />
                                {task.time.slice(0, 5)}
                              </span>
                            )}
                            {area && (
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                                style={{ backgroundColor: area.bgColor, color: area.textColor }}
                              >
                                {area.label}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Edit icon */}
                        <button
                          onClick={() => openEdit(task)}
                          className="text-muted-foreground/40 hover:text-primary transition-colors shrink-0"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border-t border-border/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground/50 italic">Sem tarefas</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Paste list sheet */}
      <Sheet open={pasteSheetOpen} onOpenChange={(open) => { setPasteSheetOpen(open); if (!open) setPasteText(""); }}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-base">
              Colar lista de tarefas — {pasteDate && format(new Date(pasteDate + "T00:00:00"), "d 'de' MMMM", { locale: ptBR })}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Cole aqui sua lista de tarefas..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="min-h-[140px] text-sm resize-none"
              autoFocus
            />
            <Button
              onClick={handlePaste}
              disabled={pasteLoading || !pasteText.trim()}
              className="w-full font-semibold"
              style={{ backgroundColor: "#D6F3A1", color: "#1a1a1a" }}
            >
              {pasteLoading ? "Organizando..." : "Organizar tarefas"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit task sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm(); }}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8 max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-base">
              {editingTask ? "Editar tarefa" : "Nova tarefa"} — {sheetDate && format(new Date(sheetDate + "T00:00:00"), "d 'de' MMMM", { locale: ptBR })}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <Input
              placeholder="O que precisa fazer?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
              autoFocus
            />

            {/* Date picker (edit mode only) */}
            {editingTask && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left text-sm font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sheetDate
                        ? format(new Date(sheetDate + "T00:00:00"), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={sheetDate ? new Date(sheetDate + "T00:00:00") : undefined}
                      onSelect={(date) => date && setSheetDate(format(date, "yyyy-MM-dd"))}
                      className={cn("p-3 pointer-events-auto")}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Time dropdowns */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Horário (opcional)</label>
              <div className="flex gap-2">
                <Select
                  value={time ? time.split(":")[0] : ""}
                  onValueChange={(h) => setTime(h + ":" + (time ? time.split(":")[1] : "00"))}
                >
                  <SelectTrigger style={{ borderRadius: 8, borderColor: "#E5E5EA", background: "white" }}>
                    <SelectValue placeholder="Hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
                      <SelectItem key={h} value={h}>
                        {time && time.split(":")[0] === h ? `✓ ${h}h` : `${h}h`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={time ? time.split(":")[1] : ""}
                  onValueChange={(m) => setTime((time ? time.split(":")[0] : "00") + ":" + m)}
                >
                  <SelectTrigger style={{ borderRadius: 8, borderColor: "#E5E5EA", background: "white" }}>
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {["00","05","10","15","20","25","30","35","40","45","50","55"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {time && time.split(":")[1] === m ? `✓ ${m}min` : `${m}min`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {time && (
                <button
                  type="button"
                  onClick={() => setTime("")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                >
                  <X size={12} /> Limpar horário
                </button>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((p) => {
                  const colors = TASK_PRIORITY_COLORS[p.value];
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-all",
                        priority === p.value ? "border-current shadow-sm" : "border-transparent"
                      )}
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Life area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Área da vida (opcional)</label>
              <Select value={lifeArea} onValueChange={setLifeArea}>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {LIFE_AREAS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Goal link */}
            {activeGoals.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Vincular a meta (opcional)</label>
                <Select value={goalId} onValueChange={setGoalId}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Selecione uma meta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {activeGoals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleSave} className="w-full" disabled={!title.trim()}>
              {editingTask ? "Salvar alterações" : "Adicionar tarefa"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

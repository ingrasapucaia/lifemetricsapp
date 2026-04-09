// Store provider — all data from Supabase, zero localStorage
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DailyRecord, Achievement, Goal, GoalAction, Task, LIFE_AREAS } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

// ── Row mappers ──────────────────────────────────

type HabitRow = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  target_type: string;
  target_value: number | null;
  active: boolean;
  show_on_dashboard: boolean;
  created_at: string;
  life_area: string | null;
  frequency: string | null;
  frequency_days: string[] | null;
  metric_type: string | null;
  metric_unit: string | null;
  metric_time_unit: string | null;
  daily_goal: number | null;
  reminder_time: string | null;
};

function mapHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || undefined,
    color: row.color || undefined,
    category: (row.category as Habit["category"]) || undefined,
    targetType: row.target_type as Habit["targetType"],
    targetValue: row.target_value ?? undefined,
    active: row.active,
    showOnDashboard: row.show_on_dashboard ?? true,
    createdAt: row.created_at,
    lifeArea: row.life_area || undefined,
    frequency: (row.frequency as Habit["frequency"]) || undefined,
    frequencyDays: row.frequency_days || undefined,
    metricType: (row.metric_type as Habit["metricType"]) || undefined,
    metricUnit: row.metric_unit || undefined,
    metricTimeUnit: (row.metric_time_unit as Habit["metricTimeUnit"]) || undefined,
    dailyGoal: row.daily_goal ?? undefined,
    reminderTime: row.reminder_time || undefined,
  };
}

function mapHabitInsert(userId: string, habit: Omit<Habit, "id" | "createdAt">, id: string) {
  return {
    id,
    user_id: userId,
    name: habit.name,
    icon: habit.icon ?? null,
    color: habit.color ?? null,
    category: habit.category ?? null,
    target_type: habit.targetType,
    target_value: habit.targetValue ?? null,
    active: habit.active,
    show_on_dashboard: habit.showOnDashboard ?? true,
    life_area: habit.lifeArea ?? null,
    frequency: habit.frequency ?? null,
    frequency_days: habit.frequencyDays ?? null,
    metric_type: habit.metricType ?? null,
    metric_unit: habit.metricUnit ?? null,
    metric_time_unit: habit.metricTimeUnit ?? null,
    daily_goal: habit.dailyGoal ?? null,
    reminder_time: habit.reminderTime ?? null,
  };
}

function mapHabitUpdate(updates: Partial<Habit>) {
  return {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.icon !== undefined ? { icon: updates.icon ?? null } : {}),
    ...(updates.color !== undefined ? { color: updates.color ?? null } : {}),
    ...(updates.category !== undefined ? { category: updates.category ?? null } : {}),
    ...(updates.targetType !== undefined ? { target_type: updates.targetType } : {}),
    ...(updates.targetValue !== undefined ? { target_value: updates.targetValue ?? null } : {}),
    ...(updates.active !== undefined ? { active: updates.active } : {}),
    ...(updates.showOnDashboard !== undefined ? { show_on_dashboard: updates.showOnDashboard } : {}),
    ...(updates.lifeArea !== undefined ? { life_area: updates.lifeArea ?? null } : {}),
    ...(updates.frequency !== undefined ? { frequency: updates.frequency ?? null } : {}),
    ...(updates.frequencyDays !== undefined ? { frequency_days: updates.frequencyDays ?? null } : {}),
    ...(updates.metricType !== undefined ? { metric_type: updates.metricType ?? null } : {}),
    ...(updates.metricUnit !== undefined ? { metric_unit: updates.metricUnit ?? null } : {}),
    ...(updates.metricTimeUnit !== undefined ? { metric_time_unit: updates.metricTimeUnit ?? null } : {}),
    ...(updates.dailyGoal !== undefined ? { daily_goal: updates.dailyGoal ?? null } : {}),
    ...(updates.reminderTime !== undefined ? { reminder_time: updates.reminderTime ?? null } : {}),
  };
}

// Record mappers
function mapRecordRow(row: any): DailyRecord {
  return {
    id: row.id,
    date: row.date,
    mood: row.mood || "",
    wakeUpTime: row.wake_up_time || undefined,
    sleepTime: row.sleep_time || undefined,
    sleepHours: Number(row.sleep_hours) || 0,
    waterIntake: row.water_intake || 0,
    exerciseMinutes: row.exercise_minutes || 0,
    habitChecks: row.habit_checks || {},
    noteFeeling: row.note_feeling || undefined,
    noteProcrastination: row.note_procrastination || undefined,
    noteGratitude: row.note_gratitude || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Goal mappers
function mapGoalRow(row: any, actions: GoalAction[]): Goal {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon || undefined,
    type: row.type || "meta",
    status: row.status || "nao_comecei",
    lifeArea: row.life_area || undefined,
    reward: row.reward || undefined,
    rewarded: row.rewarded || false,
    rewardedAt: row.rewarded_at || undefined,
    alignedWithGoal: row.aligned_with_goal ?? true,
    completedAt: row.completed_at || undefined,
    deadline: row.deadline || undefined,
    createdAt: row.created_at,
    actions,
  };
}

function mapGoalActionRow(row: any): GoalAction {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    priority: row.priority || undefined,
    deadline: row.deadline || undefined,
    createdAt: row.created_at,
  };
}

// ── Store interface ──────────────────────────────

interface StoreType {
  habits: Habit[];
  records: DailyRecord[];
  goals: Goal[];
  tasks: Task[];
  upsertRecord: (updates: Partial<DailyRecord> & { date: string }) => void;
  deleteRecord: (id: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabit: (id: string, direction: "up" | "down") => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "actions">) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalAction: (goalId: string, action: Omit<GoalAction, "id" | "createdAt" | "completed">) => void;
  updateGoalAction: (goalId: string, actionId: string, updates: Partial<GoalAction>) => void;
  deleteGoalAction: (goalId: string, actionId: string) => void;
  toggleGoalAction: (goalId: string, actionId: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "userId">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // ── Fetch all data on login ──────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      if (authLoading) return;

      if (!user) {
        setHabits([]);
        setRecords([]);
        setGoals([]);
        setTasks([]);
        return;
      }

      const [habitsRes, recordsRes, goalsRes, tasksRes] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("daily_records").select("*").eq("user_id", user.id).order("date", { ascending: true }),
        supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("tasks").select("*").eq("user_id", user.id).order("date", { ascending: true }),
      ]);

      const goalRows = goalsRes.data || [];
      const goalIds = goalRows.map((g: any) => g.id);

      const actionsRes = goalIds.length
        ? await supabase.from("goal_actions").select("*").in("goal_id", goalIds)
        : { data: [], error: null };

      if (cancelled) return;

      if (habitsRes.error || recordsRes.error || goalsRes.error || actionsRes.error || tasksRes.error) {
        console.error("Error fetching app data:", {
          habits: habitsRes.error,
          records: recordsRes.error,
          goals: goalsRes.error,
          actions: actionsRes.error,
          tasks: tasksRes.error,
        });
      }

      setHabits(((habitsRes.data || []) as HabitRow[]).map(mapHabitRow));
      setRecords((recordsRes.data || []).map(mapRecordRow));

      setGoals(goalRows.map((g: any) => {
        const gActions = (actionsRes.data || [])
          .filter((a: any) => a.goal_id === g.id)
          .map(mapGoalActionRow);
        return mapGoalRow(g, gActions);
      }));

      setTasks((tasksRes.data || []).map((t: any): Task => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        date: t.date,
        time: t.time || undefined,
        completed: t.completed,
        priority: t.priority || "media",
        lifeArea: t.life_area || undefined,
        goalId: t.goal_id || undefined,
        createdAt: t.created_at,
      })));
    };

    void fetchAll();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // ── Records CRUD ──────────────────────────────

  const upsertRecord = useCallback((updates: Partial<DailyRecord> & { date: string }) => {
    if (!user) return;

    // Optimistic local update
    setRecords((prev) => {
      const existing = prev.find((r) => r.date === updates.date);
      if (existing) {
        return prev.map((r) =>
          r.date === updates.date ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          date: updates.date,
          mood: "",
          sleepHours: 0,
          waterIntake: 0,
          exerciseMinutes: 0,
          habitChecks: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...updates,
        },
      ];
    });

    // Persist to Supabase
    void (async () => {
      const dbPayload: any = {
        user_id: user.id,
        date: updates.date,
      };
      if (updates.mood !== undefined) dbPayload.mood = updates.mood;
      if (updates.wakeUpTime !== undefined) dbPayload.wake_up_time = updates.wakeUpTime || null;
      if (updates.sleepTime !== undefined) dbPayload.sleep_time = updates.sleepTime || null;
      if (updates.sleepHours !== undefined) dbPayload.sleep_hours = updates.sleepHours;
      if (updates.waterIntake !== undefined) dbPayload.water_intake = updates.waterIntake;
      if (updates.exerciseMinutes !== undefined) dbPayload.exercise_minutes = updates.exerciseMinutes;
      if (updates.habitChecks !== undefined) dbPayload.habit_checks = updates.habitChecks;
      if (updates.noteFeeling !== undefined) dbPayload.note_feeling = updates.noteFeeling || null;
      if (updates.noteProcrastination !== undefined) dbPayload.note_procrastination = updates.noteProcrastination || null;
      if (updates.noteGratitude !== undefined) dbPayload.note_gratitude = updates.noteGratitude || null;

      const { error } = await supabase
        .from("daily_records")
        .upsert(dbPayload, { onConflict: "user_id,date" });

      if (error) console.error("Error upserting record:", error);
    })();
  }, [user]);

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    void supabase.from("daily_records").delete().eq("id", id);
  }, []);

  // ── Habits CRUD ──────────────────────────────

  const addHabit = useCallback((habit: Omit<Habit, "id" | "createdAt">) => {
    if (!user) return;
    void (async () => {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from("habits")
        .insert(mapHabitInsert(user.id, habit, id))
        .select("*")
        .single();
      if (error) { console.error("Error creating habit:", error); return; }
      setHabits((prev) => [...prev, mapHabitRow(data as HabitRow)]);
    })();
  }, [user]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase
        .from("habits")
        .update(mapHabitUpdate(updates))
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error) { console.error("Error updating habit:", error); return; }
      setHabits((prev) => prev.map((h) => (h.id === id ? mapHabitRow(data as HabitRow) : h)));
    })();
  }, [user]);

  const deleteHabit = useCallback((id: string) => {
    if (!user) return;
    void (async () => {
      const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);
      if (error) { console.error("Error deleting habit:", error); return; }
      setHabits((prev) => prev.filter((h) => h.id !== id));
    })();
  }, [user]);

  const reorderHabit = useCallback((id: string, direction: "up" | "down") => {
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }, []);

  // ── Goals CRUD ──────────────────────────────

  const addGoal = useCallback((g: Omit<Goal, "id" | "createdAt" | "actions">) => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          title: g.title,
          icon: (g as any).icon ?? null,
          type: g.type || "meta",
          status: g.status || "nao_comecei",
          life_area: g.lifeArea ?? null,
          reward: g.reward ?? null,
          aligned_with_goal: g.alignedWithGoal ?? true,
          deadline: g.deadline ?? null,
        })
        .select("*")
        .single();
      if (error) { console.error("Error creating goal:", error); return; }
      setGoals((prev) => [...prev, mapGoalRow(data, [])]);
    })();
  }, [user]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    if (!user) return;

    // Build DB updates
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon ?? null;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.lifeArea !== undefined) dbUpdates.life_area = updates.lifeArea ?? null;
    if (updates.reward !== undefined) dbUpdates.reward = updates.reward ?? null;
    if (updates.rewarded !== undefined) dbUpdates.rewarded = updates.rewarded;
    if (updates.rewardedAt !== undefined) dbUpdates.rewarded_at = updates.rewardedAt ?? null;
    if (updates.alignedWithGoal !== undefined) dbUpdates.aligned_with_goal = updates.alignedWithGoal;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline ?? null;

    // Handle completion
    setGoals((prev) => {
      const old = prev.find((goal) => goal.id === id);
      const next = prev.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal));

      // Always update completedAt when marking as completed
      if (old && updates.status === "concluido") {
        dbUpdates.completed_at = new Date().toISOString();
        return next.map((goal) => goal.id === id ? { ...goal, completedAt: dbUpdates.completed_at } : goal);
      }
      // Clear completedAt when un-completing
      if (old && old.status === "concluido" && updates.status && updates.status !== "concluido") {
        dbUpdates.completed_at = null;
        return next.map((goal) => goal.id === id ? { ...goal, completedAt: undefined } : goal);
      }
      return next;
    });

    // Auto-create achievement when completed
    void (async () => {
      const goal = goals.find((g) => g.id === id);
      if (goal && goal.status !== "concluido" && updates.status === "concluido") {
        const lifeArea = goal.lifeArea
          ? (LIFE_AREAS.find(la => la.value === goal.lifeArea)?.label || "Pessoal")
          : "Pessoal";
        // Check if achievement already exists
        const { data: existing } = await supabase
          .from("achievements")
          .select("id")
          .eq("user_id", user.id)
          .eq("goal_id", id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("achievements").insert({
            user_id: user.id,
            title: goal.title,
            area: lifeArea,
            feeling: "Meta concluída! 🎉",
            icon: "Trophy",
            date: new Date().toISOString().slice(0, 10),
            goal_id: id,
            origin: "meta",
          });
        }
      }

      const { error } = await supabase
        .from("goals")
        .update(dbUpdates)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) console.error("Error updating goal:", error);
    })();
  }, [user, goals]);

  const deleteGoal = useCallback((id: string) => {
    if (!user) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    void (async () => {
      await supabase.from("goal_actions").delete().eq("goal_id", id);
      await supabase.from("achievements").delete().eq("goal_id", id).eq("user_id", user.id);
      await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
    })();
  }, [user]);

  // ── Goal Actions CRUD ──────────────────────

  const addGoalAction = useCallback((goalId: string, action: Omit<GoalAction, "id" | "createdAt" | "completed">) => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase
        .from("goal_actions")
        .insert({
          goal_id: goalId,
          title: action.title,
          priority: action.priority ?? null,
          deadline: action.deadline ?? null,
        })
        .select("*")
        .single();
      if (error) { console.error("Error creating goal action:", error); return; }
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, actions: [...g.actions, mapGoalActionRow(data)] } : g
        )
      );
    })();
  }, [user]);

  const updateGoalAction = useCallback((goalId: string, actionId: string, updates: Partial<GoalAction>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority ?? null;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline ?? null;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, actions: g.actions.map((a) => (a.id === actionId ? { ...a, ...updates } : a)) }
          : g
      )
    );
    void supabase.from("goal_actions").update(dbUpdates).eq("id", actionId);
  }, []);

  const deleteGoalAction = useCallback((goalId: string, actionId: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, actions: g.actions.filter((a) => a.id !== actionId) } : g
      )
    );
    void supabase.from("goal_actions").delete().eq("id", actionId);
  }, []);

  const toggleGoalAction = useCallback((goalId: string, actionId: string) => {
    let newCompleted = false;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          actions: g.actions.map((a) => {
            if (a.id !== actionId) return a;
            newCompleted = !a.completed;
            return { ...a, completed: newCompleted };
          }),
        };
      })
    );
    void (async () => {
      const { error } = await supabase.from("goal_actions").update({ completed: newCompleted }).eq("id", actionId);
      if (error) console.error("Error toggling goal action:", error);
    })();
  }, []);

  // ── Tasks CRUD ──────────────────────────────

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt" | "userId">) => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: task.title,
          date: task.date,
          time: task.time ?? null,
          completed: task.completed ?? false,
          priority: task.priority ?? "media",
          life_area: task.lifeArea ?? null,
          goal_id: task.goalId ?? null,
        })
        .select("*")
        .single();
      if (error) { console.error("Error creating task:", error); return; }
      setTasks((prev) => [...prev, {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        date: data.date,
        time: data.time || undefined,
        completed: data.completed,
        priority: (data.priority || "media") as Task["priority"],
        lifeArea: data.life_area || undefined,
        goalId: data.goal_id || undefined,
        createdAt: data.created_at,
      } as Task]);
    })();
  }, [user]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.time !== undefined) dbUpdates.time = updates.time ?? null;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.lifeArea !== undefined) dbUpdates.life_area = updates.lifeArea ?? null;
    if (updates.goalId !== undefined) dbUpdates.goal_id = updates.goalId ?? null;

    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    void supabase.from("tasks").update(dbUpdates).eq("id", id).eq("user_id", user.id);
  }, [user]);

  const deleteTask = useCallback((id: string) => {
    if (!user) return;
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    void (async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);

      if (error) {
        console.error("Error deleting task:", error);
        setTasks((prev) => {
          if (prev.some((t) => t.id === id)) return prev;
          return [...prev, taskToDelete].sort((a, b) => {
            const byDate = a.date.localeCompare(b.date);
            if (byDate !== 0) return byDate;
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            if (b.time) return 1;
            return (a.createdAt || "").localeCompare(b.createdAt || "");
          });
        });
        toast({
          variant: "destructive",
          title: "Não foi possível excluir a tarefa",
          description: "Tente novamente.",
        });
      }
    })();
  }, [tasks, user]);

  const toggleTask = useCallback((id: string) => {
    if (!user) return;
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const newCompleted = !currentTask.completed;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: newCompleted } : t));

    void (async () => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: newCompleted })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error toggling task:", error);
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: currentTask.completed } : t));
        toast({
          variant: "destructive",
          title: "Não foi possível salvar a tarefa",
          description: "Tente novamente.",
        });
      }
    })();
  }, [tasks, user]);

  const clearAll = useCallback(() => {
    setHabits([]);
    setRecords([]);
    setGoals([]);
    setTasks([]);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        habits, records, goals, tasks,
        upsertRecord, deleteRecord,
        addHabit, updateHabit, deleteHabit, reorderHabit,
        addGoal, updateGoal, deleteGoal,
        addGoalAction, updateGoalAction, deleteGoalAction, toggleGoalAction,
        addTask, updateTask, deleteTask, toggleTask,
        clearAll,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

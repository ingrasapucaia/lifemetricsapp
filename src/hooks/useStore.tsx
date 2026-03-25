// Store provider for app state
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DailyRecord, UserProfile, Achievement, Goal, GoalAction, LIFE_AREAS } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const KEYS = {
  habits: "metrics-habits",
  records: "metrics-records",
  profile: "metrics-profile",
  achievements: "metrics-achievements",
  goals: "metrics-goals",
};

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  mainGoal: "",
  focusArea: "misto",
  preferences: { weekStartsOn: "mon", insightsTone: "direto" },
};

type HabitRow = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  category: Habit["category"] | null;
  target_type: Habit["targetType"];
  target_value: number | null;
  active: boolean;
  show_on_dashboard: boolean | null;
  created_at: string;
  life_area: string | null;
  frequency: Habit["frequency"] | null;
  frequency_days: string[] | null;
  metric_type: Habit["metricType"] | null;
  metric_unit: string | null;
  metric_time_unit: Habit["metricTimeUnit"] | null;
  daily_goal: number | null;
  reminder_time: string | null;
};

function mapHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || undefined,
    color: row.color || undefined,
    category: row.category || undefined,
    targetType: row.target_type,
    targetValue: row.target_value ?? undefined,
    active: row.active,
    showOnDashboard: row.show_on_dashboard ?? true,
    createdAt: row.created_at,
    lifeArea: row.life_area || undefined,
    frequency: row.frequency || undefined,
    frequencyDays: row.frequency_days || undefined,
    metricType: row.metric_type || undefined,
    metricUnit: row.metric_unit || undefined,
    metricTimeUnit: row.metric_time_unit || undefined,
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

// Migrate old numeric mood to string
function migrateRecords(records: DailyRecord[]): DailyRecord[] {
  const legacy = ["", "triste", "ansiosa", "normal", "produtiva", "feliz"];
  return records.map((r) => {
    if (typeof r.mood === "number") {
      return { ...r, mood: legacy[r.mood as number] || "", waterIntake: r.waterIntake || 0 };
    }
    return { ...r, waterIntake: r.waterIntake || 0 };
  });
}

interface StoreType {
  habits: Habit[];
  records: DailyRecord[];
  profile: UserProfile;
  achievements: Achievement[];
  goals: Goal[];
  upsertRecord: (updates: Partial<DailyRecord> & { date: string }) => void;
  deleteRecord: (id: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabit: (id: string, direction: "up" | "down") => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addAchievement: (a: Omit<Achievement, "id" | "createdAt">) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  deleteAchievement: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "actions">) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalAction: (goalId: string, action: Omit<GoalAction, "id" | "createdAt" | "completed">) => void;
  updateGoalAction: (goalId: string, actionId: string, updates: Partial<GoalAction>) => void;
  deleteGoalAction: (goalId: string, actionId: string) => void;
  toggleGoalAction: (goalId: string, actionId: string) => void;
  resetToSeed: () => void;
  clearAll: () => void;
  importData: (data: { habits: Habit[]; records: DailyRecord[]; profile: UserProfile }) => void;
}

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>(() => migrateRecords(load(KEYS.records, [])));
  const [profile, setProfile] = useState<UserProfile>(() => load(KEYS.profile, DEFAULT_PROFILE));
  const [achievements, setAchievements] = useState<Achievement[]>(() => load(KEYS.achievements, []));
  const [goals, setGoals] = useState<Goal[]>(() => load(KEYS.goals, []));

  useEffect(() => {
    let cancelled = false;

    const fetchHabits = async () => {
      if (!user) {
        setHabits([]);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching habits:", error);
        if (!cancelled) setHabits([]);
        return;
      }

      if (!cancelled) {
        setHabits(((data || []) as HabitRow[]).map(mapHabitRow));
      }
    };

    void fetchHabits();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => { save(KEYS.records, records); }, [records]);
  useEffect(() => { save(KEYS.profile, profile); }, [profile]);
  useEffect(() => { save(KEYS.achievements, achievements); }, [achievements]);
  useEffect(() => { save(KEYS.goals, goals); }, [goals]);

  const upsertRecord = useCallback((updates: Partial<DailyRecord> & { date: string }) => {
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
          id: `r-${updates.date}`,
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
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, "id" | "createdAt">) => {
    if (!user) return;

    void (async () => {
      const id = crypto.randomUUID();
      const { data, error } = await (supabase as any)
        .from("habits")
        .insert(mapHabitInsert(user.id, habit, id))
        .select("*")
        .single();

      if (error) {
        console.error("Error creating habit:", error);
        return;
      }

      setHabits((prev) => [...prev, mapHabitRow(data as HabitRow)]);
    })();
  }, [user]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    if (!user) return;

    void (async () => {
      const { data, error } = await (supabase as any)
        .from("habits")
        .update(mapHabitUpdate(updates))
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating habit:", error);
        return;
      }

      setHabits((prev) => prev.map((h) => (h.id === id ? mapHabitRow(data as HabitRow) : h)));
    })();
  }, [user]);

  const deleteHabit = useCallback((id: string) => {
    if (!user) return;

    void (async () => {
      const { error } = await (supabase as any)
        .from("habits")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting habit:", error);
        return;
      }

      setHabits((prev) => prev.filter((h) => h.id !== id));
      setRecords((prev) =>
        prev.map((r) => {
          const { [id]: _, ...rest } = r.habitChecks;
          return { ...r, habitChecks: rest };
        })
      );
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

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const addAchievement = useCallback((a: Omit<Achievement, "id" | "createdAt">) => {
    setAchievements((prev) => [...prev, { ...a, id: `a-${Date.now()}`, createdAt: new Date().toISOString() }]);
  }, []);

  const updateAchievement = useCallback((id: string, updates: Partial<Achievement>) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteAchievement = useCallback((id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Goals CRUD
  const addGoal = useCallback((g: Omit<Goal, "id" | "createdAt" | "actions">) => {
    setGoals((prev) => [...prev, { ...g, id: `g-${Date.now()}`, actions: [], createdAt: new Date().toISOString() }]);
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals((prev) => {
      const old = prev.find((g) => g.id === id);
      const next = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      // Auto-create achievement when completed for the FIRST TIME (idempotent)
      if (old && old.status !== "concluido" && updates.status === "concluido") {
        const goal = next.find((g) => g.id === id)!;
        // Check if achievement already exists for this goal
        setAchievements((a) => {
          const existing = a.find((ach) => ach.goalId === id);
          if (existing) return a; // Already created, skip
          const lifeArea = goal.lifeArea ? (LIFE_AREAS.find(la => la.value === goal.lifeArea)?.label || "Pessoal") : "Pessoal";
          return [
            ...a,
            {
              id: `a-${Date.now()}`,
              title: goal.title,
              area: lifeArea,
              feeling: "Meta concluída! 🎉",
              icon: "Trophy",
              date: new Date().toISOString().slice(0, 10),
              createdAt: new Date().toISOString(),
              goalId: id,
              origin: "meta" as const,
            },
          ];
        });
      }
      // Set completedAt on first completion
      if (old && !old.completedAt && updates.status === "concluido") {
        return next.map((g) => g.id === id ? { ...g, completedAt: new Date().toISOString() } : g);
      }
      return next;
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const addGoalAction = useCallback((goalId: string, action: Omit<GoalAction, "id" | "createdAt" | "completed">) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          actions: [...g.actions, { ...action, id: `ga-${Date.now()}`, completed: false, createdAt: new Date().toISOString() }],
        };
      })
    );
  }, []);

  const updateGoalAction = useCallback((goalId: string, actionId: string, updates: Partial<GoalAction>) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, actions: g.actions.map((a) => (a.id === actionId ? { ...a, ...updates } : a)) }
          : g
      )
    );
  }, []);

  const deleteGoalAction = useCallback((goalId: string, actionId: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, actions: g.actions.filter((a) => a.id !== actionId) } : g
      )
    );
  }, []);

  const toggleGoalAction = useCallback((goalId: string, actionId: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, actions: g.actions.map((a) => (a.id === actionId ? { ...a, completed: !a.completed } : a)) }
          : g
      )
    );
  }, []);

  const resetToSeed = useCallback(() => {
    // No longer resets to seed data — habits are user-owned and permanent
    setHabits([]);
    setRecords([]);
    setAchievements([]);
    setGoals([]);
    setProfile(DEFAULT_PROFILE);
  }, []);

  const clearAll = useCallback(() => {
    setHabits([]);
    setRecords([]);
    setAchievements([]);
    setGoals([]);
    setProfile(DEFAULT_PROFILE);
  }, []);

  const importData = useCallback(
    (data: { habits: Habit[]; records: DailyRecord[]; profile: UserProfile }) => {
      setHabits(data.habits);
      setRecords(migrateRecords(data.records));
      setProfile(data.profile);
    },
    []
  );

  return (
    <StoreContext.Provider
      value={{
        habits, records, profile, achievements, goals,
        upsertRecord, deleteRecord,
        addHabit, updateHabit, deleteHabit, reorderHabit,
        updateProfile, addAchievement, updateAchievement, deleteAchievement,
        addGoal, updateGoal, deleteGoal,
        addGoalAction, updateGoalAction, deleteGoalAction, toggleGoalAction,
        resetToSeed, clearAll, importData,
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

// Store provider for app state
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DailyRecord, UserProfile, Achievement, Goal, GoalAction, LIFE_AREAS } from "@/types";
import { seedHabits, seedProfile, generateSeedRecords } from "@/data/seed";

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
  const [habits, setHabits] = useState<Habit[]>(() => load(KEYS.habits, []));
  const [records, setRecords] = useState<DailyRecord[]>(() => migrateRecords(load(KEYS.records, [])));
  const [profile, setProfile] = useState<UserProfile>(() => load(KEYS.profile, {
    displayName: "",
    mainGoal: "",
    focusArea: "misto",
    preferences: { weekStartsOn: "mon", insightsTone: "direto" },
  }));
  const [achievements, setAchievements] = useState<Achievement[]>(() => load(KEYS.achievements, []));
  const [goals, setGoals] = useState<Goal[]>(() => load(KEYS.goals, []));

  useEffect(() => { save(KEYS.habits, habits); }, [habits]);
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
    setHabits((prev) => [...prev, { ...habit, id: `h-${Date.now()}`, createdAt: new Date().toISOString() }]);
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setRecords((prev) =>
      prev.map((r) => {
        const { [id]: _, ...rest } = r.habitChecks;
        return { ...r, habitChecks: rest };
      })
    );
  }, []);

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
    setHabits(seedHabits);
    setRecords(generateSeedRecords());
    setProfile(seedProfile);
    setAchievements([]);
    setGoals([]);
  }, []);

  const clearAll = useCallback(() => {
    setHabits([]);
    setRecords([]);
    setAchievements([]);
    setGoals([]);
    setProfile({
      displayName: "",
      mainGoal: "",
      focusArea: "misto",
      preferences: { weekStartsOn: "mon", insightsTone: "direto" },
    });
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

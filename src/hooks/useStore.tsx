import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DailyRecord, UserProfile, Achievement } from "@/types";
import { seedHabits, seedProfile, generateSeedRecords } from "@/data/seed";

const KEYS = {
  habits: "metrics-habits",
  records: "metrics-records",
  profile: "metrics-profile",
  achievements: "metrics-achievements",
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
  resetToSeed: () => void;
  clearAll: () => void;
  importData: (data: { habits: Habit[]; records: DailyRecord[]; profile: UserProfile }) => void;
}

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(() => load(KEYS.habits, seedHabits));
  const [records, setRecords] = useState<DailyRecord[]>(() => migrateRecords(load(KEYS.records, generateSeedRecords())));
  const [profile, setProfile] = useState<UserProfile>(() => load(KEYS.profile, seedProfile));
  const [achievements, setAchievements] = useState<Achievement[]>(() => load(KEYS.achievements, []));

  useEffect(() => { save(KEYS.habits, habits); }, [habits]);
  useEffect(() => { save(KEYS.records, records); }, [records]);
  useEffect(() => { save(KEYS.profile, profile); }, [profile]);
  useEffect(() => { save(KEYS.achievements, achievements); }, [achievements]);

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

  const resetToSeed = useCallback(() => {
    setHabits(seedHabits);
    setRecords(generateSeedRecords());
    setProfile(seedProfile);
    setAchievements([]);
  }, []);

  const clearAll = useCallback(() => {
    setHabits([]);
    setRecords([]);
    setAchievements([]);
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
        habits, records, profile, achievements,
        upsertRecord, deleteRecord,
        addHabit, updateHabit, deleteHabit, reorderHabit,
        updateProfile, addAchievement, updateAchievement, deleteAchievement,
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

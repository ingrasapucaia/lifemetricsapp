import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Habit, DailyRecord, UserProfile } from "@/types";
import { seedHabits, seedProfile, generateSeedRecords } from "@/data/seed";

const KEYS = { habits: "metrics-habits", records: "metrics-records", profile: "metrics-profile" };

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

interface StoreType {
  habits: Habit[];
  records: DailyRecord[];
  profile: UserProfile;
  upsertRecord: (updates: Partial<DailyRecord> & { date: string }) => void;
  deleteRecord: (id: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetToSeed: () => void;
  clearAll: () => void;
  importData: (data: { habits: Habit[]; records: DailyRecord[]; profile: UserProfile }) => void;
}

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(() => load(KEYS.habits, seedHabits));
  const [records, setRecords] = useState<DailyRecord[]>(() => load(KEYS.records, generateSeedRecords()));
  const [profile, setProfile] = useState<UserProfile>(() => load(KEYS.profile, seedProfile));

  useEffect(() => { save(KEYS.habits, habits); }, [habits]);
  useEffect(() => { save(KEYS.records, records); }, [records]);
  useEffect(() => { save(KEYS.profile, profile); }, [profile]);

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
          mood: 0,
          sleepHours: 0,
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

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetToSeed = useCallback(() => {
    setHabits(seedHabits);
    setRecords(generateSeedRecords());
    setProfile(seedProfile);
  }, []);

  const clearAll = useCallback(() => {
    setHabits([]);
    setRecords([]);
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
      setRecords(data.records);
      setProfile(data.profile);
    },
    []
  );

  return (
    <StoreContext.Provider
      value={{
        habits, records, profile,
        upsertRecord, deleteRecord,
        addHabit, updateHabit, deleteHabit,
        updateProfile, resetToSeed, clearAll, importData,
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

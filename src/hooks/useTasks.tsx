import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  date: string;
  due_time: string | null;
  priority: "alta" | "media" | "baixa";
  life_areas: string[] | null;
  goal_id: string | null;
  reward: string | null;
  note: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = {
  title: string;
  date: string;
  due_time?: string | null;
  icon?: string | null;
  priority?: "alta" | "media" | "baixa";
  life_areas?: string[] | null;
  goal_id?: string | null;
  reward?: string | null;
  note?: string | null;
};

export type TaskUpdate = Partial<TaskInsert> & {
  completed?: boolean;
  completed_at?: string | null;
};

export function useTasks() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) { setTasks([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
    }

    setTasks((data as Task[]) || []);
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = useCallback(async (task: TaskInsert) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...task, user_id: user.id })
      .select()
      .single();
    if (!error && data) setTasks((prev) => [...prev, data as Task]);
    return { data, error };
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: TaskUpdate) => {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)));
    }
    return { data, error };
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
    return { error };
  }, []);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const completed = !task.completed;
    const completed_at = completed ? new Date().toISOString() : null;
    return updateTask(id, { completed, completed_at });
  }, [tasks, updateTask]);

  const getTasksForDate = useCallback((date: string) => {
    return tasks.filter((t) => t.date === date);
  }, [tasks]);

  const getTasksForGoal = useCallback((goalId: string) => {
    return tasks.filter((t) => t.goal_id === goalId);
  }, [tasks]);

  return { tasks, loading, fetchTasks, addTask, updateTask, deleteTask, toggleTask, getTasksForDate, getTasksForGoal };
}

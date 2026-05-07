import { create } from 'zustand';
import type { Goal, GoalContribution } from '../types';
import { supabase } from '../lib/supabase';

interface GoalState {
  goals: Goal[];
  contributions: Record<string, GoalContribution[]>;
  loading: boolean;
  fetchGoals: (userId: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'saved_amount'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addContribution: (goalId: string, userId: string, amount: number, note?: string) => Promise<void>;
  fetchContributions: (goalId: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  contributions: {},
  loading: false,

  fetchGoals: async (userId: string) => {
    set({ loading: true });
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    set({ goals: (data as Goal[]) ?? [], loading: false });
  },

  addGoal: async (goal) => {
    const { data } = await supabase.from('goals').insert(goal).select().single();
    if (data) set(s => ({ goals: [data as Goal, ...s.goals] }));
  },

  updateGoal: async (id, updates) => {
    const { data } = await supabase
      .from('goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (data) set(s => ({ goals: s.goals.map(g => g.id === id ? data as Goal : g) }));
  },

  deleteGoal: async (id) => {
    await supabase.from('goals').delete().eq('id', id);
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
  },

  addContribution: async (goalId, userId, amount, note) => {
    const { data } = await supabase
      .from('goal_contributions')
      .insert({ goal_id: goalId, user_id: userId, amount, note })
      .select()
      .single();
    if (data) {
      set(s => ({
        contributions: {
          ...s.contributions,
          [goalId]: [data as GoalContribution, ...(s.contributions[goalId] ?? [])],
        },
      }));
      // Re-fetch goal to get updated saved_amount
      const { data: updatedGoal } = await supabase.from('goals').select('*').eq('id', goalId).single();
      if (updatedGoal) {
        set(s => ({ goals: s.goals.map(g => g.id === goalId ? updatedGoal as Goal : g) }));
      }
    }
  },

  fetchContributions: async (goalId) => {
    const { data } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });
    set(s => ({ contributions: { ...s.contributions, [goalId]: (data as GoalContribution[]) ?? [] } }));
  },
}));

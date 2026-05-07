import { create } from 'zustand';
import type { Budget } from '../types';
import { supabase } from '../lib/supabase';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  fetchBudgets: (userId: string, month?: number, year?: number) => Promise<void>;
  upsertBudget: (budget: Omit<Budget, 'id' | 'created_at'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  loading: false,

  fetchBudgets: async (userId, month, year) => {
    set({ loading: true });
    const now = new Date();
    let query = supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .eq('month', month ?? now.getMonth() + 1)
      .eq('year', year ?? now.getFullYear());

    const { data } = await query;
    set({ budgets: (data as Budget[]) ?? [], loading: false });
  },

  upsertBudget: async (budget) => {
    const { data } = await supabase
      .from('budgets')
      .upsert(budget, { onConflict: 'user_id,category_id,month,year' })
      .select('*, category:categories(*)')
      .single();
    if (data) {
      set(s => {
        const exists = s.budgets.find(b => b.id === (data as Budget).id);
        return {
          budgets: exists
            ? s.budgets.map(b => b.id === (data as Budget).id ? data as Budget : b)
            : [...s.budgets, data as Budget],
        };
      });
    }
  },

  deleteBudget: async (id) => {
    await supabase.from('budgets').delete().eq('id', id);
    set(s => ({ budgets: s.budgets.filter(b => b.id !== id) }));
  },
}));

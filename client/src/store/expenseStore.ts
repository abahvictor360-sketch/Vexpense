import { create } from 'zustand';
import type { Expense } from '../types';
import { supabase } from '../lib/supabase';

interface ExpenseFilter {
  categoryId: string | null;
  search: string;
  startDate: string | null;
  endDate: string | null;
  paymentMethod: string | null;
}

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  lastFetched: number | null;
  filter: ExpenseFilter;
  setFilter: (filter: Partial<ExpenseFilter>) => void;
  resetFilter: () => void;
  fetchExpenses: (userId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<Expense | null>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const defaultFilter: ExpenseFilter = {
  categoryId: null,
  search: '',
  startDate: null,
  endDate: null,
  paymentMethod: null,
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  loading: false,
  lastFetched: null,
  filter: defaultFilter,

  setFilter: (filter) => set(s => ({ filter: { ...s.filter, ...filter } })),
  resetFilter: () => set({ filter: defaultFilter }),

  fetchExpenses: async (userId: string) => {
    const { lastFetched } = get();
    const STALE_TIME = 5 * 60 * 1000; // 5 minutes
    if (lastFetched && Date.now() - lastFetched < STALE_TIME) return;

    set({ loading: true });
    const { data } = await supabase
      .from('expenses')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    set({ expenses: (data as Expense[]) ?? [], loading: false, lastFetched: Date.now() });
  },

  addExpense: async (expense) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select('*, category:categories(*)')
      .single();
    if (error || !data) return null;
    const newExpense = data as Expense;
    set(s => ({ expenses: [newExpense, ...s.expenses], lastFetched: null }));
    return newExpense;
  },

  updateExpense: async (id, updates) => {
    const { data } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();
    if (data) {
      set(s => ({
        expenses: s.expenses.map(e => e.id === id ? data as Expense : e),
      }));
    }
  },

  deleteExpense: async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
  },
}));

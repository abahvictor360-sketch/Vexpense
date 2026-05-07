import { create } from 'zustand';
import type { Category } from '../types';
import { supabase } from '../lib/supabase';

interface CategoryState {
  categories: Category[];
  loading: boolean;
  fetchCategories: (userId: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loading: false,

  fetchCategories: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .order('is_default', { ascending: false })
      .order('name');
    set({ categories: (data as Category[]) ?? [], loading: false });
  },

  addCategory: async (cat) => {
    const { data } = await supabase.from('categories').insert(cat).select().single();
    if (data) set(s => ({ categories: [...s.categories, data as Category] }));
  },

  deleteCategory: async (id) => {
    await supabase.from('categories').delete().eq('id', id);
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
  },
}));

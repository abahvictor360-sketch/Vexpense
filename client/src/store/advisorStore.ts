import { create } from 'zustand';
import type { AiMessage } from '../types';
import { supabase } from '../lib/supabase';
import { streamChat } from '../lib/api';

interface AdvisorState {
  messages: AiMessage[];
  loading: boolean;
  streaming: boolean;
  streamingText: string;
  fetchHistory: (userId: string) => Promise<void>;
  sendMessage: (content: string, userId: string) => Promise<void>;
  clearHistory: (userId: string) => Promise<void>;
}

export const useAdvisorStore = create<AdvisorState>((set, get) => ({
  messages: [],
  loading: false,
  streaming: false,
  streamingText: '',

  fetchHistory: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);
    set({ messages: (data as AiMessage[]) ?? [], loading: false });
  },

  sendMessage: async (content, userId) => {
    const userMsg: AiMessage = {
      id: crypto.randomUUID(),
      user_id: userId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    set(s => ({ messages: [...s.messages, userMsg], streaming: true, streamingText: '' }));

    let accumulated = '';

    await streamChat(
      content,
      (text) => {
        accumulated += text;
        set({ streamingText: accumulated });
      },
      () => {
        const assistantMsg: AiMessage = {
          id: crypto.randomUUID(),
          user_id: userId,
          role: 'assistant',
          content: accumulated,
          created_at: new Date().toISOString(),
        };
        set(s => ({
          messages: [...s.messages, assistantMsg],
          streaming: false,
          streamingText: '',
        }));
      },
      (err) => {
        const errMsg: AiMessage = {
          id: crypto.randomUUID(),
          user_id: userId,
          role: 'assistant',
          content: `I'm having trouble connecting right now. Please try again in a moment. (${err})`,
          created_at: new Date().toISOString(),
        };
        set(s => ({
          messages: [...s.messages, errMsg],
          streaming: false,
          streamingText: '',
        }));
      }
    );
  },

  clearHistory: async (userId) => {
    await supabase.from('ai_conversations').delete().eq('user_id', userId);
    set({ messages: [], streamingText: '' });
  },
}));

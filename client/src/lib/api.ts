import { supabase } from './supabase';
import type { EconomyData } from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:3001';

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getInsight(): Promise<{ insight: string }> {
  return apiFetch('/api/ai/insight', { method: 'POST' });
}

export async function getReport(): Promise<{ report: string }> {
  return apiFetch('/api/ai/report', { method: 'POST' });
}

export async function getEconomy(countryCode: string): Promise<EconomyData> {
  return apiFetch(`/api/economy/${countryCode}`);
}

export async function streamChat(
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError?: (err: string) => void
): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok || !res.body) {
    onError?.('AI unavailable');
    onDone();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(raw) as { text?: string; error?: string };
        if (parsed.error) { onError?.(parsed.error); }
        else if (parsed.text) { onChunk(parsed.text); }
      } catch { /* skip malformed */ }
    }
  }
  onDone();
}

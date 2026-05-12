import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const gPressedRef = useRef<number | null>(null);

  useEffect(() => {
    function isTyping(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    }

    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        gPressedRef.current = Date.now();
        return;
      }

      const recentG = gPressedRef.current && Date.now() - gPressedRef.current < 1200;
      if (recentG) {
        gPressedRef.current = null;
        const k = e.key.toLowerCase();
        if (k === 'h') {
          navigate('/');
        } else if (k === 'u') {
          navigate('/users');
        } else if (k === 't') {
          navigate('/transactions');
        } else if (k === 's') {
          navigate('/settings');
        } else if (k === 'a') {
          navigate('/ai');
        } else if (k === 'n') {
          navigate('/notifications');
        }
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return { helpOpen, setHelpOpen };
}

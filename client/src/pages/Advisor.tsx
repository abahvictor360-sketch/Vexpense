import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Plus, MessageSquareHeart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAdvisorStore } from '../store/advisorStore';
import { clsx } from '../utils/clsx';

const SUGGESTED_PROMPTS = [
  'How can I reduce my spending this month?',
  'Help me create a savings plan',
  "What's eating most of my money?",
  'Am I on track with my budget?',
  'Give me tips to save faster',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-brand-400"
          style={{ animation: `pulseDot 1.4s infinite ease-in-out ${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export default function Advisor() {
  const { user } = useAuthStore();
  const { messages, streaming, streamingText, fetchHistory, sendMessage, clearHistory } = useAdvisorStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user?.id) fetchHistory(user.id);
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming || !user) return;
    setInput('');
    await sendMessage(text, user.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (!user) return;
    await clearHistory(user.id);
  };

  const isFresh = messages.length === 0 && !streaming;

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] lg:h-[calc(100vh-3rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
            <MessageSquareHeart className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">AI Advisor</h1>
            <p className="text-xs text-gray-400">Powered by Claude</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <Plus className="w-3.5 h-3.5" /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
        {isFresh && (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-brand-gradient flex items-center justify-center shadow-brand">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Your AI Finance Advisor</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Ask me anything about your spending, budgets, and savings goals. I have full context of your finances.
              </p>
            </div>
            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-all text-left shadow-card"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={clsx(
                'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-card'
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streaming && (
          <div className="flex justify-start items-start gap-2">
            <div className="w-7 h-7 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="max-w-[78%] bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-card overflow-hidden">
              {streamingText ? (
                <div className="px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-0.5 h-4 bg-brand-600 animate-pulse ml-0.5 -mb-0.5" />
                </div>
              ) : (
                <TypingDots />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="flex-shrink-0 pt-3 border-t border-gray-100">
        <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-card focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your finances..."
            rows={1}
            className="flex-1 resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 py-1 max-h-32 bg-transparent"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className={clsx(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              input.trim() && !streaming
                ? 'bg-brand-600 text-white shadow-brand hover:bg-brand-700 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Powered by Anthropic Claude · Context includes your real financial data
        </p>
      </div>
    </div>
  );
}

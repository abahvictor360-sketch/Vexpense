import { Pause, Play, Trash2, Activity as ActivityIcon, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { Badge } from './ui/Badge';
import clsx from 'clsx';

const TYPE_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'accent'> = {
  expense: 'info',
  user: 'success',
  ai: 'accent',
  goal: 'success',
  budget: 'info',
  alert: 'warning',
  error: 'danger',
};

export function ActivityFeed({ className }: { className?: string }) {
  const { activities, paused, setPaused, clear, connected } = useSocket();

  return (
    <div className={clsx('card flex flex-col', className)}>
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Live Activity</h3>
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            {connected ? (
              <>
                <Wifi className="w-3 h-3 text-ok" /> connected
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-err" /> offline
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaused(!paused)}
            className="btn-ghost p-1.5"
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button onClick={clear} className="btn-ghost p-1.5" title="Clear">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {activities.length === 0 && (
          <div className="p-6 text-center text-xs text-ink-muted">
            {connected ? 'Listening for activity…' : 'Waiting to connect…'}
          </div>
        )}
        {activities.map((a) => (
          <div key={a.id} className="px-5 py-3 border-b border-line/40 last:border-0 hover:bg-bg-hover/50 transition-colors">
            <div className="flex items-start gap-3">
              <Badge variant={TYPE_VARIANT[a.type] ?? 'neutral'}>{a.type}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink truncate">{a.message}</div>
                <div className="text-xs text-ink-muted mt-0.5">
                  {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

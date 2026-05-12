import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminApi } from '../api';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import type { AdminNotification } from '../types';

const SEVERITY_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  critical: 'danger',
};

export function Notifications() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.notifications();
      setItems(r.notifications);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Message is required');
      return;
    }
    setSending(true);
    try {
      await adminApi.sendNotification(message.trim(), severity);
      toast.success('Notification sent');
      setMessage('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  async function markRead(n: AdminNotification) {
    try {
      await adminApi.markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  const unread = items.filter((i) => !i.is_read).length;
  const systemAlerts = items.filter((i) => i.severity === 'warning' || i.severity === 'critical' || i.severity === 'error');

  const columns = useMemo<Column<AdminNotification>[]>(
    () => [
      {
        key: 'created_at',
        header: 'Time',
        sortable: true,
        render: (n) => (
          <span className="text-ink-dim text-xs">{format(new Date(n.created_at), 'MMM d, HH:mm')}</span>
        ),
      },
      {
        key: 'severity',
        header: 'Severity',
        render: (n) => <Badge variant={SEVERITY_VARIANT[n.severity] ?? 'neutral'}>{n.severity}</Badge>,
      },
      { key: 'message', header: 'Message', render: (n) => n.message },
      {
        key: 'is_read',
        header: 'Status',
        render: (n) =>
          n.is_read ? (
            <Badge variant="neutral">read</Badge>
          ) : (
            <Badge variant="accent">new</Badge>
          ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (n) =>
          !n.is_read ? (
            <button className="btn-ghost p-1.5" onClick={() => markRead(n)} title="Mark as read">
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : null,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Compose</h3>
          <form onSubmit={send} className="space-y-3">
            <div>
              <label className="label block mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="System maintenance scheduled for…"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[160px]">
                <label className="label block mb-1.5">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="input"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={sending}>
                <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-dim">Total</span>
              <span className="tabular-nums">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">Unread</span>
              <span className="tabular-nums text-accent">{unread}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-dim">System alerts</span>
              <span className="tabular-nums text-warn">{systemAlerts.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">History</h3>
        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          emptyLabel="No notifications yet."
        />
      </div>
    </div>
  );
}

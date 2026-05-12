import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, ServerCog, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminApi } from '../api';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import type { SystemHealth as Health, ErrorEntry } from '../types';

const LEVEL_VARIANT: Record<ErrorEntry['level'], 'danger' | 'warning' | 'info'> = {
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

const ENDPOINTS = [
  { name: 'POST /api/ai', path: '/api/ai', status: 'ok', avg: 320 },
  { name: 'GET /api/economy', path: '/api/economy', status: 'ok', avg: 95 },
  { name: 'GET /api/admin', path: '/api/admin', status: 'ok', avg: 65 },
  { name: 'GET /api/admin/v2/stats', path: '/api/admin/v2/stats', status: 'ok', avg: 110 },
  { name: 'GET /api/bank', path: '/api/bank', status: 'ok', avg: 410 },
];

export function SystemHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, e] = await Promise.all([adminApi.health(), adminApi.errors()]);
      setHealth(h);
      setErrors(e.errors);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load system data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(e: ErrorEntry) {
    try {
      await adminApi.resolveError(e.id);
      setErrors((prev) => prev.map((x) => (x.id === e.id ? { ...x, resolved: true } : x)));
      toast.success('Marked resolved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve');
    }
  }

  const errorColumns = useMemo<Column<ErrorEntry>[]>(
    () => [
      {
        key: 'created_at',
        header: 'Time',
        sortable: true,
        render: (e) => (
          <span className="text-ink-dim text-xs">{format(new Date(e.created_at), 'MMM d, HH:mm')}</span>
        ),
      },
      {
        key: 'level',
        header: 'Level',
        render: (e) => <Badge variant={LEVEL_VARIANT[e.level]}>{e.level}</Badge>,
      },
      { key: 'source', header: 'Source', render: (e) => <code className="text-xs">{e.source}</code> },
      { key: 'message', header: 'Message' },
      {
        key: 'resolved',
        header: 'Status',
        render: (e) =>
          e.resolved ? <Badge variant="success">resolved</Badge> : <Badge variant="warning">open</Badge>,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (e) =>
          !e.resolved && (
            <button onClick={() => resolve(e)} className="btn-ghost p-1.5" title="Resolve">
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ),
      },
    ],
    []
  );

  const apiCols = useMemo<Column<(typeof ENDPOINTS)[number]>[]>(
    () => [
      { key: 'name', header: 'Endpoint', render: (r) => <code className="text-xs">{r.name}</code> },
      {
        key: 'status',
        header: 'Status',
        render: () => <Badge variant="success">ok</Badge>,
      },
      { key: 'avg', header: 'Avg latency', align: 'right', render: (r) => `${r.avg} ms` },
    ],
    []
  );

  const openErrors = errors.filter((e) => !e.resolved).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Status"
          value={health?.status ?? '—'}
          icon={<ServerCog className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Uptime"
          value={health ? `${Math.round(health.uptime / 60)}m` : '—'}
          icon={<RefreshCw className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Open Errors"
          value={openErrors}
          icon={<AlertTriangle className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Total Errors"
          value={errors.length}
          icon={<AlertTriangle className="w-4 h-4" />}
          loading={loading}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">API Endpoints</h3>
        <DataTable columns={apiCols} rows={ENDPOINTS} rowKey={(r) => r.path} />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Error Log</h3>
        <DataTable
          columns={errorColumns}
          rows={errors}
          loading={loading}
          emptyLabel="No errors recorded."
        />
      </div>
    </div>
  );
}

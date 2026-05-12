import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Coins, MessagesSquare, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminApi } from '../api';
import { KpiCard } from '../components/ui/KpiCard';
import { ChartCard } from '../components/charts/ChartCard';
import { LineChart } from '../components/charts/LineChart';
import { AreaChart } from '../components/charts/AreaChart';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import type { AiStats, AiLog } from '../types';

export function AiMonitor() {
  const [stats, setStats] = useState<AiStats | null>(null);
  const [charts, setCharts] = useState<{
    daily: { date: string; value: number }[];
    tokens: { date: string; value: number }[];
    cost: { date: string; value: number }[];
  } | null>(null);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, l] = await Promise.all([
        adminApi.aiStats(),
        adminApi.aiCharts(),
        adminApi.aiLogs({ page, limit: 25 }),
      ]);
      setStats(s);
      setCharts(c);
      setLogs(l.logs);
      setPages(l.pages);
      setTotal(l.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load AI data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo<Column<AiLog>[]>(
    () => [
      {
        key: 'created_at',
        header: 'Time',
        sortable: true,
        render: (l) => (
          <span className="text-ink-dim text-xs">{format(new Date(l.created_at), 'MMM d, HH:mm')}</span>
        ),
      },
      { key: 'user_id_anon', header: 'User', render: (l) => <code className="text-xs">{l.user_id_anon}</code> },
      {
        key: 'message',
        header: 'Message',
        render: (l) => (
          <div className="text-sm text-ink truncate max-w-[280px]">{l.message ?? '—'}</div>
        ),
      },
      {
        key: 'response_preview',
        header: 'Response',
        render: (l) => (
          <div className="text-xs text-ink-dim truncate max-w-[360px]">
            {l.response_preview || '—'}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Conversations"
          value={stats?.totalConversations.toLocaleString() ?? '—'}
          icon={<MessagesSquare className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Today"
          value={stats?.todayConversations.toLocaleString() ?? '—'}
          icon={<Bot className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Est. Tokens"
          value={stats ? `${(stats.estimatedTokens / 1000).toFixed(1)}k` : '—'}
          icon={<Zap className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Est. Cost"
          value={stats ? `$${stats.estimatedCost}` : '—'}
          icon={<Coins className="w-4 h-4" />}
          loading={loading}
          hint={stats ? `$${stats.avgCostPerMessage}/msg` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Daily Conversations" subtitle="Last 30 days">
          {charts && <AreaChart data={charts.daily} color="#a855f7" />}
        </ChartCard>
        <ChartCard title="Tokens / day" subtitle="Estimated">
          {charts && <LineChart data={charts.tokens} color="#06b6d4" />}
        </ChartCard>
        <ChartCard title="Cost / day" subtitle="USD estimated">
          {charts && <LineChart data={charts.cost} color="#f59e0b" />}
        </ChartCard>
      </div>

      <DataTable columns={columns} rows={logs} loading={loading} emptyLabel="No AI logs yet." />
      <Pagination page={page} pages={pages} total={total} onChange={setPage} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Flag, FlagOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminApi } from '../api';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { ChartCard } from '../components/charts/ChartCard';
import { LineChart } from '../components/charts/LineChart';
import { BarChart } from '../components/charts/BarChart';
import { AreaChart } from '../components/charts/AreaChart';
import type { Transaction } from '../types';

export function Transactions() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const [charts, setCharts] = useState<{
    transactionCount: { date: string; value: number }[];
    volume: { date: string; value: number }[];
    distribution: { name: string; value: number }[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.transactions({
        page,
        limit: 25,
        search,
        flagged: flaggedOnly,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
      });
      setRows(r.transactions);
      setTotal(r.total);
      setPages(r.pages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, search, flaggedOnly, minAmount]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminApi
      .transactionCharts()
      .then(setCharts)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : 'Failed to load charts')
      );
  }, []);

  async function toggleFlag(t: Transaction) {
    try {
      const r = await adminApi.flagTransaction(t.id);
      setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, flagged: r.flagged } : x)));
      toast.success(r.flagged ? 'Flagged' : 'Unflagged');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to flag');
    }
  }

  const columns = useMemo<Column<Transaction>[]>(
    () => [
      {
        key: 'created_at',
        header: 'Date',
        sortable: true,
        render: (t) => (
          <span className="text-ink-dim text-xs">
            {format(new Date(t.created_at), 'MMM d, HH:mm')}
          </span>
        ),
      },
      { key: 'user_id_anon', header: 'User', render: (t) => <code className="text-xs">{t.user_id_anon}</code> },
      { key: 'description', header: 'Description', render: (t) => t.description ?? <span className="text-ink-muted">—</span> },
      { key: 'category', header: 'Category', render: (t) => <Badge variant="info">{t.category}</Badge> },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        sortable: true,
        render: (t) => `₦${Number(t.amount ?? 0).toLocaleString()}`,
      },
      {
        key: 'flagged',
        header: '',
        align: 'right',
        render: (t) => (
          <button
            className={'btn-ghost p-1.5 ' + (t.flagged ? 'text-warn' : '')}
            onClick={() => toggleFlag(t)}
            title={t.flagged ? 'Unflag' : 'Flag'}
          >
            {t.flagged ? <Flag className="w-4 h-4" /> : <FlagOff className="w-4 h-4" />}
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Transactions / day" subtitle="Last 30 days">
          {charts && <BarChart data={charts.transactionCount} xKey="date" />}
        </ChartCard>
        <ChartCard title="Volume / day" subtitle="₦ — Last 30 days">
          {charts && <AreaChart data={charts.volume} color="#22c55e" />}
        </ChartCard>
        <ChartCard title="Amount distribution" subtitle="Bucketed by size">
          {charts && <LineChart data={charts.distribution} xKey="name" />}
        </ChartCard>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search description"
            className="input pl-9"
          />
        </div>
        <input
          type="number"
          placeholder="Min amount"
          value={minAmount}
          onChange={(e) => {
            setMinAmount(e.target.value);
            setPage(1);
          }}
          className="input max-w-[160px]"
        />
        <label className="flex items-center gap-2 text-sm text-ink-dim cursor-pointer">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => {
              setFlaggedOnly(e.target.checked);
              setPage(1);
            }}
            className="accent-accent"
          />
          Flagged only
        </label>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} emptyLabel="No transactions found." />
      <Pagination page={page} pages={pages} total={total} onChange={setPage} />
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { Users, Receipt, Bot, Target, DollarSign, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api';
import { KpiCard } from '../components/ui/KpiCard';
import { ChartCard } from '../components/charts/ChartCard';
import { AreaChart } from '../components/charts/AreaChart';
import { LineChart } from '../components/charts/LineChart';
import { PieChart } from '../components/charts/PieChart';
import { ActivityFeed } from '../components/ActivityFeed';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { KpiOverview, ChartsResponse } from '../types';

export function Dashboard() {
  const [kpi, setKpi] = useState<KpiOverview | null>(null);
  const [charts, setCharts] = useState<ChartsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [k, c] = await Promise.all([adminApi.overview(), adminApi.charts()]);
      setKpi(k);
      setCharts(c);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAutoRefresh(load, 60000);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Users"
          value={kpi?.totalUsers.toLocaleString() ?? '—'}
          icon={<Users className="w-4 h-4" />}
          loading={loading}
          hint={kpi ? `${kpi.activeUsers} active` : undefined}
        />
        <KpiCard
          title="Active 30d"
          value={kpi?.activeUsers.toLocaleString() ?? '—'}
          icon={<Users className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Transactions"
          value={kpi?.totalExpenses.toLocaleString() ?? '—'}
          icon={<Receipt className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Volume"
          value={kpi ? `₦${Math.round(kpi.totalVolume).toLocaleString()}` : '—'}
          icon={<DollarSign className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="AI Conversations"
          value={kpi?.totalAiConversations.toLocaleString() ?? '—'}
          icon={<Bot className="w-4 h-4" />}
          loading={loading}
          hint={kpi ? `~$${kpi.aiCostEstimate}` : undefined}
        />
        <KpiCard
          title="Goals"
          value={kpi?.totalGoals.toLocaleString() ?? '—'}
          icon={<Target className="w-4 h-4" />}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="User Growth" subtitle="New users — last 30 days" className="lg:col-span-2">
          {charts && <AreaChart data={charts.userGrowth} color="#6366f1" />}
        </ChartCard>
        <ChartCard title="Spending Categories" subtitle="By total volume">
          {charts && <PieChart data={charts.categoryBreakdown} />}
        </ChartCard>
        <ChartCard title="Expense Volume" subtitle="₦ — last 30 days">
          {charts && <LineChart data={charts.expenseVolume} color="#22c55e" />}
        </ChartCard>
        <ChartCard title="AI Usage" subtitle="Conversations / day">
          {charts && <LineChart data={charts.aiUsage} color="#a855f7" />}
        </ChartCard>
        <ActivityFeed />
      </div>

      {kpi?.systemStatus && kpi.systemStatus !== 'healthy' && (
        <div className="card p-4 border-warn/40 bg-warn/5 flex items-center gap-3 text-warn">
          <AlertTriangle className="w-5 h-5" />
          System status: {kpi.systemStatus}
        </div>
      )}
    </div>
  );
}

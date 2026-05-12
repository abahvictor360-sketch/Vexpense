import { useCallback, useEffect, useState } from 'react';
import { Cpu, HardDrive, Timer, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api';
import { KpiCard } from '../components/ui/KpiCard';
import { ChartCard } from '../components/charts/ChartCard';
import { AreaChart } from '../components/charts/AreaChart';
import { LineChart } from '../components/charts/LineChart';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { SystemHealth } from '../types';

interface Point {
  date: string;
  value: number;
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}

function fmtBytes(n: number): string {
  const mb = n / 1024 / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function HealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [memSeries, setMemSeries] = useState<Point[]>([]);
  const [heapSeries, setHeapSeries] = useState<Point[]>([]);
  const [uptimeSeries, setUptimeSeries] = useState<Point[]>([]);
  const [rssSeries, setRssSeries] = useState<Point[]>([]);

  const tick = useCallback(async () => {
    try {
      const h = await adminApi.health();
      setHealth(h);
      setLoading(false);
      const stamp = new Date(h.timestamp).toLocaleTimeString();
      setMemSeries((p) => [...p.slice(-29), { date: stamp, value: +(h.memory.heapUsed / 1024 / 1024).toFixed(1) }]);
      setHeapSeries((p) => [...p.slice(-29), { date: stamp, value: +(h.memory.heapTotal / 1024 / 1024).toFixed(1) }]);
      setRssSeries((p) => [...p.slice(-29), { date: stamp, value: +(h.memory.rss / 1024 / 1024).toFixed(1) }]);
      setUptimeSeries((p) => [...p.slice(-29), { date: stamp, value: Math.round(h.uptime / 60) }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch health');
    }
  }, []);

  useEffect(() => {
    tick();
  }, [tick]);

  useAutoRefresh(tick, 5000);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Status"
          value={health?.status ?? '—'}
          icon={<Server className="w-4 h-4" />}
          loading={loading}
          hint={health?.platform}
        />
        <KpiCard
          title="Uptime"
          value={health ? formatUptime(health.uptime) : '—'}
          icon={<Timer className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          title="Heap Used"
          value={health ? fmtBytes(health.memory.heapUsed) : '—'}
          icon={<Cpu className="w-4 h-4" />}
          loading={loading}
          hint={health ? `of ${fmtBytes(health.memory.heapTotal)}` : undefined}
        />
        <KpiCard
          title="RSS"
          value={health ? fmtBytes(health.memory.rss) : '—'}
          icon={<HardDrive className="w-4 h-4" />}
          loading={loading}
          hint={health?.node}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Heap Used (MB)" subtitle="Live • 5s interval">
          <AreaChart data={memSeries} color="#6366f1" />
        </ChartCard>
        <ChartCard title="Heap Total (MB)" subtitle="Live">
          <LineChart data={heapSeries} color="#22c55e" />
        </ChartCard>
        <ChartCard title="RSS (MB)" subtitle="Resident set size">
          <AreaChart data={rssSeries} color="#f59e0b" />
        </ChartCard>
        <ChartCard title="Uptime (min)" subtitle="Live">
          <LineChart data={uptimeSeries} color="#a855f7" />
        </ChartCard>
      </div>
    </div>
  );
}

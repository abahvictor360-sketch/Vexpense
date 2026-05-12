import {
  ResponsiveContainer,
  AreaChart as RArea,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const DARK_AXIS = { stroke: '#5e5e6b', fontSize: 11 };

export function AreaChart({
  data,
  dataKey = 'value',
  xKey = 'date',
  color = '#6366f1',
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
}) {
  const id = `grad-${dataKey}-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RArea data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="#23232e" vertical={false} />
        <XAxis dataKey={xKey} tick={DARK_AXIS} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis tick={DARK_AXIS} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          contentStyle={{
            background: '#13131a',
            border: '1px solid #23232e',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#9a9aa6' }}
          itemStyle={{ color: '#e8e8ee' }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
        />
      </RArea>
    </ResponsiveContainer>
  );
}

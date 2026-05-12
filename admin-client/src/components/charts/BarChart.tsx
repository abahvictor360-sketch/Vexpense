import {
  ResponsiveContainer,
  BarChart as RBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const DARK_AXIS = { stroke: '#5e5e6b', fontSize: 11 };

export function BarChart({
  data,
  dataKey = 'value',
  xKey = 'name',
  color = '#6366f1',
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RBar data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#23232e" vertical={false} />
        <XAxis dataKey={xKey} tick={DARK_AXIS} axisLine={false} tickLine={false} />
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
          cursor={{ fill: '#1a1a24' }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </RBar>
    </ResponsiveContainer>
  );
}

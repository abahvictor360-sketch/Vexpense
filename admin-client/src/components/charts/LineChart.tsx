import {
  ResponsiveContainer,
  LineChart as RLine,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const DARK_AXIS = { stroke: '#5e5e6b', fontSize: 11 };

export function LineChart({
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
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RLine data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </RLine>
    </ResponsiveContainer>
  );
}

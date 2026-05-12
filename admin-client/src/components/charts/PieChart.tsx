import {
  ResponsiveContainer,
  PieChart as RPie,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#eab308', '#14b8a6'];

export function PieChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey?: string;
  nameKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RPie>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
          stroke="#13131a"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#13131a',
            border: '1px solid #23232e',
            borderRadius: 8,
            fontSize: 12,
          }}
          itemStyle={{ color: '#e8e8ee' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#9a9aa6' }}
          iconType="circle"
        />
      </RPie>
    </ResponsiveContainer>
  );
}

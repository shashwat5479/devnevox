"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const BRAND = "#22e56a";
const PALETTE = ["#22e56a", "#38bdf8", "#a78bfa", "#f59e0b", "#f472b6", "#34d399", "#64748b"];

export function StatusPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltip} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RevenueBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 12% 20%)" vertical={false} />
        <XAxis dataKey="name" stroke="hsl(150 8% 55%)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(150 8% 55%)" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "hsl(150 20% 14% / 0.5)" }} contentStyle={tooltip} />
        <Bar dataKey="value" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const tooltip = {
  background: "hsl(155 20% 8%)",
  border: "1px solid hsl(150 12% 18%)",
  borderRadius: 10,
  fontSize: 12,
  color: "#e5f6ea",
};

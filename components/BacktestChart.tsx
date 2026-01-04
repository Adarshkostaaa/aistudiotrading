import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BacktestChartProps {
  data: { date: string; equity: number }[];
  color?: string;
}

const BacktestChart: React.FC<BacktestChartProps> = ({ data, color = "#10b981" }) => {
  return (
    <div className="w-full h-64 bg-gray-850 rounded-lg p-4 shadow-inner border border-gray-750">
      <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">Equity Curve (Simulated)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`colorGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="date" 
            hide={true} 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#94a3b8" 
            fontSize={12}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: color }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]}
          />
          <Area 
            type="monotone" 
            dataKey="equity" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#colorGradient-${color})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BacktestChart;

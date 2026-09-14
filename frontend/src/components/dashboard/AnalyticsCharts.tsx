
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { DashboardChart } from '../../pages/dashboard/dashboardData';

interface AnalyticsChartsProps {
  charts: DashboardChart[];
}

export function AnalyticsCharts({ charts }: AnalyticsChartsProps) {
  if (!charts || charts.length === 0) return null;

  const formatValue = (value: number, chart: DashboardChart) =>
    `${chart.valuePrefix || ''}${value.toLocaleString()}${chart.valueSuffix || ''}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {charts.map((chart, index) => {
        const total = chart.data.reduce((sum, point) => sum + Number(point[chart.primaryDataKey as keyof typeof point] || 0), 0);
        const ChartIcon = chart.type === 'pie' ? PieChartIcon : BarChart3;

        return (
        <div
          key={chart.id}
          className={`bg-white rounded-2xl shadow-2xs border border-slate-200 p-4 sm:p-5 overflow-hidden ${
            charts.length % 2 === 1 && index === charts.length - 1 ? 'lg:col-span-2' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analytics</p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">{chart.title}</h3>
            </div>
            <div className="rounded-xl bg-[#05AD98]/10 p-2 text-[#05AD98]">
              <ChartIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-extrabold tracking-tight text-slate-900">{formatValue(total, chart)}</span>
            <span className="text-[11px] text-slate-400">total across this view</span>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'bar' ? (
                <BarChart data={chart.data} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => {
                      if (chart.valueSuffix === ' XAF') {
                        return value >= 1000000 
                          ? `${(value / 1000000).toFixed(1)}M` 
                          : value >= 1000 
                            ? `${(value / 1000).toFixed(0)}k` 
                            : value;
                      }
                      return value;
                    }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f0fdfa' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #ccfbf1', boxShadow: '0 10px 25px -10px rgb(15 23 42 / 0.25)', fontSize: '12px' }}
                    formatter={(value: any) => [formatValue(Number(Array.isArray(value) ? value[0] : value || 0), chart), 'Value']}
                  />
                  <Bar 
                    dataKey={chart.primaryDataKey} 
                    fill={chart.primaryColor} 
                    radius={[7, 7, 0, 0]}
                    maxBarSize={50}
                  >
                    {chart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || chart.primaryColor} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chart.type === 'pie' ? (
                <PieChart>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #ccfbf1', boxShadow: '0 10px 25px -10px rgb(15 23 42 / 0.25)', fontSize: '12px' }}
                    formatter={(value: any) => [formatValue(Number(Array.isArray(value) ? value[0] : value || 0), chart), 'Value']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-600 text-sm">{value}</span>}
                  />
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="45%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey={chart.primaryDataKey}
                    stroke="none"
                  >
                    {chart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || chart.primaryColor} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  This chart format is not available yet.
                </div>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3">
            {chart.data.slice(0, 4).map((point) => (
              <div key={point.name} className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5 text-slate-500 truncate">
                  <i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: point.fill || chart.primaryColor }} />
                  <span className="truncate">{point.name}</span>
                </span>
                <span className="font-semibold text-slate-700">{formatValue(Number(point[chart.primaryDataKey as keyof typeof point] || 0), chart)}</span>
              </div>
            ))}
          </div>
        </div>
      )})}
    </div>
  );
}

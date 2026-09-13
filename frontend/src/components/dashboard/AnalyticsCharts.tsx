
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
import { DashboardChart } from '../../pages/dashboard/dashboardData';

interface AnalyticsChartsProps {
  charts: DashboardChart[];
}

export function AnalyticsCharts({ charts }: AnalyticsChartsProps) {
  if (!charts || charts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-8">
      {charts.map((chart) => (
        <div key={chart.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">{chart.title}</h3>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'bar' ? (
                <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
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
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => {
                      return [`${chart.valuePrefix || ''}${Number(value).toLocaleString()}${chart.valueSuffix || ''}`, 'Value'];
                    }}
                  />
                  <Bar 
                    dataKey={chart.primaryDataKey} 
                    fill={chart.primaryColor} 
                    radius={[4, 4, 0, 0]} 
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
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()}${chart.valueSuffix || ''}`, 'Count']}
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
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
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
                  Unsupported chart type: {chart.type}
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}

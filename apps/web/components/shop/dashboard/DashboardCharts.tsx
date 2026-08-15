"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Data for Donut Chart
const donutData = [
  { name: "โปสเตอร์", value: 3650, color: "#8b5cf6" },
  { name: "ปริ้นสี", value: 2450, color: "#06b6d4" },
  { name: "ปริ้นขาวดำ", value: 1520, color: "#10b981" },
  { name: "สติ๊กเกอร์", value: 720, color: "#f97316" },
  { name: "อื่นๆ", value: 200, color: "#ec4899" },
];

const totalRevenue = donutData.reduce((sum, item) => sum + item.value, 0);

// Custom Donut Label
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  return null; // We use external legend instead
};

// Data for Area Chart
const areaData = [
  { time: "00:00", revenue: 1200 },
  { time: "04:00", revenue: 2400 },
  { time: "08:00", revenue: 2600 },
  { time: "12:00", revenue: 6800 },
  { time: "16:00", revenue: 4500 },
  { time: "20:00", revenue: 6500 },
  { time: "23:59", revenue: 4000 },
];

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      
      {/* Donut Chart - รายได้วันนี้ (แยกตามประเภทสินค้า) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[350px]">
        <h2 className="text-base font-bold text-slate-800 mb-4">รายได้วันนี้ (แยกตามประเภทสินค้า)</h2>
        <div className="flex-1 flex items-center relative">
          
          <div className="w-[180px] h-[180px] shrink-0 relative">
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-500 font-medium">รวม</span>
              <span className="text-xl font-bold text-slate-800 leading-tight">
                {totalRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">บาท</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} บาท`, 'รายได้']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 pl-4 flex flex-col gap-3 justify-center">
            {donutData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-start">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Area Chart - รายได้ตลอดวัน */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[350px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">รายได้ตลอดวัน (บาท)</h2>
          <button className="text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
            เรียลไทม์
          </button>
        </div>
        
        <div className="flex-1 w-full relative -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={areaData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(value) => value >= 1000 ? `${value / 1000}K` : value}
                dx="-5"
              />
              <Tooltip 
                formatter={(value: any) => [`${value.toLocaleString()} บาท`, 'รายได้']}
                labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

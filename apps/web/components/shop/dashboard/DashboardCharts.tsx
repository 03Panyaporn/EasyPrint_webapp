"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";

import { useEffect, useState } from "react";
import { getMyShop } from "@/lib/api/services";
import { listShopOrders } from "@/lib/api/orders";
import { toOrder } from "@/lib/ordersAdapter";

// Custom Donut Label
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  return null; // We use external legend instead
};

export default function DashboardCharts() {
  const [donutData, setDonutData] = useState<any[]>([]);
  const [areaData, setAreaData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const { shop } = await getMyShop();
        const { orders: apiOrders } = await listShopOrders(shop.id);
        const allOrders = apiOrders.map(toOrder);
        
        const todayStr = new Date().toISOString().split('T')[0];
        // นับเฉพาะออเดอร์ที่ไม่ได้ถูกยกเลิก เป็นรายได้ที่คาดหวังหรือได้จริง
        const todayOrders = allOrders.filter(o => o.createdAt.startsWith(todayStr) && o.status !== "cancelled" && o.status !== "pending_review");
        
        let sum = 0;
        const categoryMap = new Map<string, number>();
        const hourMap = new Map<number, number>();
        
        // Initialize hours 0-23
        for (let i = 0; i < 24; i++) {
          hourMap.set(i, 0);
        }
        
        todayOrders.forEach(o => {
          sum += o.price;
          // Donut Data (by category)
          categoryMap.set(o.category, (categoryMap.get(o.category) || 0) + o.price);
          
          // Area Data (by hour)
          const date = new Date(o.createdAt);
          const hour = date.getHours();
          hourMap.set(hour, hourMap.get(hour)! + o.price);
        });
        
        const colors = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"];
        const newDonutData = Array.from(categoryMap.entries()).map(([name, value], i) => ({
          name,
          value,
          color: colors[i % colors.length]
        })).sort((a, b) => b.value - a.value);
        
        // Area Chart: filter up to current hour so we don't show flat line for future hours
        const currentHour = new Date().getHours();
        const newAreaData = Array.from(hourMap.entries())
          .filter(([hour, _]) => hour <= currentHour)
          .map(([hour, revenue]) => ({
            time: `${hour.toString().padStart(2, '0')}:00`,
            revenue
          }));
        
        setDonutData(newDonutData);
        setAreaData(newAreaData);
        setTotalRevenue(sum);
      } catch (err) {
        console.error(err);
      }
    }
    
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("order-status-updated", handleUpdate);
    return () => window.removeEventListener("order-status-updated", handleUpdate);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      
      {/* Donut Chart - รายได้วันนี้ (แยกตามประเภทสินค้า) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[350px]">
        <h2 className="text-base font-bold text-slate-800 mb-4">รายได้วันนี้ (แยกตามประเภทสินค้า)</h2>
        <div className="flex-1 flex items-center relative">
          
          {donutData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={32} className="mb-2 opacity-30" />
              <span className="text-sm font-medium">ยังไม่มีข้อมูล</span>
            </div>
          ) : (
            <>
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
            </>
          )}

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
        
        <div className="flex-1 w-full relative -ml-4 flex items-center justify-center">
          {areaData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 ml-4">
              <TrendingUp size={32} className="mb-2 opacity-30" />
              <span className="text-sm font-medium">ยังไม่มีข้อมูลสำหรับวันนี้</span>
            </div>
          ) : (
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
          )}
        </div>
      </div>

    </div>
  );
}

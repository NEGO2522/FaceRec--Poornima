import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, UserCheck, Clock, Search, Users, 
  BarChart3, UserMinus, TrendingUp, MapPin
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const Dashboard = ({ csvData = [], onBack }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailList, setShowDetailList] = useState(false);

  // 1. Filter data based on Search Query
  const searchFilteredData = useMemo(() => {
    if (!searchQuery.trim()) return csvData;
    return csvData.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = String(item.uid || "").includes(searchQuery);
      return nameMatch || idMatch;
    });
  }, [csvData, searchQuery]);

  // 2. Dynamic Analytics Calculation
  const stats = useMemo(() => {
    const res = {
      total: searchFilteredData.length,
      inside: searchFilteredData.filter(d => d.status === 'Inside').length,
      outside: searchFilteredData.filter(d => d.status === 'Outside').length,
      late: searchFilteredData.filter(d => d.status === 'Inside' && d.time > '09:15:00').length,
      doorMap: {},
      hourMap: {},
      hourlyChart: []
    };

    searchFilteredData.forEach(row => {
      // Mapping "Door Name" from CSV
      const rawDoor = row['Door Name'] || row.door || "Unknown Lane";
      if (rawDoor && String(rawDoor).toLowerCase() !== 'nan') {
        res.doorMap[rawDoor] = (res.doorMap[rawDoor] || 0) + 1;
      }

      // Rush Hour / Chart Logic
      const hour = row.time ? row.time.split(':')[0] : "00";
      const slot = `${hour}:00 - ${parseInt(hour) + 1}:00`;
      res.hourMap[slot] = (res.hourMap[slot] || 0) + 1;

      const chartHour = hour + ":00";
      let existingHour = res.hourlyChart.find(h => h.hour === chartHour);
      if (!existingHour) {
        existingHour = { hour: chartHour, entries: 0, exits: 0 };
        res.hourlyChart.push(existingHour);
      }
      if (row.status === 'Inside') existingHour.entries++;
      else existingHour.exits++;
    });

    res.peakHours = Object.entries(res.hourMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.hourlyChart.sort((a, b) => a.hour.localeCompare(b.hour));
    return res;
  }, [searchFilteredData]);

  const finalTableData = useMemo(() => {
    return searchFilteredData.filter(item => {
      if (activeTab === 'Inside') return item.status === 'Inside';
      if (activeTab === 'Outside') return item.status === 'Outside';
      if (activeTab === 'Late') return (item.status === 'Inside' && item.time > '09:15:00');
      return true;
    }).slice(0, 100); 
  }, [searchFilteredData, activeTab]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex font-sans antialiased overflow-hidden">
      {/* Import for Cosmic-style font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .cosmic-font { font-family: 'Orbitron', sans-serif; }
      `}</style>
      
      <aside className="w-64 bg-[#1a1d23] border-r border-gray-800 flex flex-col hidden lg:flex shrink-0">
        <div className="p-6 flex flex-col h-full">
          
          {/* Poornima University acting as the Back Button */}
          <button 
            onClick={onBack}
            className="cosmic-font text-blue-500 text-lg font-black mb-12 tracking-widest text-left hover:text-blue-400 hover:scale-105 transition-all active:scale-95 px-2"
          >
            POORNIMA <br/> <span className="text-[10px] text-blue-400/50">UNIVERSITY</span>
          </button>
          
          <nav className="flex-1 space-y-1">
            {[
              { name: 'Overview', icon: LayoutDashboard, count: stats.total },
              { name: 'Inside', icon: UserCheck, count: stats.inside },
              { name: 'Outside', icon: UserMinus, count: stats.outside },
              { name: 'Late', icon: Clock, count: stats.late },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name); setShowDetailList(item.name !== 'Overview'); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === item.name ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span className="font-bold text-xs">{item.name}</span>
                </div>
                <span className="text-[9px] bg-black/20 px-2 py-0.5 rounded-full font-bold">{item.count}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <header className="h-20 border-b border-gray-800 flex items-center justify-between px-10 bg-[#0f1115]/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold">{activeTab} Analysis</h1>
            {searchQuery && <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5 italic">Viewing: {searchQuery}</p>}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search Name or UID..." 
              className="bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm w-80 focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard title="Total Logins" value={stats.total} icon={Users} color="blue" />
            <KPICard title="Currently In" value={stats.inside} icon={UserCheck} color="emerald" />
            <KPICard title="Late Arrival" value={stats.late} icon={Clock} color="amber" />
            <KPICard title="Left Campus" value={stats.outside} icon={UserMinus} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#1a1d23] p-8 rounded-[2.5rem] border border-gray-800">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-500"/> Activity Timeline
                  </h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.hourlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                      <XAxis dataKey="hour" stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{backgroundColor: '#1a1d23', border: '1px solid #334155', borderRadius: '12px'}} />
                      <Area type="monotone" dataKey="entries" name="IN" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                      <Area type="monotone" dataKey="exits" name="OUT" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1d23] p-8 rounded-[2.5rem] border border-gray-800 h-fit">
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-500"/> Peak Rush Hours
              </h3>
              <div className="space-y-3">
                {stats.peakHours.length > 0 ? stats.peakHours.map(([time, count], i) => (
                  <div key={i} className="group flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all">
                    <span className="text-xs font-bold text-gray-400 group-hover:text-blue-400 transition-colors">{time}</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">{count.toLocaleString()}</span>
                      <span className="text-[9px] text-gray-600 uppercase font-bold">Punches</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-gray-600 text-xs">No activity data found.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#1a1d23] rounded-[2.5rem] border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/30">
              <span className="font-bold text-xs uppercase tracking-widest text-gray-500">Log History</span>
              <button onClick={() => setShowDetailList(!showDetailList)} className="text-[10px] font-black uppercase text-blue-500 hover:text-white px-4 py-1.5 rounded-lg bg-blue-500/10 transition-all">
                {showDetailList ? "Hide Table" : "Show Table"}
              </button>
            </div>
            {showDetailList && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900/50 text-[9px] uppercase text-gray-500">
                    <tr>
                      <th className="px-8 py-5">User Profile</th>
                      <th className="px-8 py-5">Punch Details</th>
                      <th className="px-8 py-5">Gate Lane</th>
                      <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {finalTableData.map((log, i) => (
                      <tr key={i} className="hover:bg-blue-500/5 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="font-black text-gray-200 text-sm group-hover:text-white">{log.name || 'N/A'}</div>
                          <div className="text-[10px] text-blue-500 font-mono tracking-tighter">{log.uid}</div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="text-xs text-gray-300 font-bold">{log.time}</div>
                          <div className="text-[9px] text-gray-600 font-bold">{log.date}</div>
                        </td>
                        <td className="px-8 py-4">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                             <MapPin size={10} className="text-gray-600" /> {log['Door Name'] || log.door || 'Gate 1'}
                           </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             log.status === 'Inside' 
                             ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                             : 'bg-red-500/5 border-red-500/20 text-red-500'
                           }`}>
                             {log.status === 'Inside' ? 'Entry' : 'Exit'}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    red: 'text-red-500 bg-red-500/10',
  };
  return (
    <div className="bg-[#1a1d23] p-6 rounded-[2rem] border border-gray-800 hover:border-gray-700 transition-all">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}><Icon size={18} /></div>
      <p className="text-gray-500 text-[9px] uppercase font-black tracking-[0.1em] mb-1">{title}</p>
      <p className="text-2xl font-black">{value.toLocaleString()}</p>
    </div>
  );
};

export default Dashboard;
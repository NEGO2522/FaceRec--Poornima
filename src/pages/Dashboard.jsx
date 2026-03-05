import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, UserCheck, Clock, LogOut, Settings, Search,
  AlertTriangle, Users, BarChart3, Zap, Eye, ArrowLeft, UserMinus
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const Dashboard = ({ csvData = [], onBack }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailList, setShowDetailList] = useState(false);

  // 1. First, filter the raw data based on Search Query ONLY
  const searchFilteredData = useMemo(() => {
    if (!searchQuery.trim()) return csvData;
    
    return csvData.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const idMatch = String(item.uid || "").includes(searchQuery);
      return nameMatch || idMatch;
    });
  }, [csvData, searchQuery]);

  // 2. Calculate Stats based on the SEARCHED data (Personal or Global)
  const processedStats = useMemo(() => {
    const stats = {
      total: searchFilteredData.length,
      inside: searchFilteredData.filter(d => d.status === 'Inside').length,
      outside: searchFilteredData.filter(d => d.status === 'Outside').length,
      late: searchFilteredData.filter(d => d.status === 'Inside' && d.time > '09:15:00').length,
    };

    // Calculate hourly distribution for searched results
    const hourlyMap = {};
    searchFilteredData.forEach(row => {
      const hour = row.time ? row.time.split(':')[0] + ":00" : "00:00";
      if (!hourlyMap[hour]) hourlyMap[hour] = { hour, entries: 0, exits: 0 };
      if (row.status === 'Inside') hourlyMap[hour].entries++;
      else hourlyMap[hour].exits++;
    });

    stats.hourly = Object.values(hourlyMap).sort((a, b) => a.hour.localeCompare(b.hour));
    return stats;
  }, [searchFilteredData]);

  // 3. Final filter for the Table based on Sidebar Tabs
  const finalTableData = useMemo(() => {
    return searchFilteredData.filter(item => {
      if (activeTab === 'Inside') return item.status === 'Inside';
      if (activeTab === 'Outside') return item.status === 'Outside';
      if (activeTab === 'Late') return (item.status === 'Inside' && item.time > '09:15:00');
      return true; // Overview
    }).slice(0, 100); 
  }, [searchFilteredData, activeTab]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex font-sans antialiased overflow-hidden">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#1a1d23] border-r border-gray-800 flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 flex flex-col h-full">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> <span className="text-xs font-bold uppercase">Upload New File</span>
          </button>
          
          <div className="text-blue-400 text-2xl font-bold mb-12 italic" style={{ fontFamily: 'Georgia' }}>
            Poornima
          </div>
          
          <nav className="flex-1 space-y-2">
            {[
              { name: 'Overview', icon: LayoutDashboard, count: processedStats.total },
              { name: 'Inside', icon: UserCheck, count: processedStats.inside },
              { name: 'Outside', icon: UserMinus, count: processedStats.outside },
              { name: 'Late', icon: Clock, count: processedStats.late },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name); setShowDetailList(true); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${activeTab === item.name ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-semibold">{item.name}</span>
                </div>
                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-bold">
                  {item.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <header className="h-20 border-b border-gray-800 flex items-center justify-between px-10 bg-[#0f1115]/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold">{activeTab} Analysis</h1>
            {searchQuery && <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Filtering for: {searchQuery}</p>}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by Name or UID..." 
              className="bg-gray-900/50 border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:border-blue-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="p-10 space-y-8">
          {/* KPI CARDS - These now update based on your search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard title="Total Results" value={processedStats.total} sub={searchQuery ? "User Records" : "Total Logs"} icon={Users} color="blue" />
            <KPICard title="Present (IN)" value={processedStats.inside} sub="Count" icon={UserCheck} color="emerald" />
            <KPICard title="Late Entries" value={processedStats.late} sub="After 9:15" icon={Clock} color="amber" />
            <KPICard title="Left (OUT)" value={processedStats.outside} sub="Count" icon={UserMinus} color="red" />
          </div>

          {/* CHART SECTION */}
          {!showDetailList && (
            <div className="bg-[#1a1d23] p-8 rounded-[2rem] border border-gray-800">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400"/> 
                {searchQuery ? `Activity for ${searchQuery}` : "Campus Activity Timeline"}
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedStats.hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                    <XAxis dataKey="hour" stroke="#4a5568" fontSize={12} />
                    <YAxis stroke="#4a5568" fontSize={12} />
                    <Tooltip contentStyle={{backgroundColor: '#1a1d23', border: '1px solid #334155', borderRadius: '12px'}} />
                    <Area type="monotone" dataKey="entries" name="IN" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                    <Area type="monotone" dataKey="exits" name="OUT" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <button 
                onClick={() => setShowDetailList(true)}
                className="mt-8 w-full py-4 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-2xl font-bold hover:bg-blue-600 hover:text-white transition-all"
              >
                View Log History Table
              </button>
            </div>
          )}

          {/* TABLE SECTION */}
          {showDetailList && (
            <div className="bg-[#1a1d23] rounded-[2rem] border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <span className="font-bold">Displaying {finalTableData.length} records</span>
                <button onClick={() => setShowDetailList(false)} className="text-xs text-gray-500 hover:text-white underline">Back to Chart</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900/50 text-[10px] uppercase text-gray-500">
                    <tr>
                      <th className="px-8 py-4">Student</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Time</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {finalTableData.map((log, i) => (
                      <tr key={i} className="hover:bg-gray-800/20">
                        <td className="px-8 py-4">
                          <div className="font-bold text-gray-200">{log.name || 'N/A'}</div>
                          <div className="text-[10px] text-blue-500 font-mono">{log.uid}</div>
                        </td>
                        <td className="px-8 py-4 text-sm text-gray-400">{log.date}</td>
                        <td className="px-8 py-4 text-sm text-gray-400">{log.time}</td>
                        <td className="px-8 py-4">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                             log.status === 'Inside' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                           }`}>
                             {log.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const KPICard = ({ title, value, sub, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/5',
    emerald: 'text-emerald-500 bg-emerald-500/5',
    amber: 'text-amber-500 bg-amber-500/5',
    red: 'text-red-500 bg-red-500/5',
  };
  return (
    <div className="bg-[#1a1d23] p-6 rounded-[1.5rem] border border-gray-800">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}><Icon size={20} /></div>
      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{title}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
      <p className="text-[10px] text-gray-600 font-medium">{sub}</p>
    </div>
  );
};

export default Dashboard;
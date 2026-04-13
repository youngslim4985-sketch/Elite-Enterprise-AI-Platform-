import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Shield, 
  Cpu, 
  Lock, 
  AlertTriangle, 
  Terminal, 
  BarChart3, 
  Zap, 
  Globe, 
  Server,
  LogOut,
  User,
  Search,
  Bell,
  ChevronRight,
  Database
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { cn } from "./lib/utils";

// Types
interface Event {
  id: string;
  type: "SECURITY" | "METRIC";
  value: number;
  timestamp: string;
  service: string;
}

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [mlPredictions, setMlPredictions] = useState<any[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);

  const runPrediction = async () => {
    setIsPredicting(true);
    try {
      const res = await fetch("/api/ml/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { features: Array.from({ length: 10 }, () => Math.random()) } })
      });
      const data = await res.json();
      setMlPredictions(prev => [data, ...prev].slice(0, 10));
      
      if (data.prediction === "THREAT") {
        // Auto-block simulation
        await fetch("/api/security/block-ip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` })
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  // Initialize Socket.io
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("stream:event", (event: Event) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
    });

    newSocket.on("security:alert", (alert: any) => {
      setAlerts(prev => [alert, ...prev].slice(0, 10));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Chart Data
  const chartData = useMemo(() => {
    return events.slice(0, 20).reverse().map(e => ({
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: e.value,
      type: e.type
    }));
  }, [events]);

  const stats = [
    { label: "System Load", value: "24.8%", icon: Cpu, color: "text-blue-400" },
    { label: "Active Threats", value: alerts.length, icon: Shield, color: "text-red-400" },
    { label: "ML Accuracy", value: "98.2%", icon: Zap, color: "text-emerald-400" },
    { label: "Network Latency", value: "12ms", icon: Globe, color: "text-purple-400" },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-[#E4E4E7] font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="border-r border-white/5 bg-[#0D0D0E] flex flex-col z-20"
      >
        <div className="p-6 flex items-center gap-3 border-bottom border-white/5">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              ELITE PLATFORM
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem icon={BarChart3} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} collapsed={!isSidebarOpen} />
          <NavItem icon={Shield} label="Security SIEM" active={activeTab === "security"} onClick={() => setActiveTab("security")} collapsed={!isSidebarOpen} />
          <NavItem icon={Cpu} label="AI Inference" active={activeTab === "ai"} onClick={() => setActiveTab("ai")} collapsed={!isSidebarOpen} />
          <NavItem icon={Database} label="Event Stream" active={activeTab === "stream"} onClick={() => setActiveTab("stream")} collapsed={!isSidebarOpen} />
          <NavItem icon={Terminal} label="SOAR Automation" active={activeTab === "soar"} onClick={() => setActiveTab("soar")} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer", !isSidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
              JD
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Sr. Engineer</p>
              </div>
            )}
            {isSidebarOpen && <LogOut className="w-4 h-4 text-white/40 hover:text-white" />}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-[#0D0D0E]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-md text-white/60 hover:text-white transition-colors"
            >
              <ChevronRight className={cn("w-5 h-5 transition-transform", isSidebarOpen && "rotate-180")} />
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-widest">
              {activeTab} <span className="text-white/20 mx-2">/</span> <span className="text-white">Live Dashboard</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text" 
                placeholder="Search events..." 
                className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">System Online</span>
            </div>
            <button className="relative p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0D0D0E]" />
              )}
            </button>
          </div>
        </header>

        {/* Dashboard View */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {activeTab === "overview" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#0D0D0E] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <stat.icon className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                      <span className="text-xs text-emerald-500 font-medium mb-1.5">+2.4%</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Main Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Real-time Traffic */}
                  <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-bold tracking-tight">Real-time Event Streaming</h3>
                        <p className="text-sm text-white/40">Live Kafka-decoupled data flow</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-blue-500" />
                          <span className="text-xs text-white/60">Metrics</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-red-500" />
                          <span className="text-xs text-white/60">Security</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="time" 
                            stroke="#ffffff20" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#ffffff20" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(v) => `${v}`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0D0D0E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#E4E4E7' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                            animationDuration={500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Service Health */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400" />
                        Service Latency (ms)
                      </h3>
                      <div className="space-y-4">
                        {["Auth Service", "ML Engine", "Splunk HEC", "Kafka Proxy"].map((s, i) => (
                          <div key={s} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                              <span>{s}</span>
                              <span>{10 + i * 5}ms</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${30 + i * 15}%` }}
                                className="h-full bg-blue-500/50"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        Storage Capacity
                      </h3>
                      <div className="flex items-center justify-center h-24">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              className="text-white/5"
                              strokeDasharray="100, 100"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-purple-500"
                              strokeDasharray="75, 100"
                              strokeWidth="3"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold">75%</span>
                            <span className="text-[8px] uppercase tracking-tighter text-white/40">Used</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Data */}
                <div className="space-y-8">
                  {/* Security Feed */}
                  <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-6 flex flex-col h-[450px]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        Security SIEM
                      </h3>
                      <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      <AnimatePresence initial={false}>
                        {alerts.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-2">
                            <Shield className="w-8 h-8 opacity-20" />
                            <p className="text-xs italic">Monitoring for threats...</p>
                          </div>
                        )}
                        {alerts.map((alert, i) => (
                          <motion.div 
                            key={alert.timestamp + i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{alert.type}</span>
                              <span className="text-[8px] text-white/30">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs text-white/80">Blocked suspicious IP: <code className="bg-red-500/20 px-1 rounded">{alert.ip}</code></p>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] uppercase tracking-widest text-white/40">Action:</span>
                              <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold">SOAR Auto-Blocked</span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <button className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                      View Full SIEM Logs
                    </button>
                  </div>

                  {/* System Logs */}
                  <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-6 flex flex-col h-[300px]">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-white/60" />
                      Event Stream
                    </h3>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-white/40 pr-2 custom-scrollbar">
                      {events.map((e, i) => (
                        <div key={e.id + i} className="flex gap-2">
                          <span className="text-blue-500/50">[{new Date(e.timestamp).toLocaleTimeString()}]</span>
                          <span className={cn(e.type === "SECURITY" ? "text-red-400" : "text-emerald-400")}>
                            {e.service.toUpperCase()}
                          </span>
                          <span className="text-white/20">{">>"}</span>
                          <span className="truncate">Event {e.id} processed with value {e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "ai" && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">AI Inference Engine</h3>
                    <p className="text-sm text-white/40">Real-time threat detection model</p>
                  </div>
                  <button 
                    onClick={runPrediction}
                    disabled={isPredicting}
                    className={cn(
                      "px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs transition-all",
                      isPredicting ? "bg-white/10 text-white/40" : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    )}
                  >
                    {isPredicting ? "Analyzing..." : "Run Inference"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Model Version</p>
                    <p className="text-lg font-mono font-bold">v4.2.0-ELITE</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Avg. Confidence</p>
                    <p className="text-lg font-mono font-bold text-emerald-400">94.8%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Inference Time</p>
                    <p className="text-lg font-mono font-bold text-blue-400">42ms</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Recent Predictions</h4>
                  <div className="space-y-2">
                    {mlPredictions.map((p, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col p-4 bg-white/5 rounded-xl border border-white/5 gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              p.prediction === "THREAT" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                            )}>
                              {p.prediction}
                            </span>
                            <span className="text-xs font-mono text-white/60">Confidence: {(p.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <span className="text-[10px] text-white/20">{new Date(p.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {p.reasoning && <p className="text-xs text-white/40 italic">Reasoning: {p.reasoning}</p>}
                      </motion.div>
                    ))}
                    {mlPredictions.length === 0 && (
                      <div className="py-12 text-center text-white/20 italic text-sm">
                        No inference data yet. Run a prediction to start monitoring.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8">
              <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Splunk Enterprise SIEM</h3>
                    <p className="text-sm text-white/40">Security Information and Event Management</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
                      <Search className="w-4 h-4 text-white/30" />
                      <input 
                        type="text" 
                        placeholder="index=security level=CRITICAL | stats count by ip" 
                        className="bg-transparent border-none focus:outline-none text-xs font-mono w-96"
                      />
                    </div>
                    <button className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold uppercase tracking-widest">Search</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Top Sources</h4>
                      <div className="space-y-3">
                        {["192.168.1.42", "10.0.0.15", "172.16.0.5"].map((ip, i) => (
                          <div key={ip} className="flex items-center justify-between">
                            <span className="text-xs font-mono">{ip}</span>
                            <span className="text-[10px] font-bold text-white/60">{100 - i * 20}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Event Types</h4>
                      <div className="space-y-3">
                        {["LOGIN_FAILURE", "UNAUTHORIZED_ACCESS", "MALWARE_DETECTED"].map((type, i) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-[10px] font-medium">{type}</span>
                            <span className="text-[10px] font-bold text-red-400">{42 - i * 10}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-[10px]">
                          <tr>
                            <th className="p-4 font-bold">Timestamp</th>
                            <th className="p-4 font-bold">Level</th>
                            <th className="p-4 font-bold">Source</th>
                            <th className="p-4 font-bold">Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {events.filter(e => e.type === "SECURITY" || Math.random() > 0.5).map((e, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                              <td className="p-4 text-white/30">{new Date(e.timestamp).toLocaleString()}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-bold",
                                  e.type === "SECURITY" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                                )}>
                                  {e.type === "SECURITY" ? "CRITICAL" : "INFO"}
                                </span>
                              </td>
                              <td className="p-4 text-white/60">{e.service}</td>
                              <td className="p-4 text-white/80">
                                {e.type === "SECURITY" ? `Unauthorized access attempt from 192.168.1.${Math.floor(Math.random() * 255)}` : `Metric update: value=${e.value}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "soar" && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">SOAR Automation</h3>
                    <p className="text-sm text-white/40">Security Orchestration, Automation, and Response</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Auto-Response Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Active Playbooks</h4>
                    <div className="space-y-3">
                      {[
                        { name: "Brute Force Mitigation", status: "ENABLED", color: "text-emerald-400" },
                        { name: "DDoS Auto-Block", status: "ENABLED", color: "text-emerald-400" },
                        { name: "Malware Sandbox", status: "STANDBY", color: "text-blue-400" },
                        { name: "Phishing Triage", status: "ENABLED", color: "text-emerald-400" }
                      ].map(p => (
                        <div key={p.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-xs font-medium">{p.name}</span>
                          <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/5", p.color)}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Blocked IPs</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                      {alerts.filter(a => a.type === "IP_BLOCKED").map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                          <code className="text-xs text-red-400">{a.ip}</code>
                          <span className="text-[8px] text-white/20">{new Date(a.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {alerts.length === 0 && <p className="text-xs text-white/20 italic text-center py-8">No IPs blocked in current session.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stream" && (
            <div className="space-y-8">
              <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Kafka Event Stream</h3>
                    <p className="text-sm text-white/40">Real-time distributed message queue</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Topic:</span>
                      <span className="text-blue-400">ml-requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Partitions:</span>
                      <span className="text-blue-400">12</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                  <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Live Consumer Logs</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  </div>
                  <div className="p-4 font-mono text-xs h-[500px] overflow-y-auto custom-scrollbar space-y-1">
                    {events.map((e, i) => (
                      <div key={e.id + i} className="flex gap-3 group">
                        <span className="text-white/20 shrink-0">{i + 1}</span>
                        <span className="text-blue-500/50 shrink-0">[{new Date(e.timestamp).toISOString()}]</span>
                        <span className="text-purple-400 shrink-0">CONSUMER_01</span>
                        <span className="text-white/10 shrink-0">|</span>
                        <span className="text-emerald-400 shrink-0">topic=ml-requests</span>
                        <span className="text-white/60 truncate">payload={"{"} id: "{e.id}", service: "{e.service}", value: {e.value} {"}"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Styles for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, collapsed }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
        active ? "bg-blue-600/10 text-blue-400" : "text-white/40 hover:text-white hover:bg-white/5",
        collapsed && "justify-center"
      )}
    >
      <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active && "text-blue-500")} />
      {!collapsed && <span className="text-sm font-medium tracking-tight">{label}</span>}
      {active && !collapsed && (
        <motion.div 
          layoutId="active-pill"
          className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
        />
      )}
    </button>
  );
}

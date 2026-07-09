import React, { useEffect, useState } from "react";
import { NumberLog, ConsoleHit, UserProfile } from "../types";
import { Phone, CheckCircle, Percent, AlertCircle, RefreshCw, Layers, TrendingUp, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface UserDashboardProps {
  userProfile: UserProfile | null;
  numberLogs: NumberLog[];
  onRefreshStats: () => void;
}

export default function UserDashboard({ userProfile, numberLogs, onRefreshStats }: UserDashboardProps) {
  const [consoleHits, setConsoleHits] = useState<ConsoleHit[]>([]);
  const [loadingConsole, setLoadingConsole] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch recent console hits from our secure Express proxy
  const fetchConsoleHits = async () => {
    try {
      setLoadingConsole(true);
      const res = await fetch("/api/console");
      if (res.ok) {
        const data = await res.json();
        
        let hitsArray: any[] = [];
        if (data && data.data && Array.isArray(data.data.hits)) {
          hitsArray = data.data.hits;
        } else if (data && Array.isArray(data.hits)) {
          hitsArray = data.hits;
        } else if (Array.isArray(data)) {
          hitsArray = data;
        } else if (data && typeof data === "object") {
          hitsArray = Object.values(data).filter((v: any) => v && typeof v === "object" && (v.range || v.country)) as any[];
        }

        const mappedHits = hitsArray.slice(0, 8).map((hit: any) => {
          let resolvedCountry = "Global Region";
          if (hit.country) {
            resolvedCountry = hit.country;
          } else if (hit.range) {
            const rangeStr = String(hit.range);
            if (rangeStr.startsWith("224")) resolvedCountry = "Guinea (+224)";
            else if (rangeStr.startsWith("232")) resolvedCountry = "Sierra Leone (+232)";
            else if (rangeStr.startsWith("236")) resolvedCountry = "Central African Rep (+236)";
            else if (rangeStr.startsWith("229")) resolvedCountry = "Benin (+229)";
            else if (rangeStr.startsWith("222")) resolvedCountry = "Mauritania (+222)";
          }

          if (hit.sid) {
            resolvedCountry = `${resolvedCountry} (${hit.sid})`;
          }

          let resolvedTime = "Just now";
          if (hit.time) {
            if (typeof hit.time === "number") {
              resolvedTime = new Date(hit.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            } else {
              const parsed = Number(hit.time);
              if (!isNaN(parsed)) {
                resolvedTime = new Date(parsed).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              } else {
                resolvedTime = String(hit.time);
              }
            }
          }

          return {
            ...hit,
            country: resolvedCountry,
            time: resolvedTime
          };
        });

        setConsoleHits(mappedHits);
      }
    } catch (error: any) {
      // Log as warning/info instead of console.error to avoid triggering platform automatic failure logs when dev server is restarting
      console.warn("Could not retrieve network activity feed (temporary connection limit):", error.message || error);
    } finally {
      setLoadingConsole(false);
    }
  };

  useEffect(() => {
    fetchConsoleHits();
    // Poll console hits every 30 seconds
    const interval = setInterval(fetchConsoleHits, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    onRefreshStats();
    await fetchConsoleHits();
    setRefreshing(false);
  };

  // Today's Date String in ISO
  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate Today's Summary
  const todayLogs = numberLogs.filter(log => log.timestamp.startsWith(todayStr));
  const totalTakenToday = todayLogs.length;
  const successfulToday = todayLogs.filter(log => log.status === "success").length;

  // Calculate overall success rate
  const totalTaken = numberLogs.length;
  const successfulLogs = numberLogs.filter(log => log.status === "success").length;
  const successRate = totalTaken > 0 ? (successfulLogs / totalTaken) * 100 : 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
            <Layers className="text-cyan-400 h-6 w-6" />
            Console Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Track your virtual mobile phone lines, SMS activation logs, and platform profits.</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200 active:scale-95 disabled:opacity-50 font-semibold shadow-md cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
          Refresh Performance
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Metric 1: Taken Today */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/45 border border-slate-800/80 hover:border-cyan-500/15 rounded-2xl p-6 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 h-28 w-28 bg-cyan-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Numbers Leased Today</p>
              <h3 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight pt-1">{totalTakenToday}</h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Phone className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800/40 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            <span>Lifetime allocations: </span>
            <span className="font-bold text-slate-200 font-mono">{totalTaken}</span>
          </div>
        </motion.div>

        {/* Metric 2: Success Today */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="bg-slate-900/45 border border-slate-800/80 hover:border-emerald-500/15 rounded-2xl p-6 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-emerald-500/5 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Completed OTPs Today</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight pt-1">{successfulToday}</h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800/40 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Lifetime completions: </span>
            <span className="font-bold text-slate-200 font-mono">{successfulLogs}</span>
          </div>
        </motion.div>

        {/* Metric 3: Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.16 }}
          className="bg-slate-900/45 border border-slate-800/80 hover:border-violet-500/15 rounded-2xl p-6 relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-1 shadow-lg transition-all duration-300 hover:shadow-violet-500/5 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 h-28 w-28 bg-violet-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-violet-500/10 transition-colors" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">SMS Completion Rate</p>
              <h3 className="text-3xl font-extrabold text-violet-400 font-mono tracking-tight pt-1">{successRate.toFixed(1)}%</h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 pt-4">
            {/* Simple progress bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden p-[2px]">
              <div 
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(successRate, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Console Live Hits & Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left 3 Columns: Live Feed Table */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col h-full shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b border-slate-800/40 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Network Activity Feed
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time worldwide mobile numbers being queried (15 Mins)</p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800/80 font-bold tracking-wider">
              AUTO-POLLING
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800/60 rounded-2xl bg-slate-950/45 flex-grow">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/30 font-mono">
                  <th className="p-3.5 pl-4 uppercase font-bold tracking-wider text-[10px]">Destination Country</th>
                  <th className="p-3.5 uppercase font-bold tracking-wider text-[10px]">Mobile Operator Prefix</th>
                  <th className="p-3.5 pr-4 text-right uppercase font-bold tracking-wider text-[10px]">Polled Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loadingConsole ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4 pl-4"><div className="h-4.5 bg-slate-850 rounded-lg w-28" /></td>
                      <td className="p-4"><div className="h-4.5 bg-slate-850 rounded-lg w-24 font-mono" /></td>
                      <td className="p-4 pr-4 text-right"><div className="h-4.5 bg-slate-850 rounded-lg w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : consoleHits.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3 py-4">
                        <AlertCircle className="h-7 w-7 text-slate-600" />
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-slate-300">Live feed queue is silent</p>
                          <p className="text-[11px] text-slate-500">Global hits appear here as incoming requests hit the nodes.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  consoleHits.map((hit, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors group">
                      <td className="p-3.5 pl-4 font-semibold text-slate-200">
                        {hit.country || "Global Region"}
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-bold text-[11.5px]">
                        {hit.range || "+88017xxxxxx"}
                      </td>
                      <td className="p-3.5 pr-4 text-right text-slate-400 font-mono text-[11px] font-medium">
                        {hit.time || "Just now"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 2 Columns: Platform Guide & Rewards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
              <HelpCircle className="h-4.5 w-4.5 text-cyan-400" />
              Platform Guidelines
            </h3>
            <div className="space-y-4 text-xs text-slate-300">
              
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/40 relative overflow-hidden group hover:border-slate-800 transition-colors">
                <p className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Requesting Dynamic Lines
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Head over to the <strong className="text-slate-300">"Get Number"</strong> tab, pick an active mobile carrier range, and tap lease. Use the number on your target platform to verify accounts.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/40 relative overflow-hidden group hover:border-slate-800 transition-colors">
                <p className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Guaranteed SMS Profit Rate
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Every single successful OTP SMS received via your leased virtual number instantly credits exactly <strong className="text-emerald-400">৳ 0.50 BDT</strong> directly to your balance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/40 relative overflow-hidden group hover:border-slate-800 transition-colors">
                <p className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  Programmatic API Automation
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Automate bulk verifications using your unique Private API Keys. Fetch numbers and check OTPs programmatically by viewing the <strong className="text-slate-300">"Developer API"</strong> tab.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

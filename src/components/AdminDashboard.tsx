import React from "react";
import { UserProfile, NumberLog, WithdrawalRequest } from "../types";
import { Users, Banknote, HelpCircle, BadgePercent, CheckSquare, Layers, TrendingUp, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface AdminDashboardProps {
  users: UserProfile[];
  numberLogs: NumberLog[];
  withdrawals: WithdrawalRequest[];
}

export default function AdminDashboard({ users, numberLogs, withdrawals }: AdminDashboardProps) {
  // Stat calculations
  const totalUsersCount = users.length;
  const totalSystemBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalSuccessOtpsCount = numberLogs.filter(log => log.status === "success").length;
  
  const approvedPayoutsSum = withdrawals
    .filter(w => w.status === "approved")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  const pendingPayoutsSum = withdrawals
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Title */}
      <div className="border-b border-slate-800/40 pb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
          <Layers className="text-red-500 h-6 w-6 animate-pulse" />
          Admin Executive Panel
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Check system balances, pending liabilities, registered nodes, and handle platform configuration.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-850 hover:border-red-500/15 rounded-3xl p-6 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-red-500/5 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 h-24 w-24 bg-red-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Total Active Users</p>
              <h3 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight pt-1">{totalUsersCount}</h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Stat 2: Total System Balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900/40 border border-slate-850 hover:border-yellow-500/15 rounded-3xl p-6 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-yellow-500/5 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 h-24 w-24 bg-yellow-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Combined User Balance</p>
              <h3 className="text-3xl font-extrabold text-yellow-400 font-mono tracking-tight pt-1">৳{totalSystemBalance.toFixed(2)}</h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition-transform">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Stat 3: Total Successful OTPs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/40 border border-slate-850 hover:border-emerald-500/15 rounded-3xl p-6 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-emerald-500/5 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Successful OTPs</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight pt-1">{totalSuccessOtpsCount}</h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* Stat 4: Approved Payouts */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/40 border border-slate-850 hover:border-violet-500/15 rounded-3xl p-6 relative overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-violet-500/5 hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">Completed Payouts</p>
              <h3 className="text-3xl font-extrabold text-violet-400 font-mono tracking-tight pt-1">৳{approvedPayoutsSum.toFixed(2)}</h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Under Section: Financial Health Warning or Summary info */}
      <div className="p-5 bg-slate-950/60 border border-slate-850 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-inner">
        <div className="space-y-1">
          <p className="font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Liquidity & Risk Parameters
          </p>
          <p className="text-slate-400">Review total pending liability ratios against cashout volumes.</p>
        </div>
        <div className="flex flex-wrap gap-3.5 w-full md:w-auto">
          <div className="bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-2xl font-mono text-slate-300 flex flex-col gap-0.5 shadow-md flex-grow md:flex-grow-0">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Pending Liability</span>
            <span className="font-bold text-yellow-400 text-sm">৳ {pendingPayoutsSum.toFixed(2)} BDT</span>
          </div>
          <div className="bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-2xl font-mono text-slate-300 flex flex-col gap-0.5 shadow-md flex-grow md:flex-grow-0">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Platform Nodes</span>
            <span className="font-bold text-cyan-400 text-sm">{totalUsersCount} active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

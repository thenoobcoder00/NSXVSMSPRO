import React from "react";
import { UserProfile } from "../types";
import { LogOut, User, Shield, CreditCard } from "lucide-react";
import { auth } from "../firebase";

interface HeaderProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  activePanel: "user" | "admin";
  onTogglePanel: (panel: "user" | "admin") => void;
}

export default function Header({ userProfile, onLogout, activePanel, onTogglePanel }: HeaderProps) {
  if (!userProfile) return null;

  return (
    <header className="bg-slate-950/75 backdrop-blur-md border-b border-slate-800/60 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50">
      {/* Brand Identity */}
      <div className="flex items-center gap-3.5 self-start md:self-auto">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 p-[1px] shadow-lg shadow-cyan-500/10">
          <div className="h-full w-full rounded-xl bg-slate-950 flex items-center justify-center text-cyan-400 font-extrabold text-lg font-display">
            NXV
          </div>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2 font-display">
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              NXVSMS
            </span>
            {userProfile.role === "admin" && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold tracking-wider animate-pulse">
                Admin
              </span>
            )}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Professional dynamic SMS verification platform</p>
        </div>
      </div>

      {/* User Actions & Stats */}
      <div className="flex items-center gap-3.5 flex-wrap justify-end w-full md:w-auto">
        
        {/* Balance Display with Hover Micro-Glow */}
        <div className="bg-slate-900/65 border border-slate-800/80 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-md hover:border-emerald-500/20 hover:shadow-emerald-500/5 transition-all duration-300 group">
          <div className="h-8.5 w-8.5 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-300">
            <CreditCard className="h-4.5 w-4.5" />
          </div>
          <div className="text-left">
            <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider">Account Balance</p>
            <p className="text-sm font-extrabold text-emerald-400 font-mono tracking-wide">
              ৳ {userProfile.balance !== undefined ? userProfile.balance.toFixed(2) : "0.00"} BDT
            </p>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3 bg-slate-900/40 px-3.5 py-2 rounded-2xl border border-slate-800/50">
          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-850 flex items-center justify-center text-slate-300">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-200 leading-none">{userProfile.name}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{userProfile.email}</p>
          </div>
        </div>

        {/* Admin/User Mode Toggle Switch */}
        {userProfile.role === "admin" && (
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => onTogglePanel("user")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activePanel === "user"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 font-extrabold shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              User Console
            </button>
            <button
              onClick={() => onTogglePanel("admin")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activePanel === "admin"
                  ? "bg-red-500 text-white font-extrabold shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Admin Panel
            </button>
          </div>
        )}

        {/* Log Out Action */}
        <button
          onClick={onLogout}
          className="p-2.5 rounded-2xl bg-slate-900/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/20 transition-all duration-300 flex items-center justify-center active:scale-95"
          title="Sign Out"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}

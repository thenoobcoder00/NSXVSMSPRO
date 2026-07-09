import React from "react";
import { Cpu, Send, ShieldCheck, Heart, Terminal, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

export default function DeveloperSupportSection() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans">
      {/* Top Header Row */}
      <div className="border-b border-slate-800/40 pb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
          <Cpu className="text-cyan-400 h-6 w-6 animate-pulse" />
          Developer Support Info
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Get in touch with the core development team for custom integrations, support, and technical updates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 rounded-full blur-3xl -mr-6 -mt-6 pointer-events-none" />
          
          <div className="flex flex-col items-center text-center space-y-4 py-3 border-b border-slate-800/40 pb-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 p-[1px] shadow-lg shadow-cyan-500/10">
              <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center text-cyan-400 font-extrabold text-3xl font-display">
                NV
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-lg tracking-tight">NOOBXVAU</h3>
              <p className="text-xs text-cyan-400 font-semibold font-mono tracking-wider mt-1 uppercase">Lead Software Engineer</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl">
              <MessageSquare className="h-5 w-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold font-mono text-slate-500 tracking-wider">Telegram Channel & Support</p>
                <a 
                  href="https://t.me/noobxvau" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold text-slate-200 hover:text-cyan-400 transition-colors mt-0.5 inline-block font-mono text-xs sm:text-sm"
                >
                  @noobxvau
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold font-mono text-slate-500 tracking-wider">System Authenticity</p>
                <p className="font-semibold text-slate-300 mt-0.5 text-xs">Official Developer Verification Passed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action/Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/30 border border-slate-850/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl -mr-6 -mt-6 pointer-events-none" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-cyan-400" />
              Platform Integrations & Queries
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you require API upgrades, custom payment gateways, special pricing coefficients for specific telecommunication networks, or dedicated virtual numbers, reach out directly over Telegram.
            </p>
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-2 text-[11px] text-slate-400 font-mono leading-normal">
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Response SLA: Within 1-2 hours
              </p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Custom development services
              </p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Secure cryptographic line hosting
              </p>
            </div>
          </div>

          <a
            href="https://t.me/noobxvau"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Send className="h-4 w-4" />
            Contact Developer Telegram
          </a>
        </motion.div>
      </div>

      <div className="text-center text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
        <span>Handcrafted with</span>
        <Heart className="h-3 w-3 text-red-500 fill-red-500" />
        <span>by NOOBXVAU for NXVSMS Platform</span>
      </div>
    </div>
  );
}

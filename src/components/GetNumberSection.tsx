import React, { useState, useEffect, useRef } from "react";
import { NumberLog, UserProfile } from "../types";
import { 
  Phone, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Ban, 
  Sparkles, 
  CheckCircle,
  FileText
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, increment, collection, addDoc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

interface GetNumberSectionProps {
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
  numberLogs: NumberLog[];
  onRefreshLogs: () => void;
}

export default function GetNumberSection({ 
  userProfile, 
  onRefreshProfile, 
  numberLogs, 
  onRefreshLogs 
}: GetNumberSectionProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active requested number state
  const [activeNumber, setActiveNumber] = useState<NumberLog | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins (900 seconds)
  const [otpPolling, setOtpPolling] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [rangeId, setRangeId] = useState<string>("22465XXX");

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, []);

  const stopTimers = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (activeNumber && activeNumber.status === "pending" && timeLeft > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [activeNumber, timeLeft]);

  // Handle number expiration
  const handleExpire = async () => {
    if (!activeNumber) return;
    stopTimers();
    setOtpPolling(false);

    try {
      if (activeNumber.id) {
        const logDocRef = doc(db, "number_logs", activeNumber.id);
        await updateDoc(logDocRef, { status: "expired" });
      }
      setActiveNumber((prev) => prev ? { ...prev, status: "expired" } : null);
      onRefreshLogs();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, activeNumber.id ? `number_logs/${activeNumber.id}` : "number_logs");
    }
  };

  // Handle successful OTP validation
  const handleOtpSuccess = async (otpCode: string, docId: string) => {
    stopTimers();
    setOtpPolling(false);
    setReceivedOtp(otpCode);

    try {
      // 1. Fetch current reward rate from global settings or default to 0.50
      const settingsRef = doc(db, "settings", "global");
      let settingsSnap;
      try {
        settingsSnap = await getDoc(settingsRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "settings/global");
        return;
      }
      let rewardRate = 0.50; // default 0.50 BDT
      if (settingsSnap.exists()) {
        rewardRate = Number(settingsSnap.data().reward_rate) || 0.50;
      }

      // 2. Update log doc in Firestore to 'success' and save OTP
      if (docId) {
        const logDocRef = doc(db, "number_logs", docId);
        try {
          await updateDoc(logDocRef, { 
            status: "success", 
            otp: otpCode,
            otpTimestamp: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `number_logs/${docId}`);
        }
      }

      // 3. Reward user's Firestore balance
      if (userProfile) {
        const userRef = doc(db, "users", userProfile.uid);
        try {
          await updateDoc(userRef, {
            balance: increment(rewardRate)
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
        }
      }

      // Update local state to success
      setActiveNumber((prev) => prev ? { ...prev, status: "success", otp: otpCode } : null);

      // Trigger refreshes
      onRefreshProfile();
      onRefreshLogs();
    } catch (err) {
      console.error("Error processing successful OTP:", err);
    }
  };

  // Poll for OTP
  const startOtpPolling = (sessionLogId: string, docId: string, phoneNumber: string) => {
    setOtpPolling(true);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/success-otp?id=${sessionLogId}&number=${encodeURIComponent(phoneNumber)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.otp) {
            handleOtpSuccess(data.otp, docId);
          }
        }
      } catch (err) {
        console.error("Error polling for OTP:", err);
      }
    }, 5000); // Poll every 5 seconds
  };

  // Request Number
  const handleGetNumber = async () => {
    if (!userProfile) return;
    if (userProfile.isBlocked) {
      setError("Your account is blocked. You cannot fetch new virtual numbers.");
      return;
    }

    setLoading(true);
    setError(null);
    setReceivedOtp(null);
    stopTimers();

    try {
      const targetRange = rangeId === "custom" ? "22465XXX" : rangeId;
      const res = await fetch(`/api/getnum?rid=${targetRange || "22465XXX"}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details?.message || errorData.message || "No virtual number available at the moment. Try again.");
      }
      const data = await res.json();

      if (data && (data.number || data.phone)) {
        const phoneNum = data.number || data.phone;
        const country = data.country || "Bangladesh";
        const sessionLogId = data.id || `session-${Date.now()}`;

        // Create log document in Firestore
        const newLog = {
          logId: sessionLogId,
          uid: userProfile.uid,
          number: phoneNum,
          country: country,
          status: "pending" as const,
          otp: "",
          timestamp: new Date().toISOString()
        };

        let docRef;
        try {
          docRef = await addDoc(collection(db, "number_logs"), newLog);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "number_logs");
          return;
        }

        // Store active number state
        const activeLog: NumberLog & { id?: string } = {
          ...newLog,
          id: docRef.id // Save firestore document key to easily update later
        };

        setActiveNumber(activeLog);
        setTimeLeft(900); // 15 mins
        onRefreshLogs();

        // Start polling OTP
        startOtpPolling(sessionLogId, docRef.id, phoneNum);
      } else {
        throw new Error(data.message || "No virtual number available at the moment. Try again.");
      }
    } catch (err: any) {
      console.error("Get Number Error:", err);
      setError(err.message || "Failed to fetch number from third party API.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel Number Request manually
  const handleCancelRequest = async () => {
    if (!activeNumber) return;
    stopTimers();
    setOtpPolling(false);
    try {
      if (activeNumber.id) {
        const logDocRef = doc(db, "number_logs", activeNumber.id);
        await updateDoc(logDocRef, { status: "expired" });
      }
      setActiveNumber(null);
      onRefreshLogs();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, activeNumber.id ? `number_logs/${activeNumber.id}` : "number_logs");
    }
  };

  // Format Time Remaining (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Request and Active Number Panel (Left 3 Columns) */}
      <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col h-full space-y-6 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
            <Phone className="text-cyan-400 h-5.5 w-5.5" />
            Lease Virtual Line
          </h2>
          <p className="text-xs text-slate-400 mt-1">Acquire real-time temporary phone lines. The system will automatically check for SMS OTP verify codes.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed"
          >
            <AlertTriangle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Action Controller */}
        {!activeNumber ? (
          <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 border border-dashed border-slate-800/85 rounded-2xl bg-slate-950/20 space-y-6">
            <div className="h-14 w-14 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <Phone className="h-6 w-6 animate-pulse" />
            </div>
            
            <div className="text-center max-w-sm space-y-1.5">
              <p className="text-sm font-bold text-slate-200">Select Carrier Route & Range ID</p>
              <p className="text-xs text-slate-500 leading-relaxed">Leased lines are dedicated and valid for 15 minutes to receive verification SMS.</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <div>
                <label className="block text-slate-500 font-mono text-[9px] uppercase tracking-widest mb-1.5 font-bold">
                  Active Operators
                </label>
                <select
                  value={rangeId}
                  onChange={(e) => setRangeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/80 transition-colors font-medium shadow-inner"
                >
                  <option value="22465XXX">Guinea Route: 22465XXX (Highly Active)</option>
                  <option value="23274XXX">Sierra Leone Route: 23274XXX</option>
                  <option value="996225XXX">Kyrgyzstan Route: 996225XXX</option>
                  <option value="26134XXX">Madagascar Route: 26134XXX</option>
                  <option value="23272XXX">Sierra Leone Route: 23272XXX</option>
                  <option value="2290193XXX">Benin Route: 2290193XXX</option>
                  <option value="custom">-- Custom Range Entry --</option>
                </select>
              </div>

              {rangeId === "custom" || !["22465XXX", "23274XXX", "996225XXX", "26134XXX", "23272XXX", "2290193XXX"].includes(rangeId) ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5"
                >
                  <label className="block text-slate-500 font-mono text-[9px] uppercase tracking-widest mb-1.5 font-bold">
                    Custom Range / Route ID
                  </label>
                  <input
                    type="text"
                    value={rangeId === "custom" ? "" : rangeId}
                    onChange={(e) => setRangeId(e.target.value)}
                    placeholder="e.g. 22465XXX"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </motion.div>
              ) : null}
            </div>

            <button
              onClick={handleGetNumber}
              disabled={loading}
              className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 active:scale-98 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  Generating secure line...
                </>
              ) : (
                <>
                  <Play className="h-4.5 w-4.5 fill-current" />
                  Lease Temporary Line
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex-grow space-y-6">
            {/* Active Number Information Card */}
            <div className="bg-slate-950/65 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 relative overflow-hidden shadow-inner">
              {activeNumber.status === "success" && (
                <div className="absolute top-0 right-0 h-36 w-36 bg-emerald-500/5 rounded-full blur-3xl -mr-6 -mt-6" />
              )}
              {activeNumber.status === "pending" && (
                <div className="absolute top-0 right-0 h-36 w-36 bg-cyan-500/5 rounded-full blur-3xl -mr-6 -mt-6" />
              )}

              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className={`inline-flex text-[9px] uppercase font-bold font-mono px-3 py-1 rounded-full ${
                    activeNumber.status === "pending" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25" :
                    activeNumber.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse" :
                    "bg-slate-800 text-slate-400 border border-slate-700/80"
                  }`}>
                    {activeNumber.status === "pending" ? "Awaiting SMS..." : activeNumber.status.toUpperCase()}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">Lease Country: <span className="text-slate-200 font-bold">{activeNumber.country}</span></p>
                </div>
                {activeNumber.status === "pending" && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                    <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                )}
              </div>

              {/* Huge Number Display Card */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider">Leased Line Number</p>
                  <p className="text-lg sm:text-2xl font-extrabold text-slate-100 font-mono tracking-wide mt-1 select-all">{activeNumber.number}</p>
                </div>
                <button
                  onClick={() => handleCopy(activeNumber.number)}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-850 rounded-xl transition-all active:scale-95 cursor-pointer"
                  title="Copy Number"
                >
                  {copied ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
                </button>
              </div>

              {/* Dynamic OTP Box */}
              <AnimatePresence mode="wait">
                {activeNumber.status === "pending" ? (
                  <motion.div 
                    key="polling"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl text-center flex flex-col items-center justify-center space-y-3.5 py-8 relative overflow-hidden"
                  >
                    {/* Glowing active scanning scanner effect */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_2s_infinite] shadow-[0_0_10px_#22d3ee]" />
                    <RefreshCw className="h-7 w-7 text-cyan-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs text-slate-200 font-bold">Secure OTP Scanner Active</p>
                      <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-normal">
                        Our cloud gateway is querying server logs every 5 seconds for incoming SMS codes. Leave this window open.
                      </p>
                    </div>
                  </motion.div>
                ) : activeNumber.status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 py-8 shadow-md"
                  >
                    <div className="h-12 w-12 rounded-full bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold font-mono text-emerald-400 tracking-widest font-extrabold">SMS VERIFICATION CODE RECEIVED</p>
                      <h4 className="text-4xl sm:text-5xl font-black text-slate-100 font-mono tracking-widest mt-2 select-all drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        {activeNumber.otp}
                      </h4>
                      <p className="text-xs text-emerald-400 font-semibold font-mono mt-3.5 flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        ৳ 0.50 BDT balance credited!
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4.5 bg-slate-900/40 border border-slate-850 rounded-2xl text-center text-slate-500 text-xs">
                    This temporary lease has expired or was discarded.
                  </div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2.5">
                {activeNumber.status === "pending" && (
                  <button
                    onClick={handleCancelRequest}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-850 hover:border-slate-750 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Discard Lease
                  </button>
                )}
                {activeNumber.status !== "pending" && (
                  <button
                    onClick={() => setActiveNumber(null)}
                    className="px-5 py-2.5 bg-cyan-500 text-slate-950 font-extrabold rounded-xl text-xs hover:bg-cyan-400 transition-colors shadow shadow-cyan-500/10 cursor-pointer"
                  >
                    Lease New Number
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Number Requests History Table (Right 2 Columns) */}
      <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 flex flex-col h-full shadow-lg">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
            <FileText className="h-4.5 w-4.5 text-cyan-400" />
            Lease History Logs
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Historical verification records of your lines</p>
        </div>

        <div className="overflow-x-auto border border-slate-800/60 rounded-2xl bg-slate-950/45 flex-grow max-h-[390px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/40 font-mono">
                <th className="p-3 uppercase font-bold tracking-wider text-[10px] pl-4">Phone Number</th>
                <th className="p-3 uppercase font-bold tracking-wider text-[10px]">OTP</th>
                <th className="p-3 text-right uppercase font-bold tracking-wider text-[10px] pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {numberLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-slate-500">
                    No numbers requested in this account yet.
                  </td>
                </tr>
              ) : (
                numberLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-3 pl-4">
                      <p className="font-semibold text-slate-200">{log.number}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.country}</p>
                    </td>
                    <td className="p-3 font-mono text-slate-200 font-bold">
                      {log.otp ? (
                        <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.15)] bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-bold select-all">{log.otp}</span>
                      ) : (
                        <span className="text-slate-600 font-normal">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right pr-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                        log.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        log.status === "pending" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

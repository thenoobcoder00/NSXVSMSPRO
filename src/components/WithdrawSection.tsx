import React, { useState } from "react";
import { WithdrawalRequest, UserProfile } from "../types";
import { 
  CreditCard, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  FileText,
  DollarSign
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

interface WithdrawSectionProps {
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
  withdrawalRequests: WithdrawalRequest[];
  onRefreshWithdrawals: () => void;
}

type PaymentMethod = "Bkash" | "Nagad" | "Rocket" | "Binance";

export default function WithdrawSection({
  userProfile,
  onRefreshProfile,
  withdrawalRequests,
  onRefreshWithdrawals
}: WithdrawSectionProps) {
  const [method, setMethod] = useState<PaymentMethod>("Binance");
  const [accountNo, setAccountNo] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userProfile) return;
    if (userProfile.isBlocked) {
      setError("Your account is blocked. You cannot place withdrawal requests.");
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 100) {
      setError("Minimum withdrawal amount is ৳ 100.00 BDT.");
      return;
    }
    if (withdrawAmount > 50000) {
      setError("Maximum single withdrawal limit is ৳ 50,000.00 BDT.");
      return;
    }

    if (userProfile.balance < withdrawAmount) {
      setError(`Insufficient balance. Your current balance is ৳ ${userProfile.balance.toFixed(2)} BDT.`);
      return;
    }

    if (!accountNo.trim()) {
      setError("Please provide a valid Binance Pay ID, Binance Email, or USDT Address.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Deduct balance in user profile Firestore document first
      const userDocRef = doc(db, "users", userProfile.uid);
      try {
        await updateDoc(userDocRef, {
          balance: increment(-withdrawAmount)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
        return;
      }

      // 2. Add withdrawal request record in Firestore
      const newRequest = {
        uid: userProfile.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        method: method,
        accountNo: accountNo.trim(),
        amount: withdrawAmount,
        status: "pending" as const,
        timestamp: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, "withdrawals"), newRequest);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "withdrawals");
        return;
      }

      setSuccess(`Your withdrawal of ৳ ${withdrawAmount.toFixed(2)} BDT has been successfully requested!`);
      setAccountNo("");
      setAmount("");
      
      // Refresh context
      onRefreshProfile();
      onRefreshWithdrawals();
    } catch (err: any) {
      console.error("Error creating withdrawal request:", err);
      setError(err.message || "Failed to submit withdrawal. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Placement Section (Left 3 Columns) */}
      <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col h-full space-y-6 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
            <CreditCard className="text-cyan-400 h-5.5 w-5.5" />
            Binance Payout Withdrawal
          </h2>
          <p className="text-xs text-slate-400 mt-1">Cashout your earned credits instantly to your Binance account.</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <AlertTriangle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed"
            >
              <CheckCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmitWithdrawal} className="space-y-6 flex-grow">
          {/* Method Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
              Select Cashout Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Binance Button */}
              <button
                type="button"
                onClick={() => setMethod("Binance")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all duration-300 cursor-pointer ${
                  method === "Binance"
                    ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5 scale-[1.01]"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-450"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                  method === "Binance" ? "bg-amber-500/20 text-amber-400" : "bg-slate-900 text-slate-400"
                }`}>
                  B
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-100">Binance</p>
                  <p className="text-[9px] text-slate-500 font-normal mt-0.5">Pay ID / USDT</p>
                </div>
              </button>

              {/* Bkash Button */}
              <button
                type="button"
                onClick={() => setMethod("Bkash")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all duration-300 cursor-pointer ${
                  method === "Bkash"
                    ? "bg-pink-500/10 border-pink-500 text-pink-400 shadow-md shadow-pink-500/5 scale-[1.01]"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-450"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                  method === "Bkash" ? "bg-pink-500/20 text-pink-400" : "bg-slate-900 text-slate-400"
                }`}>
                  bK
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-100">bKash</p>
                  <p className="text-[9px] text-slate-500 font-normal mt-0.5">Mobile Wallet</p>
                </div>
              </button>

              {/* Nagad Button */}
              <button
                type="button"
                onClick={() => setMethod("Nagad")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all duration-300 cursor-pointer ${
                  method === "Nagad"
                    ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5 scale-[1.01]"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-450"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                  method === "Nagad" ? "bg-orange-500/20 text-orange-400" : "bg-slate-900 text-slate-400"
                }`}>
                  N
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-100">Nagad</p>
                  <p className="text-[9px] text-slate-500 font-normal mt-0.5">Mobile Wallet</p>
                </div>
              </button>

              {/* Rocket Button */}
              <button
                type="button"
                onClick={() => setMethod("Rocket")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all duration-300 cursor-pointer ${
                  method === "Rocket"
                    ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/5 scale-[1.01]"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-450"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                  method === "Rocket" ? "bg-purple-500/20 text-purple-400" : "bg-slate-900 text-slate-400"
                }`}>
                  R
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-100">Rocket</p>
                  <p className="text-[9px] text-slate-500 font-normal mt-0.5">Mobile Wallet</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Mobile No */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
                {method === "Binance" 
                  ? "Binance Pay ID / Email / USDT Address" 
                  : `${method} Personal/Agent Mobile No`}
              </label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder={method === "Binance" 
                  ? "e.g. 238190382 or pay@binance.com" 
                  : "e.g. 017XXXXXXXX"}
                required
                className="w-full bg-slate-950/70 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                {method === "Binance" 
                  ? "Provide your active Binance Pay ID, registered Email, or USDT (TRC20/BEP20) wallet address."
                  : `Provide your active 11-digit ${method} mobile account number.`}
              </p>
            </div>

            {/* Withdrawal Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
                Cashout Amount (BDT)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-xs">
                  ৳
                </span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  required
                  className="w-full bg-slate-950/70 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-2xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">Limits: Min 100 BDT - Max 50,000 BDT per request.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-cyan-500/15 transition-all duration-300 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                Processing request...
              </>
            ) : (
              <>
                <Send className="h-4.5 w-4.5" />
                Submit Cashout Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* History logs (Right 2 Columns) */}
      <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 flex flex-col h-full shadow-lg">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
            <FileText className="h-4.5 w-4.5 text-cyan-400" />
            Cashout History Logs
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Historical cashout logs of your payouts</p>
        </div>

        <div className="overflow-x-auto border border-slate-800/60 rounded-2xl bg-slate-950/45 flex-grow max-h-[390px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/40 font-mono">
                <th className="p-3 uppercase font-bold tracking-wider text-[10px] pl-4">Method & Account</th>
                <th className="p-3 uppercase font-bold tracking-wider text-[10px]">Amount</th>
                <th className="p-3 text-right uppercase font-bold tracking-wider text-[10px] pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {withdrawalRequests.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-slate-500">
                    No cashouts requested in this account yet.
                  </td>
                </tr>
              ) : (
                withdrawalRequests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-3 pl-4">
                      <p className="font-semibold text-slate-200">{req.method}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{req.accountNo}</p>
                    </td>
                    <td className="p-3 font-mono text-slate-200 font-bold text-[12.5px]">
                      ৳ {req.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right pr-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                        req.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        req.status === "pending" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {req.status}
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

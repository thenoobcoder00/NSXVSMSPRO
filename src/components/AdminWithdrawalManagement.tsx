import React from "react";
import { WithdrawalRequest } from "../types";
import { CreditCard, Check, X, Clock, AlertTriangle, FileText, CheckSquare } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

interface AdminWithdrawalManagementProps {
  withdrawals: WithdrawalRequest[];
  onRefreshWithdrawals: () => void;
}

export default function AdminWithdrawalManagement({
  withdrawals,
  onRefreshWithdrawals
}: AdminWithdrawalManagementProps) {
  
  const handleApprove = async (request: WithdrawalRequest) => {
    if (request.status !== "pending") return;

    try {
      // Find the specific withdrawal doc and set status to approved
      // We will look up the specific document in firestore and update it
      const withdrawRef = doc(db, "withdrawals", request.id);
      try {
        await updateDoc(withdrawRef, {
          status: "approved"
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${request.id}`);
        return;
      }
      onRefreshWithdrawals();
    } catch (err) {
      console.error("Failed to approve request:", err);
    }
  };

  const handleReject = async (request: WithdrawalRequest) => {
    if (request.status !== "pending") return;

    try {
      // 1. Set withdrawal request status to rejected
      const withdrawRef = doc(db, "withdrawals", request.id);
      try {
        await updateDoc(withdrawRef, {
          status: "rejected"
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${request.id}`);
        return;
      }

      // 2. Refund user's balance
      const userRef = doc(db, "users", request.uid);
      try {
        await updateDoc(userRef, {
          balance: increment(request.amount)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${request.uid}`);
        return;
      }

      onRefreshWithdrawals();
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  // Sort withdrawals: pending first, then newest
  const sortedWithdrawals = [...withdrawals].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div className="border-b border-slate-800/40 pb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
          <CreditCard className="text-red-500 h-6 w-6" />
          Withdrawal Requests Management ({withdrawals.filter(w => w.status === "pending").length} Pending)
        </h2>
        <p className="text-xs text-slate-400 mt-1">Audit payout queues. Approve or reject requests with automatic refund triggers.</p>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-850 rounded-3xl bg-slate-900/20 shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-850 text-slate-400 bg-slate-900/60 font-mono">
              <th className="p-4 pl-5">User Account</th>
              <th className="p-4">Method & Wallet Account</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Submission Date</th>
              <th className="p-4 pr-5 text-right">Actions / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/55">
            {sortedWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                  No withdrawal requests found in database.
                </td>
              </tr>
            ) : (
              sortedWithdrawals.map((req) => (
                <tr key={req.id} className="hover:bg-slate-900/30 transition-colors">
                  {/* User Email/Name */}
                  <td className="p-4 pl-5">
                    <p className="font-bold text-slate-200">{req.userName || "Username"}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{req.userEmail || req.uid}</p>
                  </td>

                  {/* Method & Phone */}
                  <td className="p-4 font-semibold text-slate-300">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      req.method === "Bkash" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      req.method === "Nagad" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                      req.method === "Binance" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                    }`}>
                      {req.method}
                    </span>
                    <p className="text-[10.5px] text-slate-400 font-mono mt-1">{req.accountNo}</p>
                  </td>

                  {/* Amount */}
                  <td className="p-4 font-mono text-slate-100 font-bold text-sm">
                    ৳{req.amount.toFixed(2)}
                  </td>

                  {/* Submission date */}
                  <td className="p-4 font-mono text-slate-500 text-[10px]">
                    {new Date(req.timestamp).toLocaleString()}
                  </td>

                  {/* Actions & Status */}
                  <td className="p-4 pr-5 text-right">
                    {req.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-[11px] shadow hover:shadow-emerald-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-red-500/10 text-red-400 border border-slate-800 hover:border-red-500/20 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        req.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {req.status === "approved" && <CheckSquare className="h-3.5 w-3.5" />}
                        {req.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

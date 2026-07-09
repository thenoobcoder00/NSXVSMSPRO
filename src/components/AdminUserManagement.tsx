import React, { useState } from "react";
import { UserProfile } from "../types";
import { Users, Search, Edit2, Ban, ShieldAlert, Check, X, ShieldCheck } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

interface AdminUserManagementProps {
  users: UserProfile[];
  onRefreshUsers: () => void;
}

export default function AdminUserManagement({ users, onRefreshUsers }: AdminUserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const handleBlockToggle = async (userId: string, currentBlocked: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      try {
        await updateDoc(userRef, {
          isBlocked: !currentBlocked
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        return;
      }
      onRefreshUsers();
    } catch (err) {
      console.error("Failed to toggle blocked status:", err);
    }
  };

  const handleEditBalanceClick = (user: UserProfile) => {
    setEditingUserId(user.uid);
    setEditBalanceValue(user.balance.toString());
  };

  const handleSaveBalance = async (userId: string) => {
    const newBalance = parseFloat(editBalanceValue);
    if (isNaN(newBalance) || newBalance < 0) {
      alert("Please enter a valid balance.");
      return;
    }

    setSubmittingEdit(true);
    try {
      const userRef = doc(db, "users", userId);
      try {
        await updateDoc(userRef, {
          balance: newBalance
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        return;
      }
      setEditingUserId(null);
      onRefreshUsers();
    } catch (err) {
      console.error("Failed to save new balance:", err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
            <Users className="text-red-500 h-6 w-6" />
            Node User Database ({filteredUsers.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit active profiles, modify ledger credits, and suspend/unblock accounts.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, UID..."
            className="w-full bg-slate-900 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto border border-slate-850 rounded-3xl bg-slate-900/20 shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-850 text-slate-400 bg-slate-900/60 font-mono">
              <th className="p-4 pl-5">User Details</th>
              <th className="p-4">User UID</th>
              <th className="p-4">Balance (BDT)</th>
              <th className="p-4">Role</th>
              <th className="p-4 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/55">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                  No users matched your query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className={`hover:bg-slate-900/30 transition-colors ${user.isBlocked ? "bg-red-950/10" : ""}`}>
                  {/* Details */}
                  <td className="p-4 pl-5">
                    <p className="font-bold text-slate-200 flex items-center gap-2">
                      {user.name}
                      {user.isBlocked && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 tracking-wider">
                          SUSPENDED
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</p>
                  </td>

                  {/* UID */}
                  <td className="p-4 font-mono text-[10px] text-slate-400 select-all max-w-[120px] truncate">
                    {user.uid}
                  </td>

                  {/* Balance Editing */}
                  <td className="p-4 font-mono text-slate-200">
                    {editingUserId === user.uid ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-xs font-bold">৳</span>
                        <input
                          type="number"
                          step="any"
                          value={editBalanceValue}
                          onChange={(e) => setEditBalanceValue(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono w-24 focus:outline-none focus:border-red-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveBalance(user.uid)}
                          disabled={submittingEdit}
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          title="Save balance"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[12.5px] text-slate-200">৳{user.balance.toFixed(2)}</span>
                        <button
                          onClick={() => handleEditBalanceClick(user)}
                          className="p-1.5 text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800 rounded-lg transition-all cursor-pointer"
                          title="Modify balance ledger"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Role */}
                  <td className="p-4 font-mono">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      user.role === "admin" 
                        ? "bg-red-500/10 text-red-400 border border-red-500/25" 
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
                    }`}>
                      {user.role}
                    </span>
                  </td>

                  {/* Actions (Block/Unblock) */}
                  <td className="p-4 pr-5 text-right">
                    <button
                      onClick={() => handleBlockToggle(user.uid, !!user.isBlocked)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                        user.isBlocked
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                      }`}
                    >
                      {user.isBlocked ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Restore Access
                        </>
                      ) : (
                        <>
                          <Ban className="h-3.5 w-3.5" />
                          Suspend Node
                        </>
                      )}
                    </button>
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

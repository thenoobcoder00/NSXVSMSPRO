import React, { useState, useEffect } from "react";
import { GlobalSettings } from "../types";
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AdminSettingsProps {
  onSettingsUpdated?: () => void;
}

export default function AdminSettings({ onSettingsUpdated }: AdminSettingsProps) {
  const [baseUrl, setBaseUrl] = useState("https://api.2oo9.cloud/MXS47FLFX0U/tnevs/@public/api");
  const [apiKey, setApiKey] = useState("M9LGX0CVL2M");
  const [rewardRate, setRewardRate] = useState("0.50");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current global settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "settings/global");
          return;
        }
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.base_api_url) setBaseUrl(data.base_api_url);
          if (data.api_key) setApiKey(data.api_key);
          if (data.reward_rate !== undefined) setRewardRate(data.reward_rate.toString());
        } else {
          // If settings don't exist yet, seed them
          try {
            await setDoc(docRef, {
              base_api_url: baseUrl,
              api_key: apiKey,
              reward_rate: parseFloat(rewardRate)
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, "settings/global");
            return;
          }
        }
      } catch (err: any) {
        console.error("Error loading settings:", err);
        setError("Failed to load global settings from Firestore.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedRate = parseFloat(rewardRate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      setError("Please specify a valid numeric profit/reward rate.");
      return;
    }

    if (!baseUrl.trim() || !apiKey.trim()) {
      setError("Third-party API base URL and key cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      const docRef = doc(db, "settings", "global");
      try {
        await setDoc(docRef, {
          base_api_url: baseUrl.trim(),
          api_key: apiKey.trim(),
          reward_rate: parsedRate
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "settings/global");
        return;
      }

      setSuccess("Global system settings updated successfully!");
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 space-x-2.5 text-slate-400 font-mono text-xs">
        <RefreshCw className="h-4.5 w-4.5 animate-spin text-red-500" />
        <span>Syncing global cloud parameters...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-slate-900/40 border border-slate-850 rounded-3xl p-5 sm:p-7 space-y-6 shadow-lg">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
          <Settings className="text-red-500 h-5.5 w-5.5 animate-spin-slow" />
          Global Platform Config
        </h2>
        <p className="text-xs text-slate-400 mt-1">Configure backend gateway URLs, third-party provider tokens, and virtual phone line success profit rates dynamically.</p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed">
          <AlertTriangle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed">
          <CheckCircle2 className="h-4.5 w-4.5 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Profit Rate */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
            Profit / Reward Rate per Successful OTP (BDT)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-xs">
              ৳
            </span>
            <input
              type="number"
              step="any"
              value={rewardRate}
              onChange={(e) => setRewardRate(e.target.value)}
              placeholder="0.50"
              required
              className="w-full bg-slate-950/70 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:border-red-500 transition-colors font-mono"
            />
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            The reward credited automatically to users when they successfully verify an SMS OTP. Default is 0.50 BDT (50 Poisha).
          </p>
        </div>

        {/* Base API URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
            Third-Party API Base URL
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.2oo9.cloud/..."
            required
            className="w-full bg-slate-950/70 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-500 transition-colors font-mono"
          />
          <p className="text-[10px] text-slate-500 leading-normal">The gateway supplier endpoint to fetch virtual mobile numbers.</p>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
            Third-Party API Secret Key
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Secret Key"
            required
            className="w-full bg-slate-950/70 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-500 transition-colors font-mono"
          />
          <p className="text-[10px] text-slate-500 leading-normal">Secret credentials passed along to supplier endpoints inside backend proxies.</p>
        </div>

        {/* Actions */}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-red-500/10 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
              Saving parameters...
            </>
          ) : (
            <>
              <Save className="h-4.5 w-4.5" />
              Save Settings Updates
            </>
          )}
        </button>
      </form>
    </div>
  );
}

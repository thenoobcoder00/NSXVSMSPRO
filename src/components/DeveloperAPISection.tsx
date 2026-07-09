import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  Terminal, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Code2, 
  RefreshCw, 
  Cpu,
  KeyRound,
  BookOpen,
  Play,
  ArrowRight
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "motion/react";

interface DeveloperAPISectionProps {
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

export default function DeveloperAPISection({ userProfile, onRefreshProfile }: DeveloperAPISectionProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl1, setCopiedUrl1] = useState(false);
  const [copiedUrl2, setCopiedUrl2] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedNode, setCopiedNode] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<"python" | "node">("python");

  const apiToken = userProfile?.apiKey || "vnhub_not_configured_yet";

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateRandomKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "vnhub_";
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleRecreateKey = async () => {
    if (!userProfile) return;
    if (!window.confirm("Warning: Recreating your Private API Token will instantly invalidate all existing scripts and automations. Do you want to proceed?")) {
      return;
    }

    setGenerating(true);
    try {
      const newKey = generateRandomKey();
      const userRef = doc(db, "users", userProfile.uid);
      try {
        await updateDoc(userRef, {
          apiKey: newKey
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
        return;
      }
      onRefreshProfile();
    } catch (err) {
      console.error("Failed to update API key:", err);
    } finally {
      setGenerating(false);
    }
  };

  const sampleGetNumUrl = `${window.location.origin}/api/getnum?token=${apiToken}&rid=22465XXX`;
  const sampleOtpUrl = `${window.location.origin}/api/success-otp?token=${apiToken}&id=SESSION_ID_HERE`;

  const pythonSnippet = `import requests
import time

# ১. কনফিগারেশন
API_TOKEN = "${apiToken}"
BASE_URL = "${window.location.origin}"

def get_virtual_number(route_id):
    # ধাপ ১: ভার্চুয়াল নম্বর লীজ বা সংগ্রহ করা
    url = f"{BASE_URL}/api/getnum?token={API_TOKEN}&rid={route_id}"
    response = requests.get(url)
    data = response.json()
    if data.get("status") == "success":
        print(f"✓ Number Leased: {data['phone']}")
        print(f"✓ Session ID: {data['id']}")
        return data["id"]
    else:
        print(f"✗ Failed to lease: {data.get('message', 'Unknown Error')}")
        return None

def poll_for_otp(session_id):
    # ধাপ ২: ওটিপি কোডের জন্য ৫ সেকেন্ড পর পর রিকোয়েস্ট করা
    url = f"{BASE_URL}/api/success-otp?token={API_TOKEN}&id={session_id}"
    print("⏳ Waiting for OTP...")
    while True:
        response = requests.get(url)
        data = response.json()
        if data.get("status") == "success":
            print(f"🎉 Received OTP Code: {data['otp']}")
            return data["otp"]
        time.sleep(5)

# ব্যবহার উদাহরণ (রুটের আইডি দিন)
session_id = get_virtual_number("22465XXX")
if session_id:
    otp_code = poll_for_otp(session_id)
`;

  const nodeSnippet = `const axios = require('axios');

// ১. কনফিগারেশন
const API_TOKEN = "${apiToken}";
const BASE_URL = "${window.location.origin}";

async function executeSMSRetrieval(routeId) {
  try {
    // ধাপ ১: ভার্চুয়াল নম্বর লীজ নেওয়া
    const getNumResponse = await axios.get(\`\${BASE_URL}/api/getnum?token=\${API_TOKEN}&rid=\${routeId}\`);
    const numData = getNumResponse.data;

    if (numData.status === 'success') {
      console.log(\`✓ Number Leased: \${numData.phone}\`);
      console.log(\`✓ Session ID: \${numData.id}\`);
      
      const sessionId = numData.id;
      
      // ধাপ ২: ওটিপি কোডের জন্য পোলিং করা
      console.log('⏳ Waiting for OTP code...');
      const pollTimer = setInterval(async () => {
        const otpResponse = await axios.get(\`\${BASE_URL}/api/success-otp?token=\${API_TOKEN}&id=\${sessionId}\`);
        const otpData = otpResponse.data;
        
        if (otpData.status === 'success') {
          console.log(\`🎉 Received OTP Code: \${otpData.otp}\`);
          clearInterval(pollTimer);
        }
      }, 5000);

    } else {
      console.log(\`✗ Failed: \${numData.message || 'Unknown Error'}\`);
    }
  } catch (err) {
    console.error('Error during SMS process:', err.message);
  }
}

// ব্যবহার উদাহরণ
executeSMSRetrieval("22465XXX");
`;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2.5 font-display tracking-tight">
            <Cpu className="text-cyan-400 h-6 w-6" />
            Developer Access Gateway
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Integrate our dynamic SMS verification pipeline directly into your custom scripts and bots.</p>
        </div>
      </div>

      {/* Secret token Cryptographic Box */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 border border-slate-850 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 rounded-full blur-2xl -mr-6 -mt-6" />
        
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Private API Access Token</h3>
          </div>
          <button
            onClick={handleRecreateKey}
            disabled={generating}
            className="flex items-center gap-1.5 text-[10px] uppercase font-mono px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-850 hover:border-red-500/20 transition-all active:scale-95 disabled:opacity-50 font-bold"
          >
            <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
            Regenerate Token
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-850/80 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
          <div className="flex-grow pr-4">
            <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider">Bearer Security Token</p>
            <p className="text-xs sm:text-sm font-bold font-mono tracking-wide text-slate-100 mt-1 select-all break-all pr-2">
              {showToken ? apiToken : "••••••••••••••••••••••••••••••••••••••••"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowToken(!showToken)}
              className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-cyan-400 border border-slate-850 rounded-lg transition-colors cursor-pointer"
              title={showToken ? "Hide Token" : "Reveal Token"}
            >
              {showToken ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => handleCopy(apiToken, setCopiedToken)}
              className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-cyan-400 border border-slate-850 rounded-lg transition-colors cursor-pointer"
              title="Copy Token"
            >
              {copiedToken ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Warning: Never expose this private key inside client-side bundles or public GitHub repositories. Query the routes server-side only.
        </p>
      </motion.div>

      {/* API Explanation & Step-by-Step Documentation in Bengali/English */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/20 border border-slate-850/60 rounded-3xl p-6 space-y-6"
      >
        <div className="flex items-center gap-2.5 border-b border-slate-800/40 pb-4">
          <BookOpen className="h-5.5 w-5.5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">এপিআই ইন্টিগ্রেশন গাইডলাইন (API Integration Guide)</h3>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
              ১
            </div>
            <h4 className="text-xs font-bold text-slate-200">রিকোয়েস্ট নম্বর (Get Number)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              প্রথমে <code className="text-cyan-400">/api/getnum</code> এপিআই এন্ডপয়েন্টে রিকোয়েস্ট পাঠিয়ে একটি নম্বর ও একটি ইউনিক সেশন আইডি সংগ্রহ করুন।
            </p>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-mono font-bold">
              ২
            </div>
            <h4 className="text-xs font-bold text-slate-200">পোলিং শুরু করুন (Polling)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              সেশন আইডি ব্যবহার করে প্রতি ৫-১০ সেকেন্ড পরপর <code className="text-cyan-400">/api/success-otp</code> এন্ডপয়েন্ট কল করতে থাকুন।
            </p>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
              ৩
            </div>
            <h4 className="text-xs font-bold text-slate-200">ওটিপি কোড সংগ্রহ (Get OTP)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              এসএমএস আসার সাথে সাথেই এপিআই সফলভাবে ওটিপি কোডটি রিটার্ন করবে এবং আপনার পোলিং সফলভাবে সমাপ্ত হবে।
            </p>
          </div>
        </div>
      </motion.div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Endpoint 1: Fetch Number */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-mono text-xs font-bold">
                <span className="font-sans text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 mr-1">GET</span>
                /api/getnum
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">Lease Virtual Line</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              নির্দিষ্ট ক্যারিয়ার রুট থেকে একটি নতুন ভার্চুয়াল মোবাইল লাইন লীজ বা সংগ্রহ করার এন্ডপয়েন্ট। ফিরতি সেশন আইডিটি এসএমএস ওটিপি লগের জন্য সংরক্ষণ করে রাখুন।
            </p>

            {/* Query parameters table */}
            <div className="border border-slate-850 rounded-xl bg-slate-950/45 overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 bg-slate-900/40 font-mono">
                    <th className="p-2 pl-3">Param</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 pr-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-mono">
                  <tr>
                    <td className="p-2 pl-3 text-cyan-400 font-bold">token</td>
                    <td className="p-2 text-slate-400">string</td>
                    <td className="p-2 pr-3 text-slate-300 font-sans">আপনার Private API Access Token</td>
                  </tr>
                  <tr>
                    <td className="p-2 pl-3 text-cyan-400 font-bold">rid</td>
                    <td className="p-2 text-slate-400">string</td>
                    <td className="p-2 pr-3 text-slate-300 font-sans">রুটের আইডি (যেমন: 22465XXX)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* URL Display */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between">
              <code className="text-[10.5px] font-mono text-slate-400 truncate pr-3 select-all">{sampleGetNumUrl}</code>
              <button
                onClick={() => handleCopy(sampleGetNumUrl, setCopiedUrl1)}
                className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer shrink-0"
              >
                {copiedUrl1 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-3">
            <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider mb-2">JSON Response Format (সফল রেসপন্স)</p>
            <pre className="bg-slate-950 border border-slate-850/80 rounded-xl p-3.5 text-[10.5px] font-mono text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
{`{
  "status": "success",
  "id": "240708_99831",
  "phone": "+22465922312",
  "country": "Guinea"
}`}
            </pre>
          </div>
        </div>

        {/* Endpoint 2: Get OTP */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-mono text-xs font-bold">
                <span className="font-sans text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 mr-1">GET</span>
                /api/success-otp
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">Retrieve Verified OTP</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              লীজকৃত সেশনের জন্য প্রাপ্ত এসএমএস ওটিপি কোড সংগ্রহ করার এন্ডপয়েন্ট। ওটিপি কোডটি আসার পূর্ব পর্যন্ত প্রতি ৫-১০ সেকেন্ড অন্তর পোলিং রিকোয়েস্ট পাঠান।
            </p>

            {/* Query parameters table */}
            <div className="border border-slate-850 rounded-xl bg-slate-950/45 overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 bg-slate-900/40 font-mono">
                    <th className="p-2 pl-3">Param</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 pr-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-mono">
                  <tr>
                    <td className="p-2 pl-3 text-cyan-400 font-bold">token</td>
                    <td className="p-2 text-slate-400">string</td>
                    <td className="p-2 pr-3 text-slate-300 font-sans">আপনার Private API Access Token</td>
                  </tr>
                  <tr>
                    <td className="p-2 pl-3 text-cyan-400 font-bold">id</td>
                    <td className="p-2 text-slate-400">string</td>
                    <td className="p-2 pr-3 text-slate-300 font-sans">লীজকৃত সেশন আইডি (ধাপ ১ থেকে প্রাপ্ত)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* URL Display */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between">
              <code className="text-[10.5px] font-mono text-slate-400 truncate pr-3 select-all">{sampleOtpUrl}</code>
              <button
                onClick={() => handleCopy(sampleOtpUrl, setCopiedUrl2)}
                className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer shrink-0"
              >
                {copiedUrl2 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-3">
            <p className="text-[9px] uppercase font-bold font-mono text-slate-500 tracking-wider mb-2">JSON Response Format (সফল রেসপন্স)</p>
            <pre className="bg-slate-950 border border-slate-850/80 rounded-xl p-3.5 text-[10.5px] font-mono text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
{`{
  "status": "success",
  "id": "240708_99831",
  "otp": "488319"
}`}
            </pre>
          </div>
        </div>

      </div>

      {/* Code Snippets Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-slate-900/40 border border-slate-850 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">স্বয়ংক্রিয় স্ক্রিপ্ট কোড উদাহরণ (Integration Code Examples)</h3>
          </div>
          {/* Tabs for Language */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 text-xs font-mono">
            <button
              onClick={() => setActiveLangTab("python")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeLangTab === "python" ? "bg-indigo-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveLangTab("node")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeLangTab === "node" ? "bg-indigo-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Node.js
            </button>
          </div>
        </div>

        {/* Code Content Box */}
        <div className="relative">
          {activeLangTab === "python" ? (
            <div>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => handleCopy(pythonSnippet, setCopiedPython)}
                  className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono"
                >
                  {copiedPython ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-850/80 rounded-2xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto shadow-inner leading-relaxed max-h-[400px]">
                {pythonSnippet}
              </pre>
            </div>
          ) : (
            <div>
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => handleCopy(nodeSnippet, setCopiedNode)}
                  className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono"
                >
                  {copiedNode ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-850/80 rounded-2xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto shadow-inner leading-relaxed max-h-[400px]">
                {nodeSnippet}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

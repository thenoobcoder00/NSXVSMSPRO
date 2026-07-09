import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { Lock, Mail, User, Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface AuthPanelProps {
  onAuthSuccess: () => void;
}

export default function AuthPanel({ onAuthSuccess }: AuthPanelProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "vnhub_";
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Log In
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        // Sign Up
        if (!fullName.trim()) {
          throw new Error("Full name is required.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Set Auth profile displayName
        await updateProfile(user, {
          displayName: fullName.trim()
        });

        // Initialize user record in Firestore
        const lowerEmail = email.trim().toLowerCase();
        const isAutoAdmin = lowerEmail === "noobxvau@admin.con" || lowerEmail === "admin@gmail.com";
        const userRole = isAutoAdmin ? "admin" : "user";
        const userDocRef = doc(db, "users", user.uid);
        try {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: fullName.trim(),
            email: user.email,
            balance: 0.00, // Starting balance
            apiKey: generateRandomKey(),
            role: userRole,
            createdAt: new Date().toISOString(),
            isBlocked: false
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          return;
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error("Auth submit error:", err);
      let errorMsg = err.message;
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "This email is already in use.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        errorMsg = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/user-not-found") {
        errorMsg = "No user found with this email.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden py-12">
      {/* Background radial soft glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 space-y-7 relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-13 w-13 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 p-[1px] shadow-lg shadow-cyan-500/10">
            <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center text-cyan-400 font-extrabold text-2xl font-display">
              NXV
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight font-display">
              {isLogin ? "Welcome to NXVSMS" : "Create Account"}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {isLogin ? "Sign in to manage your SMS OTP activations" : "Start earning credits from verified SMS verifications"}
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-start gap-2.5 font-sans leading-relaxed"
          >
            <AlertTriangle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {/* Full Name (Sign up only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
                Full Display Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/35 transition-all duration-250"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/35 transition-all duration-250 font-mono"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                className="w-full bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/35 transition-all duration-250 font-mono"
              />
            </div>
          </div>

          {/* Submit Button with Hover scale and shadow */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/15 transition-all duration-300 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                Validating Security...
              </>
            ) : (
              isLogin ? "Sign In" : "Register Now"
            )}
          </button>
        </form>

        {/* Form Switcher */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-3 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-full border border-cyan-500/10"
          >
            {isLogin ? "New to NXVSMS? Sign Up" : "Have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

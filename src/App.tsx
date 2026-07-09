import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  setDoc,
  getDoc,
  orderBy
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { UserProfile, NumberLog, WithdrawalRequest } from "./types";

// Import custom components
import Header from "./components/Header";
import AuthPanel from "./components/AuthPanel";
import UserDashboard from "./components/UserDashboard";
import GetNumberSection from "./components/GetNumberSection";
import WithdrawSection from "./components/WithdrawSection";
import DeveloperAPISection from "./components/DeveloperAPISection";
import ProfileSection from "./components/ProfileSection";
import DeveloperSupportSection from "./components/DeveloperSupportSection";

// Import admin components
import AdminDashboard from "./components/AdminDashboard";
import AdminUserManagement from "./components/AdminUserManagement";
import AdminWithdrawalManagement from "./components/AdminWithdrawalManagement";
import AdminSettings from "./components/AdminSettings";

// Icons
import { 
  LayoutDashboard, 
  Phone, 
  CreditCard, 
  Terminal, 
  User, 
  Users, 
  Settings, 
  Menu, 
  X, 
  ShieldAlert,
  Loader2,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Panels and Navigation states
  const [activePanel, setActivePanel] = useState<"user" | "admin">("user");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time Firestore Collections data
  const [numberLogs, setNumberLogs] = useState<NumberLog[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  // Admin Data lists
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allNumberLogs, setAllNumberLogs] = useState<NumberLog[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Monitor Authentication State
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeLogs: (() => void) | null = null;
    let unsubscribeWithdrawals: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clear previous snapshot subscriptions first to prevent memory and auth leaks
      if (unsubscribeProfile) { unsubscribeProfile(); unsubscribeProfile = null; }
      if (unsubscribeLogs) { unsubscribeLogs(); unsubscribeLogs = null; }
      if (unsubscribeWithdrawals) { unsubscribeWithdrawals(); unsubscribeWithdrawals = null; }

      if (currentUser) {
        setUser(currentUser);
        
        // Listen for user profile document in Firestore in real-time
        const profileRef = doc(db, "users", currentUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const lowerEmail = currentUser.email?.toLowerCase();
            const isAutoAdmin = lowerEmail === "noobxvau@admin.con" || lowerEmail === "admin@gmail.com";
            
            let updated = false;
            // Auto-upgrade admins to admin role in database if not already done
            if (isAutoAdmin && data.role !== "admin") {
              data.role = "admin";
              updated = true;
            }

            // Auto-generate apiKey if missing or placeholder
            if (!data.apiKey || data.apiKey === "vnhub_not_configured_yet") {
              data.apiKey = "vnhub_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              updated = true;
            }

            if (updated) {
              const { updateDoc } = await import("firebase/firestore");
              await updateDoc(profileRef, { 
                role: data.role,
                apiKey: data.apiKey
              });
            }
            setUserProfile(data);
          } else {
            const lowerEmail = currentUser.email?.toLowerCase();
            const isAutoAdmin = lowerEmail === "noobxvau@admin.con" || lowerEmail === "admin@gmail.com";
            // Self-healing: if auth user exists but no firestore profile exists yet, create one
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || "Anonymous User",
              email: currentUser.email || "",
              balance: 0.00,
              apiKey: "vnhub_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
              role: isAutoAdmin ? "admin" : "user",
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(profileRef, newProfile);
              setUserProfile(newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });

        // Listen to personal number logs
        const logsQuery = query(
          collection(db, "number_logs"),
          where("uid", "==", currentUser.uid)
        );
        unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
          const logs: NumberLog[] = [];
          snapshot.forEach((d) => {
            logs.push(d.data() as NumberLog);
          });
          // Sort newest first
          logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNumberLogs(logs);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "number_logs");
        });

        // Listen to personal withdrawals
        const withdrawalsQuery = query(
          collection(db, "withdrawals"),
          where("uid", "==", currentUser.uid)
        );
        unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
          const wds: WithdrawalRequest[] = [];
          snapshot.forEach((d) => {
            wds.push({ id: d.id, ...d.data() } as WithdrawalRequest);
          });
          wds.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setWithdrawalRequests(wds);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "withdrawals");
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setNumberLogs([]);
        setWithdrawalRequests([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeWithdrawals) unsubscribeWithdrawals();
    };
  }, []);

  // Monitor Global Collections (For Admins only)
  useEffect(() => {
    let unsubAllUsers: (() => void) | null = null;
    let unsubAllLogs: (() => void) | null = null;
    let unsubAllWithdrawals: (() => void) | null = null;

    if (userProfile && userProfile.role === "admin") {
      // 1. All Users
      unsubAllUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((d) => {
          usersList.push(d.data() as UserProfile);
        });
        setAllUsers(usersList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "users");
      });

      // 2. All Number Logs
      unsubAllLogs = onSnapshot(collection(db, "number_logs"), (snapshot) => {
        const logsList: NumberLog[] = [];
        snapshot.forEach((d) => {
          logsList.push(d.data() as NumberLog);
        });
        logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllNumberLogs(logsList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "number_logs");
      });

      // 3. All Withdrawals
      unsubAllWithdrawals = onSnapshot(collection(db, "withdrawals"), (snapshot) => {
        const withdrawalsList: WithdrawalRequest[] = [];
        snapshot.forEach((d) => {
          withdrawalsList.push({ id: d.id, ...d.data() } as WithdrawalRequest);
        });
        withdrawalsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllWithdrawals(withdrawalsList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "withdrawals");
      });
    }

    return () => {
      if (unsubAllUsers) unsubAllUsers();
      if (unsubAllLogs) unsubAllLogs();
      if (unsubAllWithdrawals) unsubAllWithdrawals();
    };
  }, [userProfile]);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab("dashboard");
    setActivePanel("user");
  };

  const handleTogglePanel = (panel: "user" | "admin") => {
    setActivePanel(panel);
    // Automatically switch tabs depending on panel
    if (panel === "admin") {
      setActiveTab("admin-dashboard");
    } else {
      setActiveTab("dashboard");
    }
  };

  // User Tab list
  const userNavigation = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "get-number", name: "Get Number", icon: Phone },
    { id: "withdraw", name: "Withdrawals", icon: CreditCard },
    { id: "developer-api", name: "Developer API", icon: Terminal },
    { id: "profile", name: "My Profile", icon: User },
    { id: "developer-info", name: "Developer", icon: Code },
  ];

  // Admin Tab list
  const adminNavigation = [
    { id: "admin-dashboard", name: "Admin Stats", icon: LayoutDashboard },
    { id: "admin-users", name: "User Management", icon: Users },
    { id: "admin-withdrawals", name: "Withdrawals Queue", icon: CreditCard },
    { id: "admin-settings", name: "Global Settings", icon: Settings },
  ];

  const currentNavigation = activePanel === "admin" ? adminNavigation : userNavigation;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        <p className="text-slate-400 font-mono text-xs">Initializing secure environment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <AuthPanel onAuthSuccess={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* Header Topbar */}
      <Header 
        userProfile={userProfile} 
        onLogout={handleLogout} 
        activePanel={activePanel}
        onTogglePanel={handleTogglePanel}
      />

      {/* Main Container */}
      <div className="flex-grow flex relative">
        
        {/* Mobile Backdrop Overlay for Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Mobile Hamburger Drawer Toggle (Floating sticky on left content) */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 hover:text-white transition-all shadow-xl hover:shadow-cyan-500/10 active:scale-95"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Sidebar Left Navigation */}
        <nav className={`
          fixed lg:sticky top-[73px] lg:h-[calc(100vh-73px)] inset-y-0 left-0 w-64 bg-slate-900/90 backdrop-blur-md border-r border-slate-800/60 p-4 flex flex-col space-y-2 z-40 transition-transform duration-300 ease-out transform
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          h-full
        `}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/40 mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              {activePanel === "admin" ? "Admin Controls" : "User Console"}
            </span>
            {sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 pt-1 flex-grow">
            {currentNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-350 relative group ${
                    isActive 
                      ? activePanel === "admin"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5"
                      : "bg-transparent text-slate-400 border border-transparent hover:bg-slate-950/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? (activePanel === "admin" ? "text-red-400" : "text-cyan-400") : "text-slate-500"}`} />
                  {item.name}
                  {isActive && (
                    <span className={`absolute right-3 w-1.5 h-1.5 rounded-full ${activePanel === "admin" ? "bg-red-500 animate-pulse" : "bg-cyan-500 animate-pulse"}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* User Block Status Banner */}
          {userProfile?.isBlocked && (
            <div className="mt-auto p-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-start gap-2 font-sans leading-relaxed">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Account Blocked</p>
                <p className="text-[10px] text-red-400/80 mt-0.5">Your profile is suspended. Please contact system admin.</p>
              </div>
            </div>
          )}
        </nav>

        {/* Content Area */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full min-h-[calc(100vh-73px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Render Selected View */}
              {activeTab === "dashboard" && (
                <UserDashboard 
                  userProfile={userProfile} 
                  numberLogs={numberLogs} 
                  onRefreshStats={() => {}}
                />
              )}

              {activeTab === "get-number" && (
                <GetNumberSection 
                  userProfile={userProfile}
                  onRefreshProfile={() => {}} // Snapshot listens to profile updates automatically!
                  numberLogs={numberLogs}
                  onRefreshLogs={() => {}}
                />
              )}

              {activeTab === "withdraw" && (
                <WithdrawSection 
                  userProfile={userProfile}
                  onRefreshProfile={() => {}}
                  withdrawalRequests={withdrawalRequests}
                  onRefreshWithdrawals={() => {}}
                />
              )}

              {activeTab === "developer-api" && (
                <DeveloperAPISection 
                  userProfile={userProfile} 
                  onRefreshProfile={() => {}}
                />
              )}

              {activeTab === "profile" && (
                <ProfileSection 
                  userProfile={userProfile} 
                  onRefreshProfile={() => {}}
                />
              )}

              {activeTab === "developer-info" && (
                <DeveloperSupportSection />
              )}

              {/* Admin Panel Views */}
              {activeTab === "admin-dashboard" && (
                <AdminDashboard 
                  users={allUsers} 
                  numberLogs={allNumberLogs} 
                  withdrawals={allWithdrawals}
                />
              )}

              {activeTab === "admin-users" && (
                <AdminUserManagement 
                  users={allUsers} 
                  onRefreshUsers={() => {}}
                />
              )}

              {activeTab === "admin-withdrawals" && (
                <AdminWithdrawalManagement 
                  withdrawals={allWithdrawals} 
                  onRefreshWithdrawals={() => {}}
                />
              )}

              {activeTab === "admin-settings" && (
                <AdminSettings onSettingsUpdated={() => {}} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

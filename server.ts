import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ESM and CommonJS compatible __dirname and __filename definitions
const __filename = typeof globalThis.__filename !== "undefined" ? globalThis.__filename : fileURLToPath(import.meta.url);
const __dirname = typeof globalThis.__dirname !== "undefined" ? globalThis.__dirname : path.dirname(__filename);

import { initializeApp, getApps, getApp as getFirebaseApp } from "firebase/app";
import { initializeFirestore, getFirestore, doc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

// Define uninitialized variables at the module level
let db: any;
let auth: any;
let firebaseApp: any;

// Lazy initialization wrapper for Firebase client SDK
function initFirebase() {
  if (db && auth) return;

  let firebaseConfig: any;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } else {
      // Try relative to __dirname (useful for packaged environments like Vercel)
      const relativePath = path.join(__dirname, "../firebase-applet-config.json");
      if (fs.existsSync(relativePath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(relativePath, "utf8"));
      } else {
        const relativePathHere = path.join(__dirname, "firebase-applet-config.json");
        if (fs.existsSync(relativePathHere)) {
          firebaseConfig = JSON.parse(fs.readFileSync(relativePathHere, "utf8"));
        } else {
          // Fallback to hardcoded public config matching client-side
          console.warn("firebase-applet-config.json not found, using default fallback config.");
          firebaseConfig = {
            apiKey: "AIzaSyCqNGgR4GQ4NbTE5PJZFb-YGMeh-p_dMvc",
            authDomain: "gen-lang-client-0419262704.firebaseapp.com",
            projectId: "gen-lang-client-0419262704",
            storageBucket: "gen-lang-client-0419262704.firebasestorage.app",
            messagingSenderId: "716412348215",
            appId: "1:716412348215:web:ecc23d1550ebb77b549cb2",
            firestoreDatabaseId: "ai-studio-ba0db5c2-72d1-4664-b03f-c636639a5a3f"
          };
        }
      }
    }
  } catch (err) {
    console.error("Error reading firebase config, using hardcoded fallback:", err);
    firebaseConfig = {
      apiKey: "AIzaSyCqNGgR4GQ4NbTE5PJZFb-YGMeh-p_dMvc",
      authDomain: "gen-lang-client-0419262704.firebaseapp.com",
      projectId: "gen-lang-client-0419262704",
      storageBucket: "gen-lang-client-0419262704.firebasestorage.app",
      messagingSenderId: "716412348215",
      appId: "1:716412348215:web:ecc23d1550ebb77b549cb2",
      firestoreDatabaseId: "ai-studio-ba0db5c2-72d1-4664-b03f-c636639a5a3f"
    };
  }

  if (getApps().length > 0) {
    firebaseApp = getFirebaseApp();
    try {
      db = getFirestore(firebaseApp);
    } catch (err) {
      try {
        db = initializeFirestore(firebaseApp, {
          experimentalForceLongPolling: true,
        }, firebaseConfig.firestoreDatabaseId || "ai-studio-ba0db5c2-72d1-4664-b03f-c636639a5a3f");
      } catch (initErr) {
        db = getFirestore(firebaseApp);
      }
    }
  } else {
    firebaseApp = initializeApp(firebaseConfig);
    try {
      db = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId || "ai-studio-ba0db5c2-72d1-4664-b03f-c636639a5a3f");
    } catch (err) {
      db = getFirestore(firebaseApp);
    }
  }

  auth = getAuth(firebaseApp);
  console.log("Firebase initialized successfully on server-side!");
}

let authPromise: Promise<void> | null = null;

// Authenticate server agent
async function authenticateServerAgent() {
  if (auth && auth.currentUser) {
    return;
  }
  if (authPromise) {
    return authPromise;
  }

  authPromise = (async () => {
    const adminEmail = "server-api-agent@local.service";
    const adminPassword = "SuperSecureServerAgentPassword123!!";
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log("Server API agent authenticated successfully!");
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-email") {
        try {
          await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          console.log("Server API agent user created and authenticated successfully!");
        } catch (createErr) {
          console.error("Failed to create server API agent user:", createErr);
        }
      } else {
        console.error("Error signing in server API agent:", err);
      }
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

// Helper for fetch with a timeout to prevent hanging connections
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      throw new Error(`Request to third-party API timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

let appInstance: express.Express | null = null;

export async function getApp() {
  if (appInstance) return appInstance;

  // Initialize Firebase Client SDK safely
  initFirebase();

  const app = express();
  app.use(express.json());

  // CORS Middleware for high compatibility in iframe and serverless environments
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, mauthapi");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // API Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Diagnostic Endpoint
  app.get("/api/health", async (req, res) => {
    try {
      initFirebase();
      await authenticateServerAgent();
      const settingsSnap = await getDoc(doc(db, "settings", "global"));
      res.json({
        status: "healthy",
        firebase: "initialized",
        agentAuthenticated: !!(auth && auth.currentUser),
        currentUserEmail: auth?.currentUser?.email || null,
        settingsFound: settingsSnap.exists(),
        vercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({
        status: "unhealthy",
        error: err.message || err,
        stack: err.stack
      });
    }
  });

  // Authenticate server agent
  await authenticateServerAgent();

  // Helper to dynamically fetch API settings from Firestore
  async function getApiSettings() {
    try {
      await authenticateServerAgent();
      const settingsSnap = await getDoc(doc(db, "settings", "global"));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        return {
          apiKey: data?.api_key || "M9LGX0CVL2M",
          baseUrl: data?.base_api_url || "https://api.2oo9.cloud/MXS47FLFX0U/tnevs/@public/api"
        };
      }
    } catch (err: any) {
      console.error("Error fetching API settings from Firestore:", err.message || err);
    }
    return {
      apiKey: "M9LGX0CVL2M",
      baseUrl: "https://api.2oo9.cloud/MXS47FLFX0U/tnevs/@public/api"
    };
  }

  // Proxy: Live Feed Console (Last 15 mins)
  app.get("/api/console", async (req, res) => {
    try {
      const settings = await getApiSettings();
      const targetUrl = new URL(`${settings.baseUrl}/console`);

      const response = await fetch(targetUrl.toString(), {
        headers: {
          "mauthapi": settings.apiKey,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error in console proxy:", error);
      res.status(500).json({ error: "Failed to fetch live console feed", details: error.message });
    }
  });

  // Proxy: Get Number
  app.get("/api/getnum", async (req, res) => {
    try {
      const settings = await getApiSettings();
      const targetUrl = new URL(`${settings.baseUrl}/getnum`);
      
      const rid = (req.query.rid as string) || (req.query.id as string) || "22465XXX";

      console.log(`[Proxy GetNum] Requesting operator code: ${rid} from baseUrl: ${settings.baseUrl}`);

      const response = await fetch(targetUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "mauthapi": settings.apiKey,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({ rid })
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error(`[Proxy GetNum] Failed to parse third-party JSON. Status: ${response.status}. Raw response:`, responseText);
        return res.status(502).json({
          error: `Third-party service returned non-JSON response (Status ${response.status})`,
          details: responseText.slice(0, 500)
        });
      }

      console.log("[Proxy GetNum] Parsed response successfully:", JSON.stringify(data));

      // Modified logic starts here
      const info = data?.data || data;

      const number =
        info?.full_number ||
        info?.no_plus_number ||
        info?.national_number ||
        info?.number ||
        info?.phone;

      const id =
        info?.rid ||
        info?.id ||
        data?.rid ||
        `session-${Date.now()}`;

      if (number) {
        return res.json({
          number,
          country: info?.country || "Unknown",
          id,
        });
      }

      return res.status(400).json({
        error: data?.message || data?.meta?.msg || "No virtual number available.",
        details: data,
      });
      // Modified logic ends here

    } catch (error: any) {
      console.error("Error in getnum proxy:", error);
      res.status(500).json({ error: "Failed to fetch virtual number", details: error.message });
    }
  });

  // Proxy: Successful OTP Validation
  app.get("/api/success-otp", async (req, res) => {
    try {
      await authenticateServerAgent();
      const settings = await getApiSettings();
      const targetUrl = new URL(`${settings.baseUrl}/success-otp`);
      
      const numberId = req.query.id as string; // from polling
      const clientNumber = req.query.number as string; // from client query param (robust fallback)

      const response = await fetch(targetUrl.toString(), {
        headers: {
          "mauthapi": settings.apiKey,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });
      
      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error(`[Proxy SuccessOTP] Failed to parse third-party JSON. Status: ${response.status}. Raw response:`, responseText);
        return res.status(502).json({
          error: `Third-party service returned non-JSON response (Status ${response.status})`,
          details: responseText.slice(0, 500)
        });
      }

      if (data && data.data && data.data.otps) {
        const otps = data.data.otps;
        let targetNumber = clientNumber || "";

        // Attempt to find the number in Firestore logs
        if (!targetNumber && numberId) {
          try {
            const q = query(collection(db, "number_logs"), where("logId", "==", numberId));
            const logSnap = await getDocs(q);
            if (!logSnap.empty) {
              targetNumber = logSnap.docs[0].data().number || "";
            }
          } catch (dbErr) {
            console.error("Non-blocking error reading number_logs from Firestore in proxy:", dbErr);
          }
        }

        let matchedOtp = null;
        if (numberId) {
          matchedOtp = otps.find((o: any) => o.otp_id === numberId || o.message.includes(numberId));
        }

        if (!matchedOtp && targetNumber) {
          const cleanTarget = targetNumber.replace(/\D/g, "");
          matchedOtp = otps.find((o: any) => {
            const cleanOtpNum = o.number.replace(/\D/g, "");
            return cleanOtpNum === cleanTarget || cleanTarget.endsWith(cleanOtpNum) || cleanOtpNum.endsWith(cleanTarget);
          });
        }

        if (matchedOtp) {
          const otpMatch = matchedOtp.message.match(/\b\d{4,6}\b/);
          const parsedOtp = otpMatch ? otpMatch[0] : "";

          res.json({
            success: true,
            otp: parsedOtp,
            message: matchedOtp.message,
            number: matchedOtp.number
          });
          return;
        }
      }

      res.json({ success: false, message: "OTP not received yet" });
    } catch (error: any) {
      console.error("Error in success-otp proxy:", error);
      res.status(500).json({ error: "Failed to validate OTP", details: error.message });
    }
  });

  // ==========================================
  // PROGRAMMATIC DEVELOPER API ENDPOINTS
  // ==========================================

  // Helper to validate User API Key and return the user document ref & data
  async function validateUserApiKey(apiKey: string) {
    if (!apiKey) return null;
    try {
      await authenticateServerAgent();
      const q = query(collection(db, "users"), where("apiKey", "==", apiKey));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const userDoc = querySnapshot.docs[0];
      return { ref: userDoc.ref, data: userDoc.data() };
    } catch (err) {
      console.error("Error validating API key:", err);
      return null;
    }
  }

  // Developer API: Get Programmatic Number
  app.get("/api/developer/getnum", async (req, res) => {
    try {
      const apiKey = req.query.apiKey as string;
      const user = await validateUserApiKey(apiKey);
      if (!user) {
        return res.status(401).json({ error: "Invalid API Key" });
      }

      const rid = (req.query.rid as string) || "22465XXX";

      const settings = await getApiSettings();
      const targetUrl = new URL(`${settings.baseUrl}/getnum`);

      const response = await fetch(targetUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "mauthapi": settings.apiKey,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({ rid })
      });
      const data = await response.json();

      if (data && data.meta && data.meta.code === 200 && data.data) {
        const phoneNum = data.data.full_number || data.data.no_plus_number || data.data.national_number;
        const country = data.data.country || "Unknown";
        const id = data.rid || `dev-${Date.now()}`;

        // Save number log to Firestore
        await addDoc(collection(db, "number_logs"), {
          logId: id,
          uid: user.data.uid,
          number: phoneNum,
          country: country,
          status: "pending",
          otp: "",
          timestamp: new Date().toISOString()
        });

        res.json({
          success: true,
          number: phoneNum,
          country: country,
          id: id
        });
      } else {
        res.status(400).json({ error: "Third-party service returned empty number or error", response: data });
      }
    } catch (error: any) {
      console.error("Developer API getnum error:", error);
      res.status(500).json({ error: "Server error fetching developer number", details: error.message });
    }
  });

  // Developer API: Check Programmatic OTP Verification
  app.get("/api/developer/check-otp", async (req, res) => {
    try {
      const apiKey = req.query.apiKey as string;
      const numberId = req.query.id as string;
      const user = await validateUserApiKey(apiKey);
      if (!user) {
        return res.status(401).json({ error: "Invalid API Key" });
      }

      if (!numberId) {
        return res.status(400).json({ error: "Missing required query parameter 'id'" });
      }

      // 1. Fetch the number log from Firestore to make sure it belongs to this user and is still pending
      const q = query(collection(db, "number_logs"), where("logId", "==", numberId), where("uid", "==", user.data.uid));
      const logSnapshot = await getDocs(q);
      if (logSnapshot.empty) {
        return res.status(404).json({ error: "Number request log not found" });
      }

      const logDoc = logSnapshot.docs[0];
      const logData = logDoc.data();

      if (logData.status === "success") {
        return res.json({ success: true, status: "success", otp: logData.otp });
      }

      // 2. Call success-otp third party endpoint
      const settings = await getApiSettings();
      const targetUrl = new URL(`${settings.baseUrl}/success-otp`);

      const response = await fetch(targetUrl.toString(), {
        headers: {
          "mauthapi": settings.apiKey,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });
      const data = await response.json();

      let matchedOtp = null;
      if (data && data.data && data.data.otps) {
        const otps = data.data.otps;
        const targetNumber = logData.number;
        const cleanTarget = targetNumber.replace(/\D/g, "");
        matchedOtp = otps.find((o: any) => {
          const cleanOtpNum = o.number.replace(/\D/g, "");
          return cleanOtpNum === cleanTarget || cleanTarget.endsWith(cleanOtpNum) || cleanOtpNum.endsWith(cleanTarget);
        });
      }

      // If OTP received (typically data.otp is present and not empty)
      if (matchedOtp) {
        const otpMatch = matchedOtp.message.match(/\b\d{4,6}\b/);
        const parsedOtp = otpMatch ? otpMatch[0] : "";

        // Fetch reward rate from global settings
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        let rewardRate = 0.50; // Default 0.50 BDT
        if (settingsSnap.exists()) {
          rewardRate = Number(settingsSnap.data()?.reward_rate) || 0.50;
        }

        // 3. Update the number log to success
        await updateDoc(logDoc.ref, {
          status: "success",
          otp: parsedOtp,
          otpTimestamp: new Date().toISOString()
        });

        // 4. Reward the user's Firestore balance
        await updateDoc(user.ref, {
          balance: increment(rewardRate)
        });

        res.json({
          success: true,
          status: "success",
          otp: parsedOtp,
          reward_credited: rewardRate
        });
      } else {
        res.json({
          success: false,
          status: "pending",
          message: "OTP not received yet"
        });
      }
    } catch (error: any) {
      console.error("Developer API check-otp error:", error);
      res.status(500).json({ error: "Server error checking developer OTP", details: error.message });
    }
  });

  appInstance = app;
  return app;
}

async function startServer() {
  const app = await getApp();
  const PORT = 3000;

  // ==========================================
  // DEV SERVER & VITE INTEGRATION
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

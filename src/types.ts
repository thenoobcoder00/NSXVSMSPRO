export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  balance: number;
  apiKey: string;
  role: "user" | "admin";
  createdAt: string;
  isBlocked?: boolean;
}

export interface NumberLog {
  logId: string;
  uid: string;
  number: string;
  country: string;
  status: "pending" | "success" | "expired";
  otp: string;
  timestamp: string;
  otpTimestamp?: string;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  userEmail?: string;
  userName?: string;
  amount: number;
  method: "Bkash" | "Nagad" | "Rocket" | "Binance";
  accountNo: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
}

export interface GlobalSettings {
  base_api_url: string;
  api_key: string;
  reward_rate: number;
}

export interface ConsoleHit {
  country: string;
  range: string;
  time: string;
  service?: string;
}

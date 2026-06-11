// lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

// ── USER TYPE — extend as more steps complete ─────────────────
export interface User {
  id: string;
  mobile: string;
  name: string;
  email: string;
  nid: string;
  dob: string;
  division: string;
  district: string;
  accountType: string;
  tin: string;
  tradingPermissions: string[];
  kycStatus: "pending" | "verified";
  boAccountNo: string;
  verifiedAt: string;
  avatar: string | null;
}

// ── STATIC MOCK USER — replace fetch() with this for now ──────
const MOCK_USER: User = {
  id: "usr_001",
  mobile: "+880 1712-",
  name: "Sajeeb Ahmed",
  email: "sajeeb@example.com",
  nid: "1992 8374 5621",
  dob: "1990-06-15",
  division: "Dhaka",
  district: "Dhaka",
  accountType: "Individual",
  tin: "TIN-2024-88291",
  tradingPermissions: ["Cash", "Margin"],
  kycStatus: "verified",
  boAccountNo: "BO-1204-8821-0034",
  verifiedAt: "2024-06-10T09:30:00Z",
  avatar: null,
};

// ── CONTEXT TYPE ──────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void; // lets any step update the user
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
});

// ── PROVIDER ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── STATIC MODE: comment this block out and uncomment the
    //    fetch() below when your backend is ready ─────────────
    setUser(MOCK_USER);
    setLoading(false);

    // ── DYNAMIC MODE (uncomment when backend is ready): ───────
    // fetch("/api/auth/me")
    //   .then((r) => r.json())
    //   .then((data) => setUser(data.user ?? null))
    //   .catch(() => setUser(null))
    //   .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── HOOK ─────────────────────────────────────────────────────
export const useAuth = () => useContext(AuthContext);

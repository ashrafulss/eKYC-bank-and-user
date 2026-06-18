
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cookieUtil } from "../utils/cookies";
import apiClient from "../../lib/api-client";


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
  current_step: string
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refetchUser: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = cookieUtil.getCookie("next_auth_session");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get("/auth/me");
      setUser(response.data?.data?.user || response.data?.user || null);
    } catch (err) {
      console.error("Failed to fetch current user profile:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);


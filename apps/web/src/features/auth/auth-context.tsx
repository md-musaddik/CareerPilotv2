import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  firebaseAuth,
  logout,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/firebase";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setUser(null);
      setIsLoading(false);
      return undefined;
    }

    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmail(email, password);
    setUser(credential.user);
  }, []);

  const signupWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signUpWithEmail(email, password);
    setUser(credential.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const credential = await signInWithGoogle();
    setUser(credential.user);
  }, []);

  const logoutUser = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      logoutUser,
    }),
    [isLoading, loginWithEmail, loginWithGoogle, logoutUser, signupWithEmail, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

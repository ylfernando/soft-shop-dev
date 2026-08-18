import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  signUp as signUpFn,
  login as loginFn,
  loginDemo as loginDemoFn,
  logout as logoutFn,
} from "@/server-fns/auth";
import type { AuthUser, EnderecoInput } from "@/server-fns/auth";

export type { AuthUser, EnderecoInput };

type AuthResult = { ok: true; user: AuthUser } | { ok: false; erro: string };

interface AuthContextValue {
  user: AuthUser | null;
  hydrated: boolean;
  signUp: (
    nome: string,
    email: string,
    senha: string,
    endereco?: EnderecoInput,
  ) => Promise<AuthResult>;
  login: (email: string, senha: string) => Promise<AuthResult>;
  loginDemo: () => Promise<AuthResult>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const SESSION_KEY = "soft-shop-session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const signUpFnCall = useServerFn(signUpFn);
  const loginFnCall = useServerFn(loginFn);
  const loginDemoFnCall = useServerFn(loginDemoFn);
  const logoutFnCall = useServerFn(logoutFn);

  useEffect(() => {
    setUser(readSession());
    setHydrated(true);
  }, []);

  async function signUp(
    nome: string,
    email: string,
    senha: string,
    endereco?: EnderecoInput,
  ): Promise<AuthResult> {
    const res = await signUpFnCall({ data: { nome, email, senha, ...endereco } });
    if (res.ok) {
      writeSession(res.user);
      setUser(res.user);
    }
    return res;
  }

  async function login(email: string, senha: string): Promise<AuthResult> {
    const res = await loginFnCall({ data: { email, senha } });
    if (res.ok) {
      writeSession(res.user);
      setUser(res.user);
    }
    return res;
  }

  /** Logs in with the seeded demo account (teste@soft.com), a shortcut for testing
   * the cart/modal flow without filling out the sign-up form every time. */
  async function loginDemo(): Promise<AuthResult> {
    const res = await loginDemoFnCall();
    if (res.ok) {
      writeSession(res.user);
      setUser(res.user);
    }
    return res;
  }

  function logout() {
    logoutFnCall().catch(() => {});
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  function updateUser(updated: AuthUser) {
    writeSession(updated);
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, hydrated, signUp, login, loginDemo, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

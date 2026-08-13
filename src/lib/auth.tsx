import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AuthUser {
  nome: string;
  email: string;
}

interface StoredUser extends AuthUser {
  senha: string;
}

type AuthResult = { ok: true; email: string } | { ok: false; erro: string };

interface AuthContextValue {
  user: AuthUser | null;
  hydrated: boolean;
  signUp: (nome: string, email: string, senha: string) => AuthResult;
  login: (email: string, senha: string) => AuthResult;
  loginDemo: () => AuthResult;
  logout: () => void;
}

const USERS_KEY = "soft-shop-users";
const SESSION_KEY = "soft-shop-session";

const DEMO_EMAIL = "teste@soft.com";
const DEMO_SENHA = "teste1234";
const DEMO_NOME = "Conta Teste";

const AuthContext = createContext<AuthContextValue | null>(null);

function readUsers(): Record<string, StoredUser> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}") as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem(SESSION_KEY);
    const stored = email ? readUsers()[email] : undefined;
    if (stored) setUser({ nome: stored.nome, email: stored.email });
    setHydrated(true);
  }, []);

  function signUp(nome: string, email: string, senha: string): AuthResult {
    const key = email.trim().toLowerCase();
    if (!nome.trim() || !key || senha.length < 4) {
      return { ok: false, erro: "preenche nome, e-mail e uma senha com pelo menos 4 caracteres." };
    }
    const users = readUsers();
    if (users[key]) {
      return { ok: false, erro: "já existe uma conta com esse e-mail. tenta entrar." };
    }
    users[key] = { nome: nome.trim(), email: key, senha };
    writeUsers(users);
    localStorage.setItem(SESSION_KEY, key);
    setUser({ nome: users[key].nome, email: key });
    return { ok: true, email: key };
  }

  function login(email: string, senha: string): AuthResult {
    const key = email.trim().toLowerCase();
    const stored = readUsers()[key];
    if (!stored || stored.senha !== senha) {
      return { ok: false, erro: "e-mail ou senha incorretos." };
    }
    localStorage.setItem(SESSION_KEY, key);
    setUser({ nome: stored.nome, email: key });
    return { ok: true, email: key };
  }

  /** Logs in with a fixed demo account, creating it on first use. Just a shortcut for
   * testing the cart/modal flow without filling out the sign-up form every time. */
  function loginDemo(): AuthResult {
    const users = readUsers();
    if (!users[DEMO_EMAIL]) {
      users[DEMO_EMAIL] = { nome: DEMO_NOME, email: DEMO_EMAIL, senha: DEMO_SENHA };
      writeUsers(users);
    }
    localStorage.setItem(SESSION_KEY, DEMO_EMAIL);
    setUser({ nome: DEMO_NOME, email: DEMO_EMAIL });
    return { ok: true, email: DEMO_EMAIL };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, hydrated, signUp, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

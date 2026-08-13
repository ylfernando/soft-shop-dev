import {
  getSession,
  updateSession,
  clearSession,
  type SessionConfig,
} from "@tanstack/react-start/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";

export interface AdminUser {
  id: number;
  nome: string;
  email: string;
}

interface AdminSessionData {
  adminId: number;
}

interface AdminRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
}

function sessionConfig(): SessionConfig {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET precisa estar definida (.env) com pelo menos 32 caracteres.",
    );
  }
  return {
    password,
    name: "admin_session",
    maxAge: 60 * 60 * 8, // 8h
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function createAdminSession(adminId: number) {
  await updateSession<AdminSessionData>(sessionConfig(), { adminId });
}

export async function destroyAdminSession() {
  await clearSession(sessionConfig());
}

/** Lê a sessão sem lançar erro — usada pra checagens "estou logado?" (ex: guard de rota). */
export async function readAdminSession(): Promise<AdminUser | null> {
  const session = await getSession<AdminSessionData>(sessionConfig());
  const adminId = session.data.adminId;
  if (!adminId) return null;

  const pool = getPool();
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id, nome, email FROM usuarios WHERE id = ? AND role = 'admin' LIMIT 1",
    [adminId],
  );
  return rows[0] ?? null;
}

/** Lança erro se não houver um admin autenticado — chamada no início de todo
 * server-fn administrativo, pra nunca confiar num id de usuário vindo do cliente. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await readAdminSession();
  if (!admin) {
    throw new Error("não autorizado: faça login como administrador.");
  }
  return admin;
}

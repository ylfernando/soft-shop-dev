import {
  getSession,
  updateSession,
  clearSession,
  type SessionConfig,
} from "@tanstack/react-start/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import type { AuthUser } from "./auth";

interface UserSessionData {
  usuarioId: number;
}

interface UsuarioRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  role: "cliente" | "admin";
  cep: string | null;
  cpf: string | null;
  emailVerificadoEm: Date | null;
}

function sessionConfig(): SessionConfig {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET precisa estar definida (.env) com pelo menos 32 caracteres.");
  }
  return {
    password,
    name: "soft_shop_session",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function createUserSession(usuarioId: number) {
  await updateSession<UserSessionData>(sessionConfig(), { usuarioId });
}

export async function destroyUserSession() {
  await clearSession(sessionConfig());
}

/** Lê a sessão sem lançar erro — usada pra checagens "estou logado?". */
export async function readUserSession(): Promise<AuthUser | null> {
  const session = await getSession<UserSessionData>(sessionConfig());
  const usuarioId = session.data.usuarioId;
  if (!usuarioId) return null;

  const pool = getPool();
  const [rows] = await pool.query<UsuarioRow[]>(
    "SELECT id, nome, email, role, cep, cpf, email_verificado_em AS emailVerificadoEm FROM usuarios WHERE id = ? LIMIT 1",
    [usuarioId],
  );
  const row = rows[0];
  return row
    ? {
        id: row.id,
        nome: row.nome,
        email: row.email,
        role: row.role,
        cep: row.cep ?? "",
        cpf: row.cpf ?? "",
        emailVerificado: row.emailVerificadoEm !== null,
      }
    : null;
}

/** Lança erro se não houver um cliente autenticado — chamada no início de todo
 * server-fn que mexe em carrinho/pedidos, pra nunca confiar num id de usuário
 * vindo do cliente. */
export async function requireUser(): Promise<AuthUser> {
  const user = await readUserSession();
  if (!user) {
    throw new Error("não autorizado: faça login.");
  }
  return user;
}

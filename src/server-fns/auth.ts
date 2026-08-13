import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: "cliente" | "admin";
}

type AuthResult = { ok: true; user: AuthUser } | { ok: false; erro: string };

interface UsuarioRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  role: "cliente" | "admin";
}

async function verificarLogin(email: string, senha: string): Promise<AuthResult> {
  const pool = getPool();
  const [rows] = await pool.query<UsuarioRow[]>(
    "SELECT id, nome, email, senha_hash, role FROM usuarios WHERE email = ? LIMIT 1",
    [email],
  );
  const row = rows[0];
  if (!row || !(await bcrypt.compare(senha, row.senha_hash))) {
    return { ok: false, erro: "e-mail ou senha incorretos." };
  }
  return { ok: true, user: { id: row.id, nome: row.nome, email: row.email, role: row.role } };
}

export const signUp = createServerFn({ method: "POST" })
  .validator((data: { nome: string; email: string; senha: string }) => data)
  .handler(async ({ data }): Promise<AuthResult> => {
    const nome = data.nome.trim();
    const email = data.email.trim().toLowerCase();
    if (!nome || !email || data.senha.length < 4) {
      return {
        ok: false,
        erro: "preenche nome, e-mail e uma senha com pelo menos 4 caracteres.",
      };
    }

    const pool = getPool();
    const [existing] = await pool.query<UsuarioRow[]>(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );
    if (existing[0]) {
      return { ok: false, erro: "já existe uma conta com esse e-mail. tenta entrar." };
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
      [nome, email, senhaHash],
    );
    return { ok: true, user: { id: result.insertId, nome, email, role: "cliente" } };
  });

export const login = createServerFn({ method: "POST" })
  .validator((data: { email: string; senha: string }) => data)
  .handler(async ({ data }): Promise<AuthResult> => {
    return verificarLogin(data.email.trim().toLowerCase(), data.senha);
  });

const DEMO_EMAIL = "teste@soft.com";
const DEMO_SENHA = "teste1234";

export const loginDemo = createServerFn({ method: "POST" }).handler(
  async (): Promise<AuthResult> => {
    return verificarLogin(DEMO_EMAIL, DEMO_SENHA);
  },
);

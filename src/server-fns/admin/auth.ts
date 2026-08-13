import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import {
  createAdminSession,
  destroyAdminSession,
  readAdminSession,
  type AdminUser,
} from "./session";

type AdminLoginResult = { ok: true; admin: AdminUser } | { ok: false; erro: string };

interface AdminRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
}

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { email: string; senha: string }) => data)
  .handler(async ({ data }): Promise<AdminLoginResult> => {
    const email = data.email.trim().toLowerCase();
    const pool = getPool();
    const [rows] = await pool.query<AdminRow[]>(
      "SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ? AND role = 'admin' LIMIT 1",
      [email],
    );
    const row = rows[0];
    if (!row || !(await bcrypt.compare(data.senha, row.senha_hash))) {
      return { ok: false, erro: "e-mail ou senha incorretos." };
    }
    await createAdminSession(row.id);
    return { ok: true, admin: { id: row.id, nome: row.nome, email: row.email } };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async (): Promise<void> => {
  await destroyAdminSession();
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ admin: AdminUser | null }> => {
    return { admin: await readAdminSession() };
  },
);

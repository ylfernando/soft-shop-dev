import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/server/db";
import { enviarEmailVerificacao, enviarEmailRedefinicaoSenha } from "@/server/email";
import { limparCpf, validarCpf } from "@/lib/cpf";
import { limparTelefone } from "@/lib/telefone";
import { createUserSession, destroyUserSession, requireUser } from "./session";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: "cliente" | "admin";
  cep: string;
  emailVerificado: boolean;
}

export interface EnderecoInput {
  telefone?: string;
  cpf?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface PerfilCompleto {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  emailVerificado: boolean;
}

type AuthResult = { ok: true; user: AuthUser } | { ok: false; erro: string };

const TOKEN_VALIDADE_HORAS = 24;
const SENHA_RESET_VALIDADE_HORAS = 1;

function gerarTokenVerificacao() {
  return { token: randomBytes(32).toString("hex"), horasValidade: TOKEN_VALIDADE_HORAS };
}

/** Normaliza os campos opcionais de endereço/contato e valida o CPF (quando
 * informado) — usada tanto no cadastro quanto na edição de perfil, os dois
 * únicos lugares que aceitam esses dados vindos do cliente. */
function normalizarEndereco(
  data: EnderecoInput,
): { ok: true; valores: Required<EnderecoInput> } | { ok: false; erro: string } {
  const cpf = data.cpf ? limparCpf(data.cpf) : "";
  if (cpf && !validarCpf(cpf)) {
    return { ok: false, erro: "esse CPF não é válido." };
  }
  const cep = data.cep ? data.cep.replace(/\D/g, "").slice(0, 8) : "";
  if (cep && cep.length !== 8) {
    return { ok: false, erro: "esse CEP não é válido." };
  }
  return {
    ok: true,
    valores: {
      telefone: data.telefone ? limparTelefone(data.telefone) : "",
      cpf,
      cep,
      logradouro: data.logradouro?.trim() ?? "",
      numero: data.numero?.trim() ?? "",
      complemento: data.complemento?.trim() ?? "",
      bairro: data.bairro?.trim() ?? "",
      cidade: data.cidade?.trim() ?? "",
      uf: data.uf?.trim().toUpperCase().slice(0, 2) ?? "",
    },
  };
}

interface UsuarioRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  role: "cliente" | "admin";
  cep: string | null;
  email_verificado_em: Date | null;
}

function paraAuthUser(row: UsuarioRow): AuthUser {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    role: row.role,
    cep: row.cep ?? "",
    emailVerificado: row.email_verificado_em !== null,
  };
}

async function verificarLogin(email: string, senha: string): Promise<AuthResult> {
  const pool = getPool();
  const [rows] = await pool.query<UsuarioRow[]>(
    "SELECT id, nome, email, senha_hash, role, cep, email_verificado_em FROM usuarios WHERE email = ? LIMIT 1",
    [email],
  );
  const row = rows[0];
  if (!row || !(await bcrypt.compare(senha, row.senha_hash))) {
    return { ok: false, erro: "e-mail ou senha incorretos." };
  }
  return { ok: true, user: paraAuthUser(row) };
}

export const signUp = createServerFn({ method: "POST" })
  .validator((data: { nome: string; email: string; senha: string } & EnderecoInput) => data)
  .handler(async ({ data }): Promise<AuthResult> => {
    const nome = data.nome.trim();
    const email = data.email.trim().toLowerCase();
    if (!nome || !email || data.senha.length < 4) {
      return {
        ok: false,
        erro: "preenche nome, e-mail e uma senha com pelo menos 4 caracteres.",
      };
    }
    const endereco = normalizarEndereco(data);
    if (!endereco.ok) return endereco;

    const pool = getPool();
    const [existing] = await pool.query<UsuarioRow[]>(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );
    if (existing[0]) {
      return { ok: false, erro: "já existe uma conta com esse e-mail. tenta entrar." };
    }
    if (endereco.valores.cpf) {
      const [cpfExistente] = await pool.query<UsuarioRow[]>(
        "SELECT id FROM usuarios WHERE cpf = ? LIMIT 1",
        [endereco.valores.cpf],
      );
      if (cpfExistente[0]) {
        return { ok: false, erro: "já existe uma conta com esse CPF." };
      }
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);
    const { token, horasValidade } = gerarTokenVerificacao();
    const v = endereco.valores;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO usuarios
        (nome, email, senha_hash, telefone, cpf, cep, logradouro, numero, complemento, bairro, cidade, uf,
         email_verificacao_token, email_verificacao_expira)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [
        nome,
        email,
        senhaHash,
        v.telefone || null,
        v.cpf || null,
        v.cep || null,
        v.logradouro || null,
        v.numero || null,
        v.complemento || null,
        v.bairro || null,
        v.cidade || null,
        v.uf || null,
        token,
        horasValidade,
      ],
    );
    await createUserSession(result.insertId);

    try {
      await enviarEmailVerificacao(email, nome, token);
    } catch (error) {
      // Conta já foi criada e a cliente já está logada — a verificação é só
      // pré-requisito pra comprar, então um e-mail que falhou não deve
      // travar o cadastro. Ela pode pedir reenvio depois em minha-conta.
      console.error("erro enviando e-mail de verificação no cadastro:", error);
    }

    return {
      ok: true,
      user: {
        id: result.insertId,
        nome,
        email,
        role: "cliente",
        cep: v.cep,
        emailVerificado: false,
      },
    };
  });

export const login = createServerFn({ method: "POST" })
  .validator((data: { email: string; senha: string }) => data)
  .handler(async ({ data }): Promise<AuthResult> => {
    const res = await verificarLogin(data.email.trim().toLowerCase(), data.senha);
    if (res.ok) await createUserSession(res.user.id);
    return res;
  });

const DEMO_EMAIL = "teste@soft.com";
const DEMO_SENHA = "teste1234";

export const loginDemo = createServerFn({ method: "POST" }).handler(
  async (): Promise<AuthResult> => {
    const res = await verificarLogin(DEMO_EMAIL, DEMO_SENHA);
    if (res.ok) await createUserSession(res.user.id);
    return res;
  },
);

export const logout = createServerFn({ method: "POST" }).handler(async (): Promise<void> => {
  await destroyUserSession();
});

export const atualizarConta = createServerFn({ method: "POST" })
  .validator((data: { nome: string; email: string } & EnderecoInput) => data)
  .handler(async ({ data }): Promise<AuthResult> => {
    const user = await requireUser();
    const nome = data.nome.trim();
    const email = data.email.trim().toLowerCase();
    if (!nome || !email) {
      return { ok: false, erro: "preenche nome e e-mail." };
    }
    const endereco = normalizarEndereco(data);
    if (!endereco.ok) return endereco;

    const pool = getPool();
    const [existing] = await pool.query<UsuarioRow[]>(
      "SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1",
      [email, user.id],
    );
    if (existing[0]) {
      return { ok: false, erro: "já existe uma conta com esse e-mail." };
    }
    if (endereco.valores.cpf) {
      const [cpfExistente] = await pool.query<UsuarioRow[]>(
        "SELECT id FROM usuarios WHERE cpf = ? AND id <> ? LIMIT 1",
        [endereco.valores.cpf, user.id],
      );
      if (cpfExistente[0]) {
        return { ok: false, erro: "já existe uma conta com esse CPF." };
      }
    }

    const v = endereco.valores;
    const emailMudou = email !== user.email;

    if (emailMudou) {
      // Se deixasse o e-mail trocar sem reabrir a verificação, dava pra
      // verificar um e-mail e depois trocar pra qualquer outro mantendo o
      // status de verificado — o que anula o propósito da verificação.
      const { token, horasValidade } = gerarTokenVerificacao();
      await pool.query(
        `UPDATE usuarios
         SET nome = ?, email = ?, telefone = ?, cpf = ?, cep = ?, logradouro = ?, numero = ?,
             complemento = ?, bairro = ?, cidade = ?, uf = ?,
             email_verificado_em = NULL, email_verificacao_token = ?,
             email_verificacao_expira = DATE_ADD(NOW(), INTERVAL ? HOUR)
         WHERE id = ?`,
        [
          nome,
          email,
          v.telefone || null,
          v.cpf || null,
          v.cep || null,
          v.logradouro || null,
          v.numero || null,
          v.complemento || null,
          v.bairro || null,
          v.cidade || null,
          v.uf || null,
          token,
          horasValidade,
          user.id,
        ],
      );
      try {
        await enviarEmailVerificacao(email, nome, token);
      } catch (error) {
        console.error("erro enviando e-mail de verificação após troca de e-mail:", error);
      }
    } else {
      await pool.query(
        `UPDATE usuarios
         SET nome = ?, email = ?, telefone = ?, cpf = ?, cep = ?, logradouro = ?, numero = ?,
             complemento = ?, bairro = ?, cidade = ?, uf = ?
         WHERE id = ?`,
        [
          nome,
          email,
          v.telefone || null,
          v.cpf || null,
          v.cep || null,
          v.logradouro || null,
          v.numero || null,
          v.complemento || null,
          v.bairro || null,
          v.cidade || null,
          v.uf || null,
          user.id,
        ],
      );
    }

    return {
      ok: true,
      user: {
        ...user,
        nome,
        email,
        cep: v.cep,
        emailVerificado: emailMudou ? false : user.emailVerificado,
      },
    };
  });

export const alterarSenha = createServerFn({ method: "POST" })
  .validator((data: { senhaAtual: string; novaSenha: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; erro: string }> => {
    const user = await requireUser();
    if (data.novaSenha.length < 4) {
      return { ok: false, erro: "a nova senha precisa ter pelo menos 4 caracteres." };
    }

    const pool = getPool();
    const [rows] = await pool.query<UsuarioRow[]>(
      "SELECT senha_hash FROM usuarios WHERE id = ? LIMIT 1",
      [user.id],
    );
    const row = rows[0];
    if (!row || !(await bcrypt.compare(data.senhaAtual, row.senha_hash))) {
      return { ok: false, erro: "senha atual incorreta." };
    }

    const senhaHash = await bcrypt.hash(data.novaSenha, 10);
    await pool.query("UPDATE usuarios SET senha_hash = ? WHERE id = ?", [senhaHash, user.id]);
    return { ok: true };
  });

interface PerfilRow extends RowDataPacket {
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  email_verificado_em: Date | null;
}

/** Dados completos do perfil (telefone/CPF/endereço) pra preencher o
 * formulário de "meus dados" — a sessão guarda só um subconjunto mínimo
 * (AuthUser), então minha-conta busca o resto sob demanda. */
export const getMeuPerfil = createServerFn({ method: "GET" }).handler(
  async (): Promise<PerfilCompleto> => {
    const user = await requireUser();
    const pool = getPool();
    const [rows] = await pool.query<PerfilRow[]>(
      `SELECT nome, email, telefone, cpf, cep, logradouro, numero, complemento, bairro, cidade, uf,
              email_verificado_em
       FROM usuarios WHERE id = ? LIMIT 1`,
      [user.id],
    );
    const row = rows[0];
    if (!row) throw new Error("perfil não encontrado.");
    return {
      nome: row.nome,
      email: row.email,
      telefone: row.telefone ?? "",
      cpf: row.cpf ?? "",
      cep: row.cep ?? "",
      logradouro: row.logradouro ?? "",
      numero: row.numero ?? "",
      complemento: row.complemento ?? "",
      bairro: row.bairro ?? "",
      cidade: row.cidade ?? "",
      uf: row.uf ?? "",
      emailVerificado: row.email_verificado_em !== null,
    };
  },
);

type VerificacaoResult = { ok: true } | { ok: false; erro: string };

interface TokenRow extends RowDataPacket {
  id: number;
  email_verificacao_expira: Date | null;
}

/** Chamada pela tela /verificar-email quando a cliente clica no link do
 * e-mail — o token é de uso único (é limpo assim que confirma). */
export const confirmarVerificacaoEmail = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }): Promise<VerificacaoResult> => {
    const pool = getPool();
    const [rows] = await pool.query<TokenRow[]>(
      "SELECT id, email_verificacao_expira FROM usuarios WHERE email_verificacao_token = ? LIMIT 1",
      [data.token],
    );
    const row = rows[0];
    if (!row) {
      return { ok: false, erro: "link inválido ou já usado." };
    }
    if (!row.email_verificacao_expira || row.email_verificacao_expira.getTime() < Date.now()) {
      return { ok: false, erro: "esse link expirou — peça um novo e-mail de verificação." };
    }

    await pool.query(
      "UPDATE usuarios SET email_verificado_em = NOW(), email_verificacao_token = NULL, email_verificacao_expira = NULL WHERE id = ?",
      [row.id],
    );
    return { ok: true };
  });

/** Reenvia o e-mail de verificação pra cliente logada — usado tanto no
 * banner de minha-conta quanto no aviso de checkout bloqueado. */
export const reenviarVerificacaoEmail = createServerFn({ method: "POST" }).handler(
  async (): Promise<VerificacaoResult> => {
    const user = await requireUser();
    if (user.emailVerificado) {
      return { ok: false, erro: "seu e-mail já está verificado." };
    }

    const pool = getPool();
    const { token, horasValidade } = gerarTokenVerificacao();
    await pool.query(
      "UPDATE usuarios SET email_verificacao_token = ?, email_verificacao_expira = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE id = ?",
      [token, horasValidade, user.id],
    );

    try {
      await enviarEmailVerificacao(user.email, user.nome, token);
    } catch {
      return { ok: false, erro: "não deu pra enviar o e-mail agora, tenta de novo em instantes." };
    }
    return { ok: true };
  },
);

interface SenhaResetRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
}

/** Chamada pela tela /esqueci-senha. Sempre responde com sucesso, exista ou
 * não uma conta com esse e-mail — senão dava pra usar esse endpoint pra
 * descobrir quais e-mails têm conta só testando um por um. */
export const solicitarRedefinicaoSenha = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const email = data.email.trim().toLowerCase();
    const pool = getPool();
    const [rows] = await pool.query<SenhaResetRow[]>(
      "SELECT id, nome, email FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );
    const row = rows[0];
    if (row) {
      const token = randomBytes(32).toString("hex");
      await pool.query(
        "UPDATE usuarios SET senha_reset_token = ?, senha_reset_expira = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE id = ?",
        [token, SENHA_RESET_VALIDADE_HORAS, row.id],
      );
      try {
        await enviarEmailRedefinicaoSenha(row.email, row.nome, token);
      } catch (error) {
        console.error("erro enviando e-mail de redefinição de senha:", error);
      }
    }
    return { ok: true };
  });

interface SenhaResetTokenRow extends RowDataPacket {
  id: number;
  senha_reset_expira: Date | null;
}

/** Chamada pela tela /redefinir-senha quando a pessoa clica no link do
 * e-mail — o token é de uso único (é limpo assim que a senha é trocada). */
export const redefinirSenha = createServerFn({ method: "POST" })
  .validator((data: { token: string; novaSenha: string }) => data)
  .handler(async ({ data }): Promise<VerificacaoResult> => {
    if (data.novaSenha.length < 4) {
      return { ok: false, erro: "a nova senha precisa ter pelo menos 4 caracteres." };
    }

    const pool = getPool();
    const [rows] = await pool.query<SenhaResetTokenRow[]>(
      "SELECT id, senha_reset_expira FROM usuarios WHERE senha_reset_token = ? LIMIT 1",
      [data.token],
    );
    const row = rows[0];
    if (!row) {
      return { ok: false, erro: "link inválido ou já usado." };
    }
    if (!row.senha_reset_expira || row.senha_reset_expira.getTime() < Date.now()) {
      return { ok: false, erro: "esse link expirou — peça uma nova redefinição de senha." };
    }

    const senhaHash = await bcrypt.hash(data.novaSenha, 10);
    await pool.query(
      "UPDATE usuarios SET senha_hash = ?, senha_reset_token = NULL, senha_reset_expira = NULL WHERE id = ?",
      [senhaHash, row.id],
    );
    return { ok: true };
  });

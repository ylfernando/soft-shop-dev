import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (d: unknown) => d;
    const builder = {
      validator(fn: (d: unknown) => unknown) {
        validate = fn;
        return builder;
      },
      handler(fn: (ctx: { data: unknown }) => unknown) {
        return (ctx?: { data: unknown }) => fn({ data: validate(ctx?.data) });
      },
    };
    return builder;
  },
}));

const mockPool = { query: vi.fn() };
vi.mock("@/server/db", () => ({ getPool: () => mockPool }));

const createUserSession = vi.fn();
const destroyUserSession = vi.fn();
vi.mock("./session", () => ({
  createUserSession: (...a: unknown[]) => createUserSession(...a),
  destroyUserSession: (...a: unknown[]) => destroyUserSession(...a),
}));

beforeEach(() => {
  vi.resetModules();
  mockPool.query.mockReset();
  createUserSession.mockReset();
  destroyUserSession.mockReset();
});

describe("signUp", () => {
  it("rejects a password shorter than 4 characters without ever touching the database", async () => {
    const { signUp } = await import("./auth");
    const res = await signUp({ data: { nome: "Ana", email: "ana@example.com", senha: "123" } });
    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/4 caracteres/) });
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it("rejects a blank name/email after trimming", async () => {
    const { signUp } = await import("./auth");
    const res = await signUp({ data: { nome: "   ", email: "  ", senha: "12345" } });
    expect(res.ok).toBe(false);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it("rejects signup for an email that already has an account, before creating a duplicate", async () => {
    mockPool.query.mockResolvedValueOnce([[{ id: 1 }]]); // existing row found
    const { signUp } = await import("./auth");

    const res = await signUp({
      data: { nome: "Ana", email: "ANA@Example.com", senha: "12345" },
    });

    expect(res).toEqual({ ok: false, erro: expect.stringMatching(/já existe/) });
    expect(mockPool.query).toHaveBeenCalledTimes(1); // only the existence check, no INSERT
  });

  it("stores a bcrypt hash, never the plaintext password", async () => {
    mockPool.query
      .mockResolvedValueOnce([[]]) // no existing user
      .mockResolvedValueOnce([{ insertId: 10 }]); // insert result
    const { signUp } = await import("./auth");

    await signUp({ data: { nome: "Ana", email: "ana@example.com", senha: "senha-real" } });

    const insertArgs = mockPool.query.mock.calls[1][1] as unknown[];
    const senhaHash = insertArgs[2] as string;
    expect(senhaHash).not.toBe("senha-real");
    await expect(bcrypt.compare("senha-real", senhaHash)).resolves.toBe(true);
  });
});

describe("login", () => {
  it("rejects an unknown email without leaking whether the account exists", async () => {
    mockPool.query.mockResolvedValue([[]]);
    const { login } = await import("./auth");

    const res = await login({ data: { email: "nobody@example.com", senha: "whatever" } });
    expect(res).toEqual({ ok: false, erro: "e-mail ou senha incorretos." });
  });

  it("rejects a wrong password against a real bcrypt hash, and never opens a session", async () => {
    const hash = await bcrypt.hash("senha-correta", 10);
    mockPool.query.mockResolvedValue([
      [{ id: 1, nome: "Ana", email: "ana@example.com", senha_hash: hash, role: "cliente" }],
    ]);
    const { login } = await import("./auth");

    const res = await login({ data: { email: "ana@example.com", senha: "senha-errada" } });
    expect(res).toEqual({ ok: false, erro: "e-mail ou senha incorretos." });
    expect(createUserSession).not.toHaveBeenCalled();
  });

  it("accepts the right password and opens a session for that user id", async () => {
    const hash = await bcrypt.hash("senha-correta", 10);
    mockPool.query.mockResolvedValue([
      [{ id: 1, nome: "Ana", email: "ana@example.com", senha_hash: hash, role: "cliente" }],
    ]);
    const { login } = await import("./auth");

    const res = await login({ data: { email: "ana@example.com", senha: "senha-correta" } });
    expect(res).toEqual({
      ok: true,
      user: { id: 1, nome: "Ana", email: "ana@example.com", role: "cliente" },
    });
    expect(createUserSession).toHaveBeenCalledWith(1);
  });
});

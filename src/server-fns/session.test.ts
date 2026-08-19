import { describe, expect, it, vi, beforeEach } from "vitest";

const getSession = vi.fn();
const updateSession = vi.fn();
const clearSession = vi.fn();
vi.mock("@tanstack/react-start/server", () => ({ getSession, updateSession, clearSession }));

const mockPool = { query: vi.fn() };
vi.mock("@/server/db", () => ({ getPool: () => mockPool }));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  getSession.mockReset();
  updateSession.mockReset();
  clearSession.mockReset();
  mockPool.query.mockReset();
  process.env = { ...ORIGINAL_ENV, SESSION_SECRET: "a".repeat(32) };
});

describe("customer session (session.ts)", () => {
  it("refuses to build a session config when SESSION_SECRET is missing or too short", async () => {
    process.env.SESSION_SECRET = "too-short";
    const { requireUser } = await import("./session");
    await expect(requireUser()).rejects.toThrow(/SESSION_SECRET/);
  });

  it("requireUser throws instead of returning a guest identity", async () => {
    getSession.mockResolvedValue({ data: {} });
    const { requireUser } = await import("./session");
    await expect(requireUser()).rejects.toThrow(/não autorizado/);
  });

  it("requireUser resolves the real DB row for the session's user id, never trusting a client-supplied user object", async () => {
    getSession.mockResolvedValue({ data: { usuarioId: 5 } });
    mockPool.query.mockResolvedValue([
      [
        {
          id: 5,
          nome: "Ana",
          email: "ana@example.com",
          role: "cliente",
          cep: "01001000",
          cpf: "12345678901",
          emailVerificadoEm: new Date(),
        },
      ],
    ]);
    const { requireUser } = await import("./session");

    const user = await requireUser();
    expect(user).toEqual({
      id: 5,
      nome: "Ana",
      email: "ana@example.com",
      role: "cliente",
      cep: "01001000",
      cpf: "12345678901",
      emailVerificado: true,
    });
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE id = ?"), [5]);
  });

  it("readUserSession returns null (not throw) when the session's user id was deleted from the DB", async () => {
    getSession.mockResolvedValue({ data: { usuarioId: 999 } });
    mockPool.query.mockResolvedValue([[]]);
    const { readUserSession } = await import("./session");

    await expect(readUserSession()).resolves.toBeNull();
  });
});

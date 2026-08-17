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
  process.env = { ...ORIGINAL_ENV, ADMIN_SESSION_SECRET: "b".repeat(32) };
});

describe("admin session (admin/session.ts)", () => {
  it("uses a distinct cookie name from the customer session, so one leak can't authenticate the other", async () => {
    getSession.mockResolvedValue({ data: {} });
    const { requireAdmin } = await import("./session");
    await expect(requireAdmin()).rejects.toThrow();
    expect(getSession).toHaveBeenCalledWith(expect.objectContaining({ name: "admin_session" }));
  });

  it("requireAdmin throws when unauthenticated instead of falling through", async () => {
    getSession.mockResolvedValue({ data: {} });
    const { requireAdmin } = await import("./session");
    await expect(requireAdmin()).rejects.toThrow(/não autorizado/);
  });

  it("readAdminSession's lookup query is scoped to role='admin', so a customer id in this cookie can never resolve to an admin", async () => {
    getSession.mockResolvedValue({ data: { adminId: 5 } });
    mockPool.query.mockResolvedValue([[]]); // simulates: id 5 exists but isn't an admin
    const { readAdminSession } = await import("./session");

    const admin = await readAdminSession();
    expect(admin).toBeNull();
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("role = 'admin'"), [5]);
  });

  it("sets an 8-hour session lifetime, shorter than the 30-day customer session", async () => {
    getSession.mockResolvedValue({ data: {} });
    const { requireAdmin } = await import("./session");
    await expect(requireAdmin()).rejects.toThrow();
    const config = getSession.mock.calls[0][0];
    expect(config.maxAge).toBe(60 * 60 * 8);
  });
});

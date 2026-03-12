// tests/db.connection.test.js
const { sequelize } = require("../models");

describe("Database connection (Sequelize)", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
  });

  afterAll(async () => {
    // Close quietly so Jest exits cleanly, but don't blow up if already closed
    try { await sequelize.close(); } catch (_) {}
  });

  test("can authenticate", async () => {
    await expect(sequelize.authenticate()).resolves.toBeUndefined();
  });

  test("can run a simple SELECT", async () => {
    const [rows] = await sequelize.query("SELECT 1+1 AS result");
    // Different drivers may shape rows slightly; normalize:
    const first = Array.isArray(rows) ? rows[0] : rows;
    const val = first?.result ?? first?.RESULT ?? Object.values(first || {})[0];
    expect(Number(val)).toBe(2);
  });

  test("can start and rollback a transaction", async () => {
    const t = await sequelize.transaction();
    try {
      await sequelize.query("SELECT 42 AS answer", { transaction: t });
      await t.rollback(); // nothing persisted
      expect(true).toBe(true);
    } catch (err) {
      // ensure rollback on failure, then rethrow
      try { await t.rollback(); } catch (_) {}
      throw err;
    }
  });
});

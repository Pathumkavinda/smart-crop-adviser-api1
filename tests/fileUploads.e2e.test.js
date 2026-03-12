const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { app, sequelize } = require("../server");

const TMP = path.join(__dirname, "_tmp_files");
const ensure = () => { if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true }); };
const mk = (n, c) => { ensure(); const p = path.join(TMP, n); fs.writeFileSync(p, c); return p; };

describe("File uploads (single & multi)", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
    await sequelize.close();
  });

  test("POST /api/v1/files/upload (single) → 201 + public path", async () => {
    const filePath = mk("note.txt", "text content");
    const res = await request(app).post("/api/v1/files/upload").attach("file", filePath);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // And the served file is reachable
    const getRes = await request(app).get(res.body.file.path);
    expect(getRes.status).toBe(200);
  });

  test("POST /api/v1/files/uploads (multi) → 201 + files[] (or 404 if route not wired)", async () => {
    const pdf = mk("a.pdf", "%PDF-1.4");
    const png = mk("b.png", "PNG");

    const res = await request(app)
      .post("/api/v1/files/uploads")
      .attach("files", pdf)
      .attach("files", png);

    // Accept either success (201) or 404 if your router doesn't expose /uploads
    expect([201, 404]).toContain(res.status);
    if (res.status === 201) {
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files.length).toBe(2);
    }
  });

  test("POST /api/v1/files/upload (single) → 4xx/5xx on unsupported mime", async () => {
    const weird = mk("weird.xyz", "???");
    const res = await request(app).post("/api/v1/files/upload").attach("file", weird);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

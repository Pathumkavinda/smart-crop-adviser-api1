const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { app, sequelize } = require("../server");
const { User } = require("../models");

const TMP_DIR = path.join(__dirname, "_tmp_userfiles");
const makeTmpFile = (name, contents = "%PDF-1.4") => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const p = path.join(TMP_DIR, name);
  fs.writeFileSync(p, contents);
  return p;
};

describe("User Files API (multipart)", () => {
  let farmer, adviser, fileId;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });

    farmer = await User.create({
      username: `farmer_${Date.now()}`,
      email: `farmer_${Date.now()}@ex.com`,
      password: "Password123",
      userlevel: "farmer",
    });

    adviser = await User.create({
      username: `adviser_${Date.now()}`,
      email: `adviser_${Date.now()}@ex.com`,
      password: "Password123",
      userlevel: "adviser",
    });
  });

  afterAll(async () => {
    try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
    await sequelize.close();
  });

  it("POST /api/v1/user-files -> 201 create (multipart file)", async () => {
    const tmp = makeTmpFile("soil_report.pdf");
    const res = await request(app)
      .post("/api/v1/user-files")
      .field("farmer_id", String(farmer.id))
      .field("adviser_id", String(adviser.id))
      .field("category", "soil-report")
      .field("notes", "Initial soil analysis")
      .attach("file", tmp);

    expect(res.status).toBe(201);
    expect(res.body.original_name).toBe("soil_report.pdf");
    expect(res.body.mime_type).toBe("application/pdf");
    expect(res.body.stored_name).toBeTruthy();
    fileId = res.body.id;
  });

  it("GET /api/v1/user-files/:id -> 200 read one", async () => {
    const res = await request(app).get(`/api/v1/user-files/${fileId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", fileId);
  });

  it("GET /api/v1/user-files -> 200 list + filters", async () => {
    const res = await request(app)
      .get("/api/v1/user-files")
      .query({ page: 1, limit: 10, farmer_id: farmer.id, q: "soil" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some(i => i.id === fileId)).toBe(true);
  });

  it("GET /api/v1/user-files/farmer/:farmer_id -> 200 by farmer", async () => {
    const res = await request(app).get(`/api/v1/user-files/farmer/${farmer.id}`).query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/user-files/adviser/:adviser_id -> 200 by adviser", async () => {
    const res = await request(app).get(`/api/v1/user-files/adviser/${adviser.id}`).query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
  });

  it("PUT /api/v1/user-files/:id -> 200 update (notes/category)", async () => {
    const res = await request(app).put(`/api/v1/user-files/${fileId}`).send({ notes: "Updated notes", category: "lab-report" });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe("Updated notes");
    expect(res.body.category).toBe("lab-report");
  });

  it("DELETE /api/v1/user-files/:id -> 200 delete", async () => {
    const res = await request(app).delete(`/api/v1/user-files/${fileId}`);
    expect(res.status).toBe(200);
    const gone = await request(app).get(`/api/v1/user-files/${fileId}`);
    expect(gone.status).toBe(404);
  });

  it("POST /api/v1/user-files -> 400 when required fields missing", async () => {
    const res = await request(app).post("/api/v1/user-files").send({ farmer_id: farmer.id });
    expect(res.status).toBe(400);
  });
});

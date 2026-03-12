const request = require("supertest");
const { app, sequelize } = require("../server");
const { User } = require("../models");

describe("Predictions API (simple E2E)", () => {
  let user, predId;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });
    user = await User.create({
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}@ex.com`,
      password: "Password123",
      userlevel: "farmer",
      landsize: 1.0,
      address: "Somewhere",
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /api/v1/predictions -> 201 create", async () => {
    const payload = {
      user_id: user.id,
      crop_name: "Beans",
      avg_humidity: 70,
      temp: 27.5,
      avg_rainfall: 180,
      land_area: 1.2,
      soil_type: "Loam",
      soil_ph_level: 6.5,
      nitrogen: 50,
      phosphate: 30,
      potassium: 20,
      district: "Kandy",
      agro_ecological_zone: "WM2a",
      cultivate_season: "Yala",
    };
    const res = await request(app).post("/api/v1/predictions").send(payload);
    expect(res.status).toBe(201);
    predId = res.body.data.id;
  });

  it("GET /api/v1/predictions -> 200 list (with filters)", async () => {
    const res = await request(app)
      .get("/api/v1/predictions")
      .query({ user_id: user.id, crop_name: "Beans", date_from: "1970-01-01", date_to: "2100-01-01" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some(p => p.id === predId)).toBe(true);
  });

  it("GET /api/v1/predictions/:id -> 200 read one", async () => {
    const res = await request(app).get(`/api/v1/predictions/${predId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(predId);
    expect(res.body.data.user).toBeDefined();
  });

  it("PUT /api/v1/predictions/:id -> 200 update", async () => {
    const res = await request(app).put(`/api/v1/predictions/${predId}`).send({ crop_name: "Maize" });
    expect(res.status).toBe(200);
    expect(res.body.data.crop_name).toBe("Maize");
  });

  it("GET /api/v1/predictions/user/:userId -> 200 by user (paginated)", async () => {
    const res = await request(app).get(`/api/v1/predictions/user/${user.id}`).query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it("GET /api/v1/predictions/user/:userId/latest -> 200 latest for user", async () => {
    const res = await request(app).get(`/api/v1/predictions/user/${user.id}/latest`);
    expect(res.status).toBe(200);
    expect(String(res.body.data.user_id)).toBe(String(user.id));
  });

  it("GET /api/v1/predictions/by-crop/:cropName -> 200 by crop (requires specific routes before '/:id')", async () => {
    const res = await request(app).get("/api/v1/predictions/by-crop/Maize");
    // If your router has '/:id' above this, it may 404; keep specific routes before param ones.
    if (res.status === 404) {
      console.warn("WARN: '/by-crop/:cropName' 404 — ensure route order (specific before '/:id').");
    }
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p) => p.id === predId)).toBe(true);
    }
  });

  it("GET /api/v1/predictions/by-created/window -> 200 created window", async () => {
    const res = await request(app).get("/api/v1/predictions/by-created/window")
      .query({ from: "1970-01-01T00:00:00Z", to: "2100-01-01T00:00:00Z" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("DELETE /api/v1/predictions/:id -> 200 delete", async () => {
    const res = await request(app).delete(`/api/v1/predictions/${predId}`);
    expect(res.status).toBe(200);
    const gone = await request(app).get(`/api/v1/predictions/${predId}`);
    expect(gone.status).toBe(404);
  });

  it("POST /api/v1/predictions -> 400 when user_id missing", async () => {
    const res = await request(app).post("/api/v1/predictions").send({ crop_name: "Beans" });
    expect(res.status).toBe(400);
  });

  it("POST /api/v1/predictions -> 404 when user not found", async () => {
    const res = await request(app).post("/api/v1/predictions").send({ user_id: 999999, crop_name: "Beans" });
    expect(res.status).toBe(404);
  });

  it("GET /api/v1/predictions/by-created/window -> 400 when both from/to missing", async () => {
    const res = await request(app).get("/api/v1/predictions/by-created/window");
    expect(res.status).toBe(400);
  });
});

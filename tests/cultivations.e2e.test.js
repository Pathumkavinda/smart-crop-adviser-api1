const request = require("supertest");
const { app, sequelize } = require("../server");
const { User } = require("../models");

describe("Cultivations API (simple E2E)", () => {
  let user, id;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });

    user = await User.create({
      username: `u_${Date.now()}`,
      email: `u_${Date.now()}@ex.com`,
      password: "Password123",
      userlevel: "farmer",
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /api/v1/cultivations -> 201 create", async () => {
    const res = await request(app).post("/api/v1/cultivations").send({
      user_id: user.id,
      crop: "Beans",
      location: "Field 123",
      land_size: 2,
      status: "planning",
      planning_date: "2025-09-01",
      expected_harvest_date: "2025-12-04",
      note: "Irrigation plan",
    });
    expect(res.status).toBe(201);
    id = res.body.id;
  });

  it("GET /api/v1/cultivations/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/cultivations/${id}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/cultivations -> 200 list + filters", async () => {
    const res = await request(app)
      .get("/api/v1/cultivations")
      .query({
        page: 1, limit: 10,
        user_id: user.id,
        crop: "Be",
        status: "planning",
        plan_from: "2025-08-01",
        plan_to: "2025-09-30",
        harvest_from: "2025-11-01",
        harvest_to: "2025-12-31",
        q: "Irrigation",
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("PUT /api/v1/cultivations/:id -> 200", async () => {
    const res = await request(app).put(`/api/v1/cultivations/${id}`).send({ status: "active" });
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/cultivations/user/:userId -> 200", async () => {
    const res = await request(app).get(`/api/v1/cultivations/user/${user.id}`);
    expect(res.status).toBe(200);
  });

  it("DELETE /api/v1/cultivations/:id -> 200", async () => {
    const res = await request(app).delete(`/api/v1/cultivations/${id}`);
    expect(res.status).toBe(200);
    const gone = await request(app).get(`/api/v1/cultivations/${id}`);
    expect(gone.status).toBe(404);
  });

  it("POST /api/v1/cultivations -> 400 missing fields", async () => {
    const res = await request(app).post("/api/v1/cultivations").send({});
    expect(res.status).toBe(400);
  });
});

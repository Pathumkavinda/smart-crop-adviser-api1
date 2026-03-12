const request = require("supertest");
const { app, sequelize } = require("../server");

describe("Users API (simple)", () => {
  let createdId;
  const email = `u_${Date.now()}@ex.com`;
  const password = "Password123";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /api/v1/users -> 201 create", async () => {
    const res = await request(app).post("/api/v1/users").send({
      username: "testuser",
      email,
      password,
      userlevel: "farmer",
      landsize: 0,
      address: "Somewhere",
    });
    expect(res.status).toBe(201);
    expect(res.body.success ?? true).toBeTruthy();
    createdId = res.body.data?.id || res.body.id || res.body.data?.user?.id;
    expect(createdId).toBeTruthy();
  });

  it("POST /api/v1/users/login -> 200 login", async () => {
    const res = await request(app).post("/api/v1/users/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.success ?? true).toBeTruthy();
  });

  it("GET /api/v1/users/:id -> 200 fetch", async () => {
    const res = await request(app).get(`/api/v1/users/${createdId}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/users -> 200 list", async () => {
    const res = await request(app).get("/api/v1/users").query({ page: 1, limit: 5 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data ?? res.body)).toBe(true);
  });
});

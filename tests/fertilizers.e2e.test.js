const request = require("supertest");
const { app, sequelize } = require("../server");
const { User, Fertilizer } = require("../models");

describe("Fertilizers API (simple happy path)", () => {
  let user;
  let fertId;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });

    user = await User.create({
      username: `u_${Date.now()}`,
      email: `u_${Date.now()}@ex.com`,
      password: "Password123",
      userlevel: "farmer",
      landsize: 2.5,
      address: "Somewhere",
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /api/v1/fertilizers -> 201 create", async () => {
    const body = {
      user_id: user.id,
      crop: "Maize",
      fertilizer_name: "Urea",
      fertilizer_type: "N",
      application_date: "2025-09-01",
      next_application_date: "2025-09-10",
      quantity: 50,
      application_method: "Broadcast",
      location: "Kandy",
      land_size: 1.2,
      note: "Apply after rain",
    };

    const res = await request(app).post("/api/v1/fertilizers").send(body);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    fertId = res.body.id;
  });

  it("GET /api/v1/fertilizers/:id -> 200 read one", async () => {
    const res = await request(app).get(`/api/v1/fertilizers/${fertId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", fertId);
  });

  it("GET /api/v1/fertilizers -> 200 list + filters (robust)", async () => {
    // add a second row
    await Fertilizer.create({
      user_id: user.id,
      crop: "Beans",
      fertilizer_name: "TSP",
      fertilizer_type: "P",
      application_date: new Date("2025-08-01"),
      quantity: 25,
    });

    // use *light* filters to avoid DB/locale edge cases
    const res = await request(app)
      .get("/api/v1/fertilizers")
      .query({
        page: 1,
        limit: 10,
        user_id: user.id,
        date_from: "1970-01-01",
        date_to: "2100-01-01",
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // ensure our first record is present
    expect(res.body.data.some(x => x.id === fertId)).toBe(true);
  });

  it("PUT /api/v1/fertilizers/:id -> 200 update", async () => {
    const res = await request(app)
      .put(`/api/v1/fertilizers/${fertId}`)
      .send({ quantity: 60, note: "Updated note" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", fertId);
    // DECIMAL can serialize as "60.00" – compare numerically
    expect(Number(res.body.quantity)).toBe(60);
    expect(res.body).toHaveProperty("note", "Updated note");
  });

  it("GET /api/v1/fertilizers/user/:user_id -> 200 by user", async () => {
    const res = await request(app).get(`/api/v1/fertilizers/user/${user.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("DELETE /api/v1/fertilizers/:id -> 200 delete", async () => {
    const res = await request(app).delete(`/api/v1/fertilizers/${fertId}`);
    expect(res.status).toBe(200);

    const gone = await request(app).get(`/api/v1/fertilizers/${fertId}`);
    expect(gone.status).toBe(404);
  });

  it("POST /api/v1/fertilizers -> 400 missing fields", async () => {
    const res = await request(app).post("/api/v1/fertilizers").send({ user_id: user.id });
    expect(res.status).toBe(400);
  });
});

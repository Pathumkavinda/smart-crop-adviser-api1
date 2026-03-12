const request = require("supertest");
const { app, sequelize } = require("../server");
const { User } = require("../models");

describe("Appointments API (simple E2E)", () => {
  let farmer, adviser, apptId;

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
    await sequelize.close();
  });

  it("POST /api/v1/appointments -> 201 create", async () => {
    const res = await request(app).post("/api/v1/appointments").send({
      farmer_id: farmer.id,
      adviser_id: adviser.id,
      subject: "Field visit",
      appointment_date: "2025-09-15T09:00:00Z",
      duration_minutes: 30,
      location: "Plot A",
      message: "Please bring soil kit",
    });
    expect(res.status).toBe(201);
    apptId = res.body.id;
  });

  it("GET /api/v1/appointments/:id -> 200 read one", async () => {
    const res = await request(app).get(`/api/v1/appointments/${apptId}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/appointments -> 200 list + filters", async () => {
    const res = await request(app)
      .get("/api/v1/appointments")
      .query({
        page: 1, limit: 10,
        farmer_id: farmer.id,
        status: "pending",
        date_from: "2025-09-01",
        date_to: "2025-09-30",
        q: "Field",
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("PUT /api/v1/appointments/:id -> 200 update", async () => {
    const res = await request(app).put(`/api/v1/appointments/${apptId}`).send({
      appointment_status: "confirmed",
    });
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/appointments/farmer/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/appointments/farmer/${farmer.id}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/appointments/adviser/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/appointments/adviser/${adviser.id}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/appointments/user/:id -> 200", async () => {
    const res = await request(app).get(`/api/v1/appointments/user/${farmer.id}`);
    expect(res.status).toBe(200);
  });

  it("DELETE /api/v1/appointments/:id -> 200 delete", async () => {
    const res = await request(app).delete(`/api/v1/appointments/${apptId}`);
    expect(res.status).toBe(200);
    const gone = await request(app).get(`/api/v1/appointments/${apptId}`);
    expect(gone.status).toBe(404);
  });

  it("POST /api/v1/appointments -> 400 missing fields", async () => {
    const res = await request(app).post("/api/v1/appointments").send({});
    expect(res.status).toBe(400);
  });
});

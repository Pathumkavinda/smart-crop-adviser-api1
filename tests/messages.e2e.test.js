const request = require("supertest");
const { app, sequelize } = require("../server");
const { User, Message } = require("../models");

describe("Messages API (simple E2E)", () => {
  let alice, bob;
  let dmId;
  let roomMsgId;
  const room = "agronomy-room";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });

    alice = await User.create({
      username: `alice_${Date.now()}`,
      email: `alice_${Date.now()}@ex.com`,
      password: "Password123",
      userlevel: "farmer",
    });

    bob = await User.create({
      username: `bob_${Date.now()}`,
      email: `bob_${Date.now()}@ex.com`,
      password: "Password123",
      userlevel: "adviser",
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("POST /api/v1/messages (DM text) -> 201", async () => {
    const res = await request(app).post("/api/v1/messages").send({
      sender_id: alice.id,
      receiver_id: bob.id,
      text: "Hello Bob!",
    });
    expect(res.status).toBe(201);
    dmId = res.body.data.id;
  });

  it("GET /api/v1/messages/thread -> 200", async () => {
    const res = await request(app)
      .get("/api/v1/messages/thread")
      .query({ userA: alice.id, userB: bob.id, page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.some(m => m.id === dmId)).toBe(true);
  });

  it("POST /api/v1/messages (DM with files only) -> 201", async () => {
    const res = await request(app).post("/api/v1/messages").send({
      sender_id: bob.id,
      receiver_id: alice.id,
      files: [
        { path: "uploads/demo.txt", original_name: "demo.txt", mime_type: "text/plain", size_bytes: 12 },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.files.length).toBe(1);
  });

  it("POST /api/v1/messages (room text) -> 201", async () => {
    const res = await request(app).post("/api/v1/messages").send({
      sender_id: alice.id,
      room,
      text: "Hello room!",
    });
    expect(res.status).toBe(201);
    roomMsgId = res.body.data.id;
  });

  it("GET /api/v1/messages/room/:room -> 200", async () => {
    const res = await request(app).get(`/api/v1/messages/room/${room}`).query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.some(m => m.id === roomMsgId)).toBe(true);
  });

  it("GET /api/v1/messages/user/:userId -> 200", async () => {
    const res = await request(app).get(`/api/v1/messages/user/${alice.id}`).query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
  });

  it("PATCH /api/v1/messages/:id/delivered -> 200", async () => {
    const res = await request(app).patch(`/api/v1/messages/${dmId}/delivered`);
    expect(res.status).toBe(200);
    const inDb = await Message.findByPk(dmId);
    expect(inDb.delivered_at).not.toBeNull();
  });

  it("PATCH /api/v1/messages/:id/read -> 200", async () => {
    const res = await request(app).patch(`/api/v1/messages/${dmId}/read`);
    expect(res.status).toBe(200);
    const inDb = await Message.findByPk(dmId);
    expect(inDb.read_at).not.toBeNull();
  });

  it("POST /api/v1/messages -> 400 when missing receiver_id AND room", async () => {
    const res = await request(app).post("/api/v1/messages").send({ sender_id: alice.id, text: "no target" });
    expect(res.status).toBe(400);
  });

  it("POST /api/v1/messages -> 400 when missing text/files", async () => {
    const res = await request(app).post("/api/v1/messages").send({ sender_id: alice.id, receiver_id: bob.id });
    expect(res.status).toBe(400);
  });
});

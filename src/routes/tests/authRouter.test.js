const request = require("supertest");
const app = require("../../service");
const { Role, DB } = require("../../database/database.js");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let adminAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;

  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  adminAuthToken = loginRes.body.token;

  expectValidJwt(testUserAuthToken);
  expectValidJwt(adminAuthToken);
});

//test login endpoint
test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

//test logout endpoint
test("logout", async () => {
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(logoutRes.status).toBe(200);

  const expectedResponse = { message: "logout successful" };
  expect(logoutRes.body).toMatchObject(expectedResponse);
});

//test updateUser endpoint
test("updateUser", async () => {
  const updateUserResult = await request(app)
    .put("/api/auth/12345")
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  const updateUserSuccess = await request(app)
    .put("/api/auth/1")
    .send({ email: "nice@gmail.com", password: "yea" })
    .set("Authorization", `Bearer ${adminAuthToken}`);

  expect(updateUserResult.status).toBe(401);
  expect(updateUserSuccess.status).toBe(200);
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}

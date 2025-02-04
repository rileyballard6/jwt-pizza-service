const request = require("supertest");
const app = require("../../service");
const { Role, DB } = require("../../database/database.js");


const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);
});

//test getMenu endpoint
test("getMenu", async () => {
  return;
});

//test addMenuItem endpoint
test("addMenuItem", async () => {
  return;
});

//test getOrders endpoint
test("getOrders", async () => {
  return;
});

//test createOrders endpoint
test("createOrders", async () => {
  return;
});



//Helper functions to create random Names and Admin users etc.
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

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}
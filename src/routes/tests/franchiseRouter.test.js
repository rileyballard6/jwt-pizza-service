const request = require("supertest");
const app = require("../../service");
const { Role, DB } = require("../../database/database.js");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let adminAuthToken;
let franchiseId;
let franchiseIdToDelete;
let storeId;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;

  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  adminAuthToken = loginRes.body.token;

  const createFranchiseResult = await request(app)
    .post("/api/franchise")
    .send({ name: randomName(), admins: [{ email: testUser.email }] })
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

    const createFranchiseDelete = await request(app)
    .post("/api/franchise")
    .send({ name: randomName(), admins: [{ email: testUser.email }] })
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

  const createStoreResult = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .send({ franchiseId: franchiseId, name: randomName() })
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

  storeId = createStoreResult.body.id;
  franchiseId = createFranchiseResult.body.id;
  franchiseIdToDelete = createFranchiseDelete.body.id;
  expectValidJwt(testUserAuthToken);
  expectValidJwt(adminAuthToken);
});

//test getFranchises endpoint
test("getFranchises", async () => {
  return;
});

//test getUserFranchies endpoint
test("getUserFranchises", async () => {
  const getUserFranchisesResult = await request(app)
    .get("/api/franchise/1")
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

  expect(getUserFranchisesResult.status).toBe(200);

  return;
});

//test createFranchise endpoint
test("createFranchise", async () => {
  const createFranchiseResult = await request(app)
    .post("/api/franchise")
    .send({ name: randomName(), admins: [{ email: testUser.email }] })
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

  expect(createFranchiseResult.status).toBe(200);
  expect(createFranchiseResult.body).toBeInstanceOf(Object);
});

//test deleteFranchise endpoint
test("deleteFranchise", async () => {
  const deleteFranchiseResult = await request(app)
    .delete(`/api/franchise/${franchiseIdToDelete}`)
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

  expect(deleteFranchiseResult.status).toBe(200);
  expect(deleteFranchiseResult.body).toBeInstanceOf(Object);
});

//test createStore endpoint
test("createStore", async () => {
  const createStoreResult = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .send({ franchiseId: franchiseId, name: randomName() })
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

  expect(createStoreResult.status).toBe(200);
});

//test deleteStore endpoint
test("deleteStore", async () => {
  const deleteStoreResult = await request(app)
    .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
    .set(`Authorization`, `Bearer ${adminAuthToken}`);

  expect(deleteStoreResult.status).toBe(200);
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
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

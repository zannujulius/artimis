const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launchinf API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET launches", () => {
    test("It should respond with 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect(200)
        .expect("Content-Type", /json/);
    });
  });

  describe("Test POST launch", () => {
    const completeLaunchData = {
      mission: "Name of mission",
      rocket: "Rocket name",
      target: "Kepler-442 b",
      launchDate: "January 4, 2023",
    };

    const completeWithoutLaunchDate = {
      mission: "Name of mission",
      rocket: "Rocket name",
      target: "Kepler-442 b",
    };

    const completeLaunchWithInvalidDate = {
      mission: "Name of mission",
      rocket: "Rocket name",
      target: "Kepler-442 b",
      launchDate: "hello",
    };

    test("It should respond with 201 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .expect(201)
        .expect("Content-Type", /json/)
        .send(completeLaunchData);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(responseDate);
      expect(response.body).toMatchObject(completeWithoutLaunchDate);
    });
    test("It should catch missing fields required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .expect(400)
        .expect("Content-Type", /json/)
        .send(completeWithoutLaunchDate);

      expect(response.body).toStrictEqual({
        error: "All fields are required",
      });
    });

    test("It should catch invalid date", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .expect(400)
        .expect("Content-Type", /json/)
        .send(completeLaunchWithInvalidDate);
    });
  });
});

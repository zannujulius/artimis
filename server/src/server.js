const PORT = process.env.PORT || 5000;
const app = require("./app");
const http = require("http");
const server = http.createServer(app);
const dotenv = require("dotenv");
const { mongoConnect } = require("./services/mongo");
dotenv.config();

// we are trying to load the planet data completely from the stream before
// starting the server
// streams takes awhile before it eventually resolves with values
const { loadPlanetsData } = require("./models/planets.model");
const { loadLaunchData } = require("./models/launch.model");

// const MONGO_URL = `${process.env.MONGO_URL}`;

async function startServer() {
  // connect to the database
  // we use this to load the data from the stream operation before the
  // server starts
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`Server runnging on ${PORT}`);
  });
}

startServer();

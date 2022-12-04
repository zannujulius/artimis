const launches = new Map();
const planets = require("./planets.mongo");
const launchesDatabase = require("./launch.mongo");
const axios = require("axios").default;
let DEFAULT_FLIGHT_NUMBER = 100;

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find(
      {},
      {
        // remor
        __v: 0,
        _id: 0,
      }
    )
    .sort({
      flightNumber: 1,
    })
    .skip(skip)
    .limit(limit);
}

async function getLatestFlightNumber() {
  // default sorting is done in ascending order
  // then we use - to sort in descending order
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");
  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet found.");
  }
  const newFlightNumenr = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["Zero to mastery", " NASA"],
    flightNumber: newFlightNumenr,
  });

  await saveLaunches(newLaunch);
}

async function saveLaunches(launch) {
  return await launchesDatabase.findOneAndUpdate(
    {
      // if a launch with the flight number already exist
      // update it values
      flightNumber: launch.flightNumber,
      ...launch,
    },
    {
      // else if doesn't exist
      // Add the entire object
      launch,
    },
    {
      upsert: true,
    }
  );
}

const SPACE_X_API = "https://api.spacexdata.com/v4/launches/query";
async function populateLaunches() {
  console.log("Downloading list of launches ");
  const response = await axios.post(SPACE_X_API, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem fetching launch data...");
    throw new Error("launch data download failed");
  }
  const launchDocs = response.data.docs;
  for (const launch of launchDocs) {
    // console.log("got here");
    const payloads = launch.payloads;
    const customers = payloads.flatMap((payload) => payload["customers"]);
    const resultData = {
      flightNumber: launch.flight_number,
      mission: launch.name,
      rocket: launch.rocket.name,
      launchDate: launch.date_local,
      upcoming: launch.upcoming,
      success: launch.success,
      customers: customers,
    };
    saveLaunches(resultData);
  }
}

async function loadLaunchData() {
  try {
    const firstLaunch = await findLaunch({
      flightNumber: 1,
      rocket: "Falcon 1",
      mission: "FalconSat",
    });

    if (firstLaunch) {
      console.log("Launch data already loaded");
    } else {
      await populateLaunches();
    }
  } catch (err) {
    console.log(err.response);
  }
}

// finding a launch data that passes a particular filter option
async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
}

// function addNewLaunch(launch) {
//   lastFlightNumber++;
//   launches.set(
//     lastFlightNumber,
//     Object.assign(launch, {
//       success: true,
//       upcoming: true,
//       customers: ["Zero to mastery", " NASA"],
//       flightNumber: lastFlightNumber,
//     })
//   );
// }

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.acknowledged && aborted.modifiedCount === 1;
  // const aborted = launches.get(launchId);
  // aborted.upcoming = false;
  // aborted.success = false;
  // return aborted;
}

module.exports = {
  getAllLaunches,
  // addNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
  scheduleNewLaunch,
  loadLaunchData,
};

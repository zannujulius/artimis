const { parse } = require("csv-parse");
const fs = require("fs");
const path = require("path");

const Planets = require("./planets.mongo");

const habitablePlanets = [];

function isHabitable(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitable(data)) {
          savePlanets(data);
        }
      })
      .on("error", () => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        console.log("Done processing the file");
        const list = await getAllPlanets();
        console.log(`Planets found: ${list.length}`);

        resolve();
      });
  });
}

async function getAllPlanets() {
  return await Planets.find(
    {},
    {
      _id: 0,
      __v: 0,
    }
  );
}

async function savePlanets(planet) {
  try {
    // upsert the data => update and insert at the same time
    // relace already exiting planets with the new one
    return await Planets.updateOne(
      {
        // if the planet doesn't exist * add the planet
        keplerName: planet.kepler_name,
      },
      {
        // if the planet exist * update the planet
        keplerName: planet.kepler_name,
      },
      // set upsert to true
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.log(`Couldn't save planets: ${err.message}`);
  }
}
module.exports = { loadPlanetsData, getAllPlanets };

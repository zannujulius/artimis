const { parse } = require("csv-parse");
const fs = require("fs");

const habitablePlanets = [];

function isHabitable(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

fs.createReadStream("kepler_data.csv")
  .pipe(
    parse({
      comment: "#",
      columns: true,
    })
  )
  .on("data", (data) => {
    if (isHabitable(data)) habitablePlanets.push(data);
  })
  .on("error", () => {
    console.log(err);
  })
  .on("end", () => {
    console.log("Done processing the file");
    console.log(
      habitablePlanets.map((item) => item["kepler_name"]),
      `${habitablePlanets.length} planets are habitable.`
    );
  });

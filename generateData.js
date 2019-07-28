/**
 * Script to generate simulated user data from 311 calls location dataset
 */

const fs = require('fs');
const parse = require("csv-parse");
const faker = require('faker');
const moment = require('moment');

function processFloodedRoads() {
  Array.prototype.flatMap = function(lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
  };
  const floodRoads = JSON.parse(fs.readFileSync('./houston.geojson').toString());
  console.log(floodRoads);
  const res = floodRoads.features.flatMap(feature => {
    return feature.geometry.coordinates
  });
  fs.writeFileSync("./flooded.json", JSON.stringify(res));
}

function loadFloodedRoads() {
  return JSON.parse(fs.readFileSync('./flooded.json').toString());
}

// processFloodedRoads();
const floodedRoads = loadFloodedRoads();

const parser = parse({
  delimiter: '|',
  trim: true,
  skip_empty_lines: true
});

const keywords = [
  "small wounds",
  "large wounds",
  "broken arm",
  "broken leg",
];

let processData = () => {
  //console.log(results);

  const resultsLatLng = results.slice(1).map(row => [parseFloat(row[1]), parseFloat(row[2]), row[4]]);

  function getRandomPriority(minDistToHotspot) {
    return Math.random()*0.3 +
      /*Math.random()**/Math.min(0.7, 0.000001/minDistToHotspot)
  }

  function generateRandomUser(lat, lng, timestamp) {
    if(!lat || !lng) {
      return null;
    }

    const hotspots = floodedRoads;
    const distToHotspot = hotspots.map(([ptlng, ptlat]) => {
      const dlat = lat - ptlat;
      const dlng = lng - ptlng;
      return Math.pow(dlat,2) + Math.pow(dlng,2);
    }).filter(Boolean);
    // console.log(distToHotspot);
    const minDistToHotspot = Math.min(...distToHotspot);
    // console.log(minDistToHotspot);

    console.log(timestamp);
    return {
      _id: uuidv4(),
      userId: String(Math.round(Math.random() * 50000)),
      name: faker.fake('{{name.firstName}}'),
      timestamp: moment(timestamp, "YYYY-MM-DD HH:mm:ss.SSS").unix(),
      location_information: {
        geometry: {
          location: {
            lat: lat,
            lng: lng,
          }
        }
      },
      phone_number: Math.floor(Math.random() * 9000000000 + 1000000000),
      health: {
        priority: getRandomPriority(minDistToHotspot),
        key_words: ["uncool"]
      },
      food: {
        priority: getRandomPriority(minDistToHotspot)
      },
      hygiene: {
        priority: getRandomPriority(minDistToHotspot)
      }
    };
  }


  // https://stackoverflow.com/a/2117523
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const data =
    resultsLatLng
      .map((coord, i) => {
        console.log(`index ${i} / ${resultsLatLng.length}`);
        return generateRandomUser(coord[0], coord[1], coord[2]);
      })
      .filter(record => record);
  console.log(data);


  fs.writeFile("./public/fulldata.json", JSON.stringify(data), function(err) {
    if(err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });

};

const results = [];
fs.createReadStream('./floodingheatmap12m.csv')
  .pipe(parser)
  .on('data', (data) => {
    results.push(data);
  })
  .on('end', processData);
/**
 * Script to generate simulated user data from 311 calls location dataset
 */

const fs = require('fs');
const parse = require("csv-parse");
const randomName = require('random-name');

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

const results = [];
fs.createReadStream('./Y2017-311-data.txt')
  .pipe(parser)
  .on('data', (data) => {
    results.push(data);
  })
  .on('end', () => {
    //console.log(results);

    const resultsLatLng = results.slice(1).map(row => [parseFloat(row[27]), parseFloat(row[26])]);

    function getRandomPriority(minDistToHotspot) {
      return Math.random()*0.3 +
        /*Math.random()**/Math.min(0.7, 0.000001/minDistToHotspot)
    }

    function generateRandomUser(lat, lng) {
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

      const res = {
        _id: uuidv4(),
        userId: String(Math.round(Math.random() * 50000)),
        name: randomName.first(),
        location_information: {
          geometry: {
            location: {
              lat: lat,
              lng: lng,
            }
          }
        },
        phone_number: Math.floor(Math.random()*9000000000 + 1000000000),
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

      //console.log(res);
      return res;
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
          return generateRandomUser(coord[1], coord[0]);
        })
        .filter(record => record);
    console.log(data);


    fs.writeFile("./public/fulldata.json", JSON.stringify(data), function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("The file was saved!");
    });

  });
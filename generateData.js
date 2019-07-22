const fs = require('fs');
const parse = require("csv-parse");

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
    console.log(results);


    const resultsLatLng = results.slice(1).map(row => [parseFloat(row[27]), parseFloat(row[26])]);

    function generateRandomUser(lat, lng) {
      if(!lat || !lng) {
        return null;
      }
      return {
        userId: String(Math.round(Math.random() * 50000)),
        _id: uuidv4(),
        name: 'bryan',
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
          priority: Math.random(),
          key_words: ["uncool"]
        },
        food: {
          priority: Math.random(),
          key_words: ["weeee"]
        },
        hygiene: {
          priority: Math.random(),
          key_words: ["asdfasdf"]
        }
      }
    }


// https://stackoverflow.com/a/2117523
    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function randomInterval(min,max) {
      return Math.random()*(max-min)+min;
    }


    const data =
      resultsLatLng
        .map(coord => generateRandomUser(coord[1], coord[0]))
        .filter(record => record);
    console.log(data);


    fs.writeFile("./fulldata.json", JSON.stringify(data), function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("The file was saved!");
    });

  });
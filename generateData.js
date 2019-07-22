

function generateRandomUser(lat, lng) {
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
      priority: Math.random() * 500,
      key_words: ["uncool"]
    },
    food: {
      priority: Math.random() * 500,
      key_words: ["weeee"]
    },
    hygiene: {
      priority: Math.random() * 500,
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
  require('./src/data.json').map(coord => generateRandomUser(coord.lat, coord.lng));
console.log(data)

const fs = require('fs');
fs.writeFile("./fulldata.json", JSON.stringify(data), function(err) {
  if(err) {
    return console.log(err);
  }

  console.log("The file was saved!");
});
const https = require('https');

module.exports.getStream = url => new Promise(resolve => {
  https.get(url, response => {
    resolve(response);
  });
});

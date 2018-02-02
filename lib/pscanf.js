const scanf      = require('scanf');

module.exports = format => {
    format = format || '%s';
    return new Promise((resolve, reject) => {
        resolve(scanf(format));
    });
}
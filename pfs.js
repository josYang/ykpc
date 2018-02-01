const fs = require('fs');

module.exports = {
    readFile: file => {
        return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if (err) return reject(err);
                resolve(data.toString());
            });
        });
    },
    writeFile: (file, text, options) => {
        options = Object.assign({
            flag:'a',
            encoding:'utf-8',
            mode:'0666'
        }, options);
        // file = file || __dirname + '/cardinfo/' + (new Date()).getTime() + (Math.round(Math.random() * 1000)) + '.text';
        return new Promise((resolve, reject) => {
            fs.writeFile(file, text, options, err => {
                if (err) return reject(err);
                resolve(file);
            });
        });
    },
    unlink: file => {
        return new Promise((resolve, reject) => {
            fs.unlink(file, err => {
                if (err) return reject(err);
                resolve(file);
            });
        });
    }
};
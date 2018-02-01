const fs    = require('fs');

const youka = new (require('./youka'))();

// var arguments = process.argv.splice(2);
// var qq;

// arguments.forEach((val, index, array) => {
//     if (val == '-qq') {
//         qq = arguments[index + 1];
//         return false;
//     }
// });

// if (typeof qq == 'undefined') console.log(new Error('请在命令后面添加-qq参数 例如 node app.js -qq 123456'));

function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if (err) return reject(err);
            resolve(data.toString());
        });
    });
}

readFile('./qq.text')
    .then(text => {
        text.split('\n').map(qq => {
            youka.getCookiess(qq)
                .then(youka.getChkcode)
                .then(obj => {
                    return youka.getList(obj.cookies, obj.chkcode, qq);
                })
                .then(obj => {
                    let $ = obj.$;
                    $('.order_tb a').each((index, element) => {
                        const href = element.attribs.href;
                        const orderid = href.substr(href.indexOf('=') + 1);

                        youka.getData(orderid, obj.cookies)
                            .then(cardinfo => {
                                console.log('卡密信息：\n', cardinfo);
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    });
                })
                .catch(err => {
                    console.log(err);
                });
            return qq;
        });
    });


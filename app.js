const fs    = require('fs');
const cheerio    = require('cheerio');

const youka = require('./youka');
var arguments = process.argv.splice(2);
var qq;

arguments.forEach((val, index, array) => {
    if (val == '-qq') {
        qq = arguments[index + 1];
        return false;
    }
});

if (typeof qq == 'undefined') console.log(new Error('请在命令后面添加-qq参数 例如 node app.js -qq 123456'));

youka.getSignCookie()
    .then(youka.getJavascriptCookie)
    .then(youka.getSessionid)
    .then(cookies => {
        youka.getChkcode(cookies, qq)
            .then(chkcode => {
                return youka.getList(cookies, chkcode, qq);
            })
            .then($ => {
                $('.order_tb a').each((index, element) => {
                    const href = element.attribs.href;
                    const orderid = href.substr(href.indexOf('=') + 1);

                    youka.getData(orderid, cookies).then(cardinfo => {
                        //卡密信息
                        console.log(cardinfo);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                });
            })
            .catch(err => {
                console.log(err);
            });
    });
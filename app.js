const fs    = require('fs');

const qqs   = require('./qqs');
const youka = require('./youka');

youka.getSignCookie()
    .then(youka.getJavascriptCookie)
    .then(youka.getSessionid)
    .then(cookies => {
        qqs.map(qq => {
            youka.getChkcode(cookies, qq)
                .then(obj => {
                    return youka.getList(obj.cookie, obj.chkcode, qq);
                })
                .then(obj => {
                    // const $ = obj.doc;
                    const $;
                    fs.readFile('./list.html', function (error, data) {
                        $ = cheerio.load(data.toString());

                        $('.order_tb a').each((index, element) => {
                            const href = element.attribs.href;
                            const orderid = href.substr(href.indexOf('=') + 1);
                
                            youka.getData(orderid, obj.cookie).then(cardinfo => {
                                //卡密信息
                                console.log(cardinfo);
                            });
                
                            return false;
                        });
                    });
                });
            return qq;
        });
    });
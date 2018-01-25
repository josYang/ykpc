const cheerio   = require('cheerio');
const superagent = require('superagent').agent();
const fs        = require('fs');
const tesseract = require('node-tesseract');
const gm        = require('gm');

const qqs = require('./qqs');
const imgdecode  = require('./img-decode');

const servername = 'http://www.youka.la';
const url = servername + '/orderquery';

const browserMsg = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded'
};

function getSignCookie() {
    return new Promise((resolve, reject) => {
        superagent.get(url).set(browserMsg).redirects(0).end((err, res) => {
            //获取cookie
            let cookie = res.headers["set-cookie"];

            resolve(cookie);
        });
    });
}

function getJavascriptCookie(signCookie) {
    return new Promise((resolve, reject) => {
        superagent.get(url).set("Cookie", signCookie).set(browserMsg).end((err, res) => {
            if (err) {
                reject(err);
            } else {
                var $ = cheerio.load(res.text);
                const script = $('script[type="text/javascript"]').html();
    
                const start = script.indexOf('"');
    
                const end = script.indexOf(',') - 1;
    
                const value = script.substr(start, end);
    
                var exdate = new Date();
        
                exdate.setDate(exdate.getDate() + 365);
    
                resolve(signCookie.concat(
                    [ 'waf_sign_javascript=' + escape(value) + "; path=/; expires=" + exdate.toGMTString() ]
                ));
            }
        });
    });
}

function getSessionid(cookie) {
    return new Promise((resolve, reject) => {
        //传入cookie
        superagent.get(url).set("Cookie", cookie).set(browserMsg).end((err, res) => {
            if (err) {
                reject(err);
            } else {
                cookie.push(superagent.get(url).cookies.split(';')[1]);
                resolve(cookie);
            }
        });
    });
}

function getChkcode(cookie, qq) {
    return new Promise((resolve, reject) => {
        const imgurl = servername + '/chkcode';
        const img = __dirname + '/chkcode/' + (Math.round(Math.random() * 1000)) + (new Date()).getTime() + '.jpg';

        //传入cookie
        let req = superagent.get(imgurl).set("Cookie", cookie).set({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
            'Content-Type': 'image/jpeg'
        });

        req.pipe(fs.createWriteStream(img)).on('finish', () => {
            imgdecode(img).then(text => {
                resolve({
                    cookie: cookie,
                    chkcode: text
                });
            });
        });
    });
}

function getList(cookie, chkcode, qq) {
    return new Promise((resolve, reject) => {
        const data_url = `${url}?st=contact&kw=${qq}`;

        //传入cookie
        superagent.post(data_url).set("Cookie", cookie).send({
            chkcode: chkcode
        }).set(browserMsg).end((err, res) => {
            if (err) {
                reject(err);
            } else {
                // resolve({
                //     cookie: cookie,
                //     doc: cheerio.load(res.text)
                // });

                fs.readFile('./list.html', function (error, data) {
                    resolve({
                        cookie: cookie,
                        doc: cheerio.load(data.toString())
                    });
                });
            }
        });
    });
}

function getData(order_id, cookie) {
    return new Promise((resolve, reject) => {
        const time = new Date().getTime();
        const dataurl = `${servername}/checkgoods?rec=0&t=${time}&orderid=${order_id}`;

        superagent.get(dataurl).set("Cookie", cookie).set(browserMsg).end((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(res.text));
            }
        });
    });
}

getSignCookie().
    then(getJavascriptCookie).
    then(getSessionid).
    then(cookies => {
        return getChkcode(cookies, qqs[0]);
    }).
    then(obj => {
        return getList(obj.cookie, obj.chkcode, qqs[0]);
    }).then(obj => {
        const $ = obj.doc;

        $('.order_tb a').each((index, element) => {
            const href = element.attribs.href;
            const orderid = href.substr(href.indexOf('=') + 1);

            getData(orderid, obj.cookie).then(cardinfo => {
                console.log(cardinfo);
            });

            return false;
        });
    });
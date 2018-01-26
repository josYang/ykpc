const cheerio   = require('cheerio');
const superagent = require('superagent').agent();
const fs        = require('fs');
const tesseract = require('node-tesseract');
const gm        = require('gm');

const imgdecode  = require('./img-decode');
const config = require ('./config');

module.exports = {
    getSignCookie: function () {
        return new Promise((resolve, reject) => {
            superagent.get(config.url).set(config.browserMsg).redirects(0).end((err, res) => {
                //获取cookie
                let cookie = res.headers["set-cookie"];
    
                resolve(cookie);
            });
        });
    },
    getJavascriptCookie: function (signCookie) {
        return new Promise((resolve, reject) => {
            superagent.get(config.url).set("Cookie", signCookie).set(config.browserMsg).end((err, res) => {
                if (err) return reject(err);

                var $ = cheerio.load(res.text);
                const script = $('script[type="text/javascript"]').html();
    
                const start = script.indexOf('"');
    
                const end = script.indexOf(',') - 1;
    
                const value = script.substr(start, end);

                if (value.length < 1) return reject(new Error('获取javascriptcookie失败'));
    
                var exdate = new Date();
        
                exdate.setDate(exdate.getDate() + 365);
    
                resolve(signCookie.concat(
                    [ 'waf_sign_javascript=' + escape(value) + "; path=/; expires=" + exdate.toGMTString() ]
                ));
            });
        });
    },
    getSessionid: function (cookie) {
        return new Promise((resolve, reject) => {
            //传入cookie
            superagent.get(config.url).set("Cookie", cookie).set(config.browserMsg).end((err, res) => {
                if (err) return reject(err);

                cookie.push(superagent.get(config.url).cookies.split(';')[1]);
                resolve(cookie);
            });
        });
    },
    getChkcode: function (cookie, qq) {
        return new Promise((resolve, reject) => {
            const imgurl = `${config.servername}/chkcode`;
            const img = __dirname + '/chkcode/' + (Math.round(Math.random() * 1000)) + (new Date()).getTime() + '.jpg';
    
            //传入cookie
            let req = superagent.get(imgurl).set("Cookie", cookie).set({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                'Content-Type': 'image/jpeg'
            });
    
            req.pipe(fs.createWriteStream(img)).on('finish', () => {
                imgdecode(img).then(text => {
                    resolve(text);
                });
            });
        });
    },
    getList: function (cookie, chkcode, qq) {
        return new Promise((resolve, reject) => {
            const data_url = `${config.url}?st=contact&kw=${qq}`;
    
            //传入cookie
            superagent.post(data_url).set("Cookie", cookie).send({
                chkcode: chkcode
            }).set(config.browserMsg).end((err, res) => {
                if (err) return reject(err);
                const $ = cheerio.load(res.text);

                if ($('#cont_tow_1 img[src="/chkcode"]').length > 0) return reject(new Error('验证码输入错误，获取卡密列表页面失败'));

                resolve($);
            });
        });
    },
    getData: function (order_id, cookie) {
        return new Promise((resolve, reject) => {
            const time = new Date().getTime();
            const dataurl = `${config.servername}/checkgoods?rec=0&t=${time}&orderid=${order_id}`;
    
            superagent.get(dataurl).set("Cookie", cookie).set(config.browserMsg).end((err, res) => {
                if (err) return reject(err);
                
                const cardinfo = JSON.parse(res.text);
                
                if (cardinfo.status != 1) return reject(new Error(`查询卡密失败，${cardinfo.msg}`));

                resolve(cardinfo);
            });
        });
    }
}
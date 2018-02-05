const fs         = require('fs');
const path       = require('path');

const superagent = require('superagent').agent();
const cheerio    = require('cheerio');

const pscanf      = require('./pscanf');
const imgdecode  = require('./img-decode');
const pfs        = require('./pfs');

class youka {
    constructor (config) {
        this.config = Object.assign({
            servername: 'http://www.youka.la',
            url: 'http://www.youka.la/orderquery',
            browserMsg: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, config || {});
    }
    directGetSessionid (qq) {
        const data_url = `${this.config.url}?st=contact&kw=${qq}`;
        return new Promise((resolve, reject) => {
            superagent.get(data_url).set(this.config.browserMsg).redirects(0).end((err, res) => {
                if (err) return reject(err);
                //获取cookie
                let cookie = res.headers["set-cookie"];
    
                resolve(cookie);
            });
        });
    }
    getSignCookie () {
        return new Promise((resolve, reject) => {
            superagent.get(this.config.url).set(this.config.browserMsg).redirects(0).end((err, res) => {
                //获取cookie
                let cookie = res.headers["set-cookie"];
    
                resolve(cookie);
            });
        });
    }
    getJavascriptCookie (signCookie) {
        return new Promise((resolve, reject) => {
            superagent.get(this.config.url).set("Cookie", signCookie).set(this.config.browserMsg).end((err, res) => {
                if (err) return reject(err);

                let $ = cheerio.load(res.text);
                const script = $('script[type="text/javascript"]').html();
    
                const start = script.indexOf('"');
    
                const end = script.indexOf(',') - 1;
    
                const value = script.substr(start, end);

                if (value.length < 1) return reject('获取javascriptcookie失败');
    
                let exdate = new Date();
        
                exdate.setDate(exdate.getDate() + 365);
    
                resolve(signCookie.concat(
                    [ 'waf_sign_javascript=' + escape(value) + "; path=/; expires=" + exdate.toGMTString() ]
                ));
            });
        });
    }
    getSessionid (cookie) {
        return new Promise((resolve, reject) => {
            //传入cookie
            superagent.get(this.config.url).set("Cookie", cookie).set(this.config.browserMsg).end((err, res) => {
                if (err) return reject(err);

                cookie.push(superagent.get(this.config.url).cookies.split(';')[1]);
                resolve(cookie);
            });
        });
    }
    getCookiess (qq) {
        return this.directGetSessionid(qq)
            .then(cookies => {
                return cookies;
            })
            .catch(err => {
                return this.getSignCookie()
                    .then(this.getJavascriptCookie)
                    .then(this.getSessionid)
                    .catch(err => {
                        return err;
                    });
            });
    }
    getChkcode (cookies, useimgdecode) {
        return new Promise((resolve, reject) => {
            const imgurl = `${this.config.servername}/chkcode`;
            const img = path.resolve(__dirname, '..') + '/chkcode/' + (new Date()).getTime() + (Math.round(Math.random() * 1000)) + '.jpg';

            //传入cookie
            let req = superagent.get(imgurl).set("Cookie", cookies).set({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                'Content-Type': 'image/jpeg'
            });
    
            req.pipe(fs.createWriteStream(img)).on('finish', () => {
                if (useimgdecode) {
                    imgdecode(img).then(text => {
                        resolve({
                            cookies: cookies,
                            chkcode: text
                        });
                    });
                } else {
                    console.log(`验证码地址：${img},请输入图内验证码，输入完成后按回车键！\t\n`);
                    pscanf('%s')
                        .then(str => {
                            resolve({
                                cookies: cookies,
                                chkcode: str
                            });
                            pfs.unlink(img)
                                .then(file => {
                                    console.log(`验证码图片${img}已删除\t\n`);
                                });
                        });
                }
            });
        });
    }
    getList (cookies, chkcode, qq) {
        return new Promise((resolve, reject) => {
            const data_url = `${this.config.url}?st=contact&kw=${qq}`;
    
            //传入cookie
            superagent.post(data_url).set("Cookie", cookies).send({
                chkcode: chkcode
            }).set(this.config.browserMsg).end((err, res) => {
                if (err) return reject(err);
                const $ = cheerio.load(res.text);

                if ($('#cont_tow_1 img[src="/chkcode"]').length > 0) return reject('验证码输入错误，获取卡密列表页面失败');

                resolve({
                    cookies: cookies,
                    $: $
                });
            });
        });
    }
    getData (orderid, cookies) {
        return new Promise((resolve, reject) => {
            const time = new Date().getTime();
            const dataurl = `${this.config.servername}/checkgoods?rec=0&t=${time}&orderid=${orderid}`;
    
            superagent.get(dataurl).set("Cookie", cookies).set(this.config.browserMsg).end((err, res) => {
                if (err) return reject(err);
                
                const cardinfo = JSON.parse(res.text);
                
                if (cardinfo.status != 1) return reject(`查询卡密失败，${cardinfo.msg}`);

                resolve(cardinfo);
            });
        });
    }
    getOrdertime (orderid, cookies, cardinfo) {
        return new Promise((resolve, reject) => {
            const dataurl = `${this.config.url}?orderid=${orderid}`;

            superagent.get(dataurl).set("Cookie", cookies).set(this.config.browserMsg).end((err, res) => {
                if (err) return reject(err);

                let $ = cheerio.load(res.text);

                const ordertime = $('#cont_tow_2 tbody tr').eq(1).children('td').eq(0).text();

                resolve({
                    ordertime: ordertime,
                    cardinfo: cardinfo
                });
            });
        });
    }
}

module.exports = exports = youka;
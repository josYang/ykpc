const youka = new (require('./youka'))();
const pfs   = require('./pfs');

// var arguments = process.argv.splice(2);
// var qq;

// arguments.forEach((val, index, array) => {
//     if (val == '-qq') {
//         qq = arguments[index + 1];
//         return false;
//     }
// });

// if (typeof qq == 'undefined') console.log(new Error('请在命令后面添加-qq参数 例如 node app.js -qq 123456'));

const file = __dirname + '/cardinfo/' + (new Date()).getTime() + (Math.round(Math.random() * 1000)) + '.txt';

pfs.readFile('./qq.txt')
    .then(text => {
        text.split('\n').map(qq => {
            youka.getCookiess(qq)
                .then(cookies => {
                    return youka.getChkcode(cookies, false);
                })
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
                                pfs.writeFile(file, JSON.stringify(cardinfo) + '\t\n\n')
                                    .then(file => {
                                        console.log(`订单${orderid}内卡密写入文件${file}成功`);
                                    }, err => {
                                        console.log(err);
                                    })
                            }, err => {
                                console.log(`订单${orderid}查询失败，失败原因：${err}`);
                            });
                    });
                })
                .catch(err => {
                    //验证码输入错误
                    console.log(`${qq}获取列表失败，失败原因：${err}`);
                });
            return qq;
        });
    });

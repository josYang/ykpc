const youka = new (require('./lib/youka'))();
const pfs   = require('./lib/pfs');

// var arguments = process.argv.splice(2);
// var qq;

// arguments.forEach((val, index, array) => {
//     if (val == '-qq') {
//         qq = arguments[index + 1];
//         return false;
//     }
// });

// if (typeof qq == 'undefined') console.log(new Error('请在命令后面添加-qq参数 例如 node app.js -qq 123456'));

pfs.readFile('./qq.txt')
    .then(text => {
        let qqs = text.split('\n');
        getData(qqs);
    });

function getData (qqs1, qqs2) {
    qqs2 = qqs2 || [];

    const diffqqs = qqs1.filter(key => !qqs2.includes(key));

    if (diffqqs.length == 0) return false;
    
    const qq = diffqqs[0];

    const file = __dirname + '/cardinfo/' + (new Date()).getTime() + (Math.round(Math.random() * 1000)) + '.txt';

    youka.getCookiess(qq)
    .then(cookies => {
        return youka.getChkcode(cookies, false);
    })
    .then(obj => {
        return youka.getList(obj.cookies, obj.chkcode, qq);
    })
    .then(obj => {
        qqs2.push(qq);

        let $ = obj.$;

        if ($('.order_tb a').length <= 0) console.log(`qq${qq}内没有订单`);

        $('.order_tb a').each((index, element) => {
            const href = element.attribs.href;
            const orderid = href.substr(href.indexOf('=') + 1);

            youka.getData(orderid, obj.cookies)
                .then(cardinfo => {
                    return youka.getOrdertime(orderid, obj.cookies, cardinfo);
                })
                .then(data => {
                    let str = `${orderid},${data.ordertime},${JSON.stringify(data.cardinfo)}\t\n`;
                    return pfs.writeFile(file, str);
                })
                .then(file => {
                    console.log(`订单${orderid}内容写入文件${file}成功`);
                })
                .catch(err => {
                    console.error('获取订单失败，错误信息：', err);
                });
        });

        getData(qqs1, qqs2);
    })
    .catch(err => {
        getData(qqs1, qqs2);
        //验证码输入错误
        console.log(`qq${qq}获取列表失败，失败原因：`, err);
    });
}
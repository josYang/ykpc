const path      = require('path');

const tesseract = require('node-tesseract');
const gm        = require('gm');

const pfs       = require('./pfs');

/**
 * 处理图片为阈值图片
 * @param imgPath
 * @param newPath
 * @param [thresholdVal=55] 默认阈值
 * @returns {Promise}
 */
function processImg (imgPath, newPath, thresholdVal) {
    return new Promise((resolve, reject) => {
        gm(imgPath)
            // .options({
            //     appPath: 'D:\\Program Files\\GraphicsMagick-1.3.28-Q16\\'
            // })
            .threshold(thresholdVal || '77%')
            .write(newPath, (err)=> {
                if (err) return reject(err);

                resolve(newPath);

                pfs.unlink(imgPath)
                    .then(img => {
                        console.log(`验证码图片${img}已删除\t\n`);
                    });
            });
    });
}

/**
 * 识别图片
 * @param imgPath
 * @param options tesseract options
 * @returns {Promise}
 */
function recognizer (imgPath, options) {
    // Recognize German text in a single uniform block of text and set the binary path
    options = Object.assign({
        l: 'eng',
        psm: 7,
        binary: 'D:\\Tesseract-OCR\\tesseract.exe '
    }, options);

    return new Promise((resolve, reject) => {
        tesseract
            .process(imgPath, options, (err, text) => {
                if (err) return reject(err);
                resolve(text.replace(/[\r\n\s]/gm, ''));

                pfs.unlink(imgPath)
                    .then(img => {
                        console.log(`验证码图片${img}已删除\t\n`);
                    });
            });
    });
}

module.exports = img => {
    const newimg = path.resolve(__dirname, '..') + '/chkcode/' + (Math.round(Math.random() * 1000)) + (new Date()).getTime() + '.jpg';

    return processImg(img, newimg, '77%')
    .then(recognizer);
}
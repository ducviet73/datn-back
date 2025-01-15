const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const querystring = require('querystring');
const { format } = require('date-fns'); // Use date-fns instead of dateFormat

const tmnCode = 'Z5J6TAHZ';
const secretKey = 'CZ5M31EUOSYP5JGXQ278MTUNWZSFYS4D';
const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'; // URL VNPay
const returnUrl = 'http://localhost:3000/vnpay/vnpay_return';

function sortObject(obj) {
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = obj[key];
        return result;
    }, {});
}
// API tạo link thanh toán
router.post('/create_payment_url', function (req, res, next) {
    // Kiểm tra các tham số bắt buộc từ request
    const { amount, orderDescription, orderType, language, bankCode } = req.body;

    // Kiểm tra nếu các tham số bắt buộc không có giá trị
    if (!amount || !orderDescription || !orderType) {
        return res.status(400).json({
            message: "Missing required fields. Please provide 'amount', 'orderDescription', and 'orderType'."
        });
    }

    // Kiểm tra nếu 'amount' là một số hợp lệ
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "'amount' must be a valid positive number." });
    }

    // Kiểm tra nếu 'language' có giá trị hợp lệ (chỉ 'vn' hoặc 'en' là hợp lệ)
    const validLanguages = ['vn', 'en'];
    if (language && !validLanguages.includes(language)) {
        return res.status(400).json({ message: "'language' must be 'vn' or 'en'." });
    }

    // Lấy các tham số khác và xác minh
    var ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let createDate = format(new Date(), 'yyyyMMddHHmmss'); // Sử dụng định dạng ngày tháng từ date-fns
    let orderId = format(new Date(), 'HHmmss'); // Sử dụng định dạng thời gian từ date-fns

    // Đảm bảo tham số 'amount' được chuyển thành đồng (VND)
    let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: language || 'vn', // Ngôn ngữ mặc định là 'vn' nếu không có
        vnp_CurrCode: 'VND', // Đơn vị tiền tệ là VND
        vnp_TxnRef: orderId, // Mã đơn hàng
        vnp_OrderInfo: orderDescription, // Mô tả đơn hàng
        vnp_OrderType: orderType, // Loại giao dịch
        vnp_Amount: amount * 100, // Tiền phải nhân với 100
        vnp_ReturnUrl: returnUrl, // URL trả về sau khi thanh toán
        vnp_IpAddr: ipAddr, // Địa chỉ IP của khách hàng
        vnp_CreateDate: createDate // Ngày tạo đơn hàng
    };

    // Nếu có mã ngân hàng được chọn, thêm vào tham số
    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Sắp xếp các tham số theo thứ tự chữ cái
    vnp_Params = sortObject(vnp_Params); 

    // Tạo chuỗi dữ liệu cần ký
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Thêm hash bảo mật vào tham số
    vnp_Params['vnp_SecureHash'] = signed;

    // Tạo URL đầy đủ để chuyển hướng người dùng đến trang thanh toán VNPay
    const baseVnpUrl = vnpUrl;
    let fullUrl = baseVnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

    // Gửi phản hồi với URL thanh toán
    res.json({ url: fullUrl });
});


// VNPAY IPN (Instant Payment Notification)
router.get('/vnpay_ipn', function (req, res, next) {
    var vnp_Params = req.query;
    var secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params); // Ensure sorting function is defined

    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
        var orderId = vnp_Params['vnp_TxnRef'];
        var rspCode = vnp_Params['vnp_ResponseCode'];
        res.status(200).json({ RspCode: '00', Message: 'success' });
    } else {
        res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    }
});

// VNPAY Return URL
router.get('/vnpay_return', function (req, res, next) {
    var vnp_Params = req.query;
    var secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params); // Ensure sorting function is defined

    var signData = querystring.stringify(vnp_Params, { encode: false });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
        // Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
        res.render('success', { code: vnp_Params['vnp_ResponseCode'] });
    } else {
        res.render('success', { code: '97' });
    }
});
router.get('/vnpay_return', function (req, res, next) {
    var vnp_Params = req.query;

    var secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    var config = require('config');
    var tmnCode = config.get('vnp_TmnCode');
    var secretKey = config.get('vnp_HashSecret');

    var querystring = require('qs');
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var crypto = require("crypto");     
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     

    if(secureHash === signed){
        //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

        res.render('success', {code: vnp_Params['vnp_ResponseCode']})
    } else{
        res.render('success', {code: '97'})
    }
});


module.exports = router;
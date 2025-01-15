const express = require('express');
const router = express.Router();
const voucherController = require('../controller/voucherController');

router.post('/', voucherController.createVoucher);
router.get('/', voucherController.getAllVouchers);
router.get('/:voucher_code', voucherController.getVoucherByCode);
router.put('/:id', voucherController.updateVoucher);
router.delete('/:id', voucherController.deleteVoucher);

module.exports = router;

// router.get('/:id', voucherController.getVoucherById); 

const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  voucher_code: { type: String, required: true, unique: true },
  discount_type: { type: String, enum: ['percentage', 'fixed amount'], required: true },
  discount_value: { type: Number, required: true },
  min_order_amount: { type: Number, default: 0 },
  start_date: { type: Date },
  end_date: { type: Date },
  max_uses: { type: Number },
  uses_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
});

voucherSchema.pre('save', function (next) {
  if (this.start_date && this.end_date && this.start_date > this.end_date) {
    return next(new Error('start_date must be before end_date'));
  }
  if (this.uses_count > this.max_uses) {
    return next(new Error('uses_count cannot exceed max_uses'));
  }
  if (this.end_date && this.end_date < new Date() || this.uses_count >= this.max_uses) {
    this.is_active = false;
  }
  next();
});

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;

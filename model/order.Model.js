const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: { type: String, required: true },
        ward: { type: String, required: true },
        district: { type: String, required: true },
        city: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending',  'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    details: [
        {
            productId: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    discountAmount: { type: Number, default: 0 },
    voucher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },

}, { timestamps: true });


const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
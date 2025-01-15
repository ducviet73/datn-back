const Voucher = require('../model/voucherModel');

const voucherController = {
  createVoucher: async (req, res) => {
    try {
      const voucher = new Voucher(req.body);
      await voucher.save();
      res.status(201).json(voucher);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  getAllVouchers: async (req, res) => {
    try {
        const vouchers = await Voucher.find();
        res.status(200).json(vouchers)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
  },
  getVoucherByCode: async (req, res) => {
      try {
        const { voucher_code } = req.params;
        const voucher = await Voucher.findOne({ voucher_code });
        if (!voucher) {
          return res.status(404).json({ message: 'Voucher not found' });
        }
        res.status(200).json(voucher);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  },
  updateVoucher: async (req, res) => {
      try {
          const { id } = req.params;
          const voucher = await Voucher.findByIdAndUpdate(id, req.body, { new: true });
          if (!voucher) {
              return res.status(404).json({ message: "Voucher not found" });
          }
          res.status(200).json(voucher)
      } catch (error) {
          res.status(500).json({ message: error.message });
      }
  },
  deleteVoucher: async (req, res) => {
      try {
          const { id } = req.params;
          const voucher = await Voucher.findByIdAndDelete(id);
          if (!voucher) {
              return res.status(404).json({ message: 'Voucher not found' })
          }
          res.status(200).json({ message: 'Voucher deleted'})
      } catch (error) {
          res.status(500).json({ message: error.message });
      }
  },
  
};

module.exports = voucherController;


  // getVoucherById: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const voucher = await Voucher.findById(id);
  //     if (!voucher) {
  //       return res.status(404).json({ message: 'Voucher not found' });
  //     }
  //     res.status(200).json(voucher);
  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // },
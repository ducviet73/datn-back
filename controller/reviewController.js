const Review = require('../model/reviewModel');

// Lấy danh sách review cho một sản phẩm
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ id_product: productId })
      .populate('id_user', 'username') // Lấy username của người dùng
      .exec();

    console.log(reviews);
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// Tạo review mới
exports.createReview = async (req, res) => {
  try {
    const { id_user, id_product, content } = req.body;
    if (!id_user || !id_product || !content) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin: id_user, id_product và content.' });
    }

    const review = new Review({ id_user, id_product, content });
    await review.save();
    res.status(201).json({ message: 'Tạo review thành công.', review });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo review.', error: error.message });
  }
};

// Xóa review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const deletedReviewDocument = await Review.findByIdAndDelete(reviewId);
    if (!deletedReviewDocument) {
      return res.status(404).json({ message: 'Review không tồn tại.' });
    }
    res.status(200).json({ message: 'Xóa review thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa review.', error: error.message });
  }
};
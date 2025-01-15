const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Product = require('../model/product.Model');
const Category = require('../model/category.Model');

// Hàm kiểm tra ID có hợp lệ không
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Thêm sản phẩm mới
const addProduct = async (req, res) => {
    try {
        const { name, category, sale, description, price, content, view, inventory, rating } = req.body;

        if (!isValidObjectId(category)) {
            return res.status(400).json({ message: 'Invalid category ID format' });
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ message: 'Category not found' });
        }
          const image = req.files && req.files['image'] ? req.files['image'][0].filename : null;
          const images = req.files && req.files['images'] ? req.files['images'].map(file => file.filename) : [];
        const newProduct = new Product({
            name,
            category,
            sale,
            description,
            price,
            content,
             image,
              images,
            view,
            inventory,
            rating
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: error.message });
    }
};


// Cập nhật thông tin sản phẩm
const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            console.log(`Product with id ${productId} not found`);
            return res.status(404).json({ message: "Product not found" });
        }
        console.log("product found to update: ", product);
       const updates = { ...req.body };

        if (req.files && req.files['image']) {
            const newImage = req.files['image'][0].filename;
            updates.image = newImage;
             if (product.image) {
                  try {
                       const oldImagePath = path.join(__dirname, '../public/img', product.image);
                        if (fs.existsSync(oldImagePath)) {
                         fs.unlinkSync(oldImagePath);
                        }
                      }
                   catch (err) {
                      console.error("Error delete old image:", err);
                    }
             }
        }
        if (req.files && req.files['images']) {
               const newImages = req.files['images'].map(file => file.filename);
                 updates.images = newImages;

                for (const img of product.images) {
                    try {
                        const oldImgPath = path.join(__dirname, '../public/img', img);
                           if (fs.existsSync(oldImgPath)) {
                              fs.unlinkSync(oldImgPath);
                           }
                     }
                  catch (err) {
                       console.error("Error delete sub image:", err)
                    }
                 }

          }
         console.log("Data update:", updates);
        const updatedProduct = await Product.findByIdAndUpdate(productId, updates, { new: true, runValidators: true });

        if (!updatedProduct) {
            console.log(`Product with id ${productId} not update`);
            return res.status(404).json({message: "Product not found"});
        }
        res.status(200).json({ message: "Product update success", updatedProduct });
    } catch (error) {
        console.error("Error updating product", error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Xóa ảnh chính và ảnh phụ
        if (product.image) {
          try {
             const mainImagePath = path.join(__dirname, '../public/img', product.image);
              if (fs.existsSync(mainImagePath)) {
                fs.unlinkSync(mainImagePath);
              }
            }
             catch (err) {
               console.error("Error delete main image:", err)
             }
        }
        for (const img of product.images) {
            try {
                const imgPath = path.join(__dirname, '../public/img', img);
                 if (fs.existsSync(imgPath)) {
                     fs.unlinkSync(imgPath);
                 }
            }
           catch (err) {
               console.error("Error delete sub image:", err)
           }
        };

        // Xóa sản phẩm
        await Product.findByIdAndDelete(productId);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: error.message });
    }
};


// Lấy tất cả sản phẩm với chi tiết danh mục
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .exec();
        console.log('Products with populated category in getAllProducts:', products);
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found' });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
};


// Lấy sản phẩm theo ID với chi tiết danh mục
const getProductById = async (req, res) => {
    const productId = req.params.productId;

    if (!isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product ID format' });
    }

    try {
        const product = await Product.findById(productId)
            .populate('category', 'name')
            .exec();

        if (product) {
            console.log("product response: ", product);
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Error fetching product details' });
    }
};

// Tìm kiếm sản phẩm theo từ khóa với chi tiết danh mục
const searchProducts = async (req, res) => {
    const keyword = req.params.keyword;

    try {
        const products = await Product.find({ name: new RegExp(keyword, 'i') })
            .populate('category', 'name')
            .exec();

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: `No products found with name containing "${keyword}"` });
        }
    } catch (error) {
        console.error('Error searching products by name:', error);
        res.status(500).json({ message: 'Error searching products by name' });
    }
};


// Lấy sản phẩm theo danh mục với chi tiết danh mục
const getProductsByCategory = async (req, res) => {
    const categoryId = req.params.categoryId;

    if (!isValidObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID format' });
    }

    try {
        const products = await Product.find({ category: categoryId })
            .populate('category', 'name')
            .exec();

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found in this category' });
        }
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Error fetching products by category' });
    }
};


// Lấy sản phẩm nổi bật với chi tiết danh mục
const getHotProducts = async (req, res) => {
    try {
        const hotProducts = await Product.find()
            .sort({ view: -1 })
            .limit(4)
            .populate('category', 'name')
            .exec();

        if (hotProducts.length > 0) {
            res.status(200).json(hotProducts);
        } else {
            res.status(404).json({ message: 'No hot products found' });
        }
    } catch (error) {
        console.error('Error fetching hot products:', error);
        res.status(500).json({ message: 'Error fetching hot products' });
    }
};


// Lấy sản phẩm bán chạy nhất với chi tiết danh mục
const getBestSellingProducts = async (req, res) => {
    try {
        const bestSellingProducts = await Product.find()
            .sort({ inventory: -1 })
            .limit(4)
            .populate('category', 'name')
            .exec();

        if (bestSellingProducts.length > 0) {
            res.status(200).json(bestSellingProducts);
        } else {
            res.status(404).json({ message: 'No best-selling products found' });
        }
    } catch (error) {
        console.error('Error fetching best-selling products:', error);
        res.status(500).json({ message: 'Error fetching best-selling products' });
    }
};


// Lấy sản phẩm đang khuyến mãi với chi tiết danh mục
const getSaleProducts = async (req, res) => {
    try {
        const saleProducts = await Product.find({ sale: { $gt: 0 } })
            .limit(4)
            .populate('category', 'name')
            .exec();

        if (saleProducts.length > 0) {
            res.status(200).json(saleProducts);
        } else {
            res.status(404).json({ message: 'No sale products found' });
        }
    } catch (error) {
        console.error('Error fetching sale products:', error);
        res.status(500).json({ message: 'Error fetching sale products' });
    }
};

// Lấy tất cả sản phẩm với phân trang
async function getAllAdmin(page, limit) {
    try {
       page = parseInt(page) || 1;
        limit = parseInt(limit) || 5;
          if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
            throw new Error("Invalid page or limit values");
        }
        const skip = (page - 1) * limit;
        const result = await Product.find().skip(skip).limit(limit)
            .populate('category', 'name')
            .exec();
        const total = await Product.countDocuments();

        const numberOfPages = Math.ceil(total / limit);
        console.log('Products with populated category:', result);
        return { result, countPro: total, countPages: numberOfPages, currentPage: page, limit: limit };
    } catch (error) {
        console.log('Error fetching product list:', error);
        throw error;
    }
}

module.exports = {
    getAllAdmin,
    getAllProducts,
    getProductById,
    searchProducts,
    getProductsByCategory,
    getHotProducts,
    getBestSellingProducts,
    getSaleProducts,
    addProduct,
    updateProduct,
    deleteProduct
};
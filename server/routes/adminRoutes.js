import express from 'express';
import { protect, isAdmin }        from '../middleware/auth.js';
import { uploadProductImages }     from '../middleware/upload.js';
import {
  getDashboardStats,
  getCategories,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleListing,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, isAdmin);

// Multer error wrapper — turns multer errors into clean JSON 400 responses
function withUpload(handler) {
  return (req, res, next) => {
    uploadProductImages(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message ?? String(err) });
      handler(req, res, next);
    });
  };
}

router.get('/stats',           getDashboardStats);
router.get('/categories',      getCategories);
router.get('/products',        getAllProducts);
router.get('/products/:id',    getProductById);
router.post('/products',              withUpload(createProduct));
router.put('/products/:id',           withUpload(updateProduct));
router.patch('/products/:id/listing', toggleListing);
router.delete('/products/:id',        deleteProduct);

export default router;

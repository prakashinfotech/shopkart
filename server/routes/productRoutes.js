import express from 'express';
import {
  searchProducts,
  getSuggestions,
  getProductsByCategory,
  getProductById,
  getSimilarProducts,
} from '../controllers/productController.js';

const router = express.Router();

// Specific routes first — avoids them being swallowed by /:id
router.get('/search',          searchProducts);
router.get('/suggestions',     getSuggestions);
router.get('/category/:slug',  getProductsByCategory);
router.get('/:id/similar',     getSimilarProducts);
router.get('/:id',             getProductById);

export default router;

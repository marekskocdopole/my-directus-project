import express from 'express';
import multer from 'multer';
import { ProductController } from '../controllers/ProductController';
import { validateRequest, requireAuth } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const productController = new ProductController();

// Schémata pro validaci
const farmSchema = Joi.object({
  name: Joi.string().required(),
  farmId: Joi.string().required(),
  file: Joi.any()
});

const productUpdateSchema = Joi.object({
  generated_short_description: Joi.string().max(150).required(),
  generated_long_description: Joi.string().min(100).required(),
  selected_image_url: Joi.string().uri().required(),
  status: Joi.string().valid('draft', 'in_progress', 'completed')
});

// Farmy
router.get('/farms', requireAuth, productController.getFarms);
router.post('/farms', 
  requireAuth, 
  upload.single('file'), 
  validateRequest(farmSchema),
  productController.createFarm
);

// Produkty
router.get('/farms/:farmId/products', requireAuth, productController.getProductsByFarm);
router.get('/products/:id', requireAuth, productController.getProductById);

router.post('/products/:productId/generate-descriptions', 
  requireAuth, 
  productController.generateDescriptions
);

router.post('/products/:productId/generate-images', 
  requireAuth, 
  productController.generateImages
);

router.put('/products/:productId', 
  requireAuth,
  validateRequest(productUpdateSchema), 
  productController.updateProduct
);

router.get('/products/:productId/history', 
  requireAuth, 
  productController.getProductHistory
);

export default router;

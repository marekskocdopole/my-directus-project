// src/api/routes/index.ts

import express from 'express';
import multer from 'multer';
import { ProductController } from '../controllers/ProductController';
import { validateRequest, requireAuth } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const productController = new ProductController();

// Schemas for validation
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

// Farms
router.get('/farms', requireAuth, (req, res) => productController.getFarms(req, res));
router.post('/farms', 
    requireAuth, 
    upload.single('file'), 
    validateRequest(farmSchema),
    (req, res) => productController.createFarm(req, res)
);

// Products
router.get('/farms/:farmId/products', requireAuth, (req, res) => productController.getProductsByFarm(req, res));
router.get('/products/:id', requireAuth, (req, res) => productController.getProductById(req, res));

router.post('/products/:productId/generate-descriptions', 
    requireAuth, 
    (req, res) => productController.generateDescriptions(req, res)
);

router.post('/products/:productId/generate-images', 
    requireAuth, 
    (req, res) => productController.generateImages(req, res)
);

router.put('/products/:productId', 
    requireAuth,
    validateRequest(productUpdateSchema), 
    (req, res) => productController.updateProduct(req, res)
);

router.get('/products/:productId/history', 
    requireAuth, 
    (req, res) => productController.getProductHistory(req, res)
);

export default router;
// src/api/controllers/ProductController.ts

import { Request, Response } from 'express';
import multer from 'multer'; // Přidáno, pokud je potřeba
import { ProductGeneratorService } from '../services/ProductGeneratorService';
import { DatabaseService } from '../services/DatabaseService';

const upload = multer({ dest: 'uploads/' }); // Konfigurace multer, pokud je potřeba

export class ProductController {
    private productService: ProductGeneratorService;
    private dbService: DatabaseService;

    constructor() {
        this.productService = new ProductGeneratorService();
        this.dbService = new DatabaseService();
    }

    // Method to get farms
    async getFarms(req: Request, res: Response) {
        try {
            const farms = await this.dbService.getFarms();
            res.json(farms);
        } catch (error) {
            console.error('Chyba při načítání farem:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se načíst farmy',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }

    // Method to create a new farm
    async createFarm(req: Request, res: Response) {
        try {
            const { name, farmId } = req.body;
            const file = req.file; // Nyní je 'file' definováno díky rozšíření Request interface

            if (!name || !farmId) {
                return res.status(400).json({ 
                    error: 'Neplatná data', 
                    message: 'Název a ID farmy jsou povinné' 
                });
            }

            // Get the file path
            const filePath = file ? file.path : undefined;

            // Save the farm to the database
            const farm = await this.dbService.createFarm(name, farmId, filePath);

            // If a CSV file is uploaded, import products
            if (filePath) {
                await this.productService.importProductsFromCSV(filePath, farm.id);
            }

            res.status(201).json(farm);
        } catch (error) {
            console.error('Chyba při vytváření farmy:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se vytvořit farmu',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }

    // Method to get products by farm
    async getProductsByFarm(req: Request, res: Response) {
        try {
            const { farmId } = req.params;
            const products = await this.dbService.getProducts(farmId);
            res.json(products);
        } catch (error) {
            console.error('Chyba při načítání produktů:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se načíst produkty',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }

    // Method to get product by ID
    async getProductById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const product = await this.dbService.getProductById(id);
            if (!product) {
                return res.status(404).json({ error: 'Produkt nenalezen' });
            }
            res.json(product);
        } catch (error) {
            console.error('Chyba při načítání produktu:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se načíst produkt',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }

    // Method to update a product
    async updateProduct(req: Request, res: Response) {
        try {
            const { productId } = req.params;
            const updateData = req.body;
            await this.dbService.updateProduct(productId, updateData);
            res.status(200).json({ message: 'Produkt aktualizován' });
        } catch (error) {
            console.error('Chyba při aktualizaci produktu:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se aktualizovat produkt',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }

    // Method to generate descriptions
    async generateDescriptions(req: Request, res: Response) {
        try {
            const { productId } = req.params;
            const descriptions = await this.productService.generateDescriptions(productId);
            res.status(200).json(descriptions);
        } catch (error) {
            console.error('Chyba při generování popisků:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se generovat popisky',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }

    // Method to generate images
    async generateImages(req: Request, res: Response) {
        try {
            const { productId } = req.params;
            const imageUrls = await this.productService.generateImages(productId);
            res.status(200).json(imageUrls);
        } catch (error) {
            console.error('Chyba při generování obrázků:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se generovat obrázky',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }

    // Method to get product history
    async getProductHistory(req: Request, res: Response) {
        try {
            const { productId } = req.params;
            const history = await this.dbService.getProductHistory(productId);
            res.json(history);
        } catch (error) {
            console.error('Chyba při načítání historie produktu:', error);
            res.status(500).json({ 
                error: 'Interní chyba serveru', 
                message: 'Nepodařilo se načíst historii produktu',
                details: error instanceof Error ? error.message : 'Neznámá chyba' 
            });
        }
    }
}
// src/api/services/ProductGeneratorService.ts

import fs from 'fs';
import csv from 'csv-parser';
import { DatabaseService } from './DatabaseService';
import { Configuration, OpenAIApi } from 'openai'; // Corrected import
import Replicate from 'replicate'; // Default import
import { S3 } from '@aws-sdk/client-s3';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

export class ProductGeneratorService {
    private db: DatabaseService;
    private openai: OpenAIApi;
    private replicate: Replicate;
    private s3: S3;

    constructor() {
        this.db = new DatabaseService();

        // Initialize OpenAI
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openai = new OpenAIApi(configuration);

        // Initialize Replicate
        this.replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        // Initialize S3 (DigitalOcean Spaces)
        this.s3 = new S3({
            endpoint: process.env.DO_SPACES_ENDPOINT,
            credentials: {
                accessKeyId: process.env.DO_SPACES_KEY!,
                secretAccessKey: process.env.DO_SPACES_SECRET!,
            },
            region: 'fra1',
        });
    }

    // Import products from CSV file
    async importProductsFromCSV(filePath: string, farmId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const products: any[] = [];

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    products.push(row);
                })
                .on('end', async () => {
                    try {
                        const pool = this.db.getPool(); // Use getter method

                        for (const product of products) {
                            const { name, shop_sku, ingredients } = product;

                            if (!name || !shop_sku) {
                                console.warn(`Produkt s názvem "${name}" a SKU "${shop_sku}" je nekompletní a nebude importován.`);
                                continue;
                            }

                            await pool.query(
                                `INSERT INTO product_generator_products (farm_id, name, shop_sku, ingredients) VALUES ($1, $2, $3, $4)`,
                                [farmId, name, shop_sku, ingredients || null]
                            );
                        }
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    // Generate descriptions for a product
    async generateDescriptions(productId: string): Promise<{ short_description: string; long_description: string }> {
        try {
            const product = await this.db.getProductById(productId);
            if (!product) {
                throw new Error('Produkt nenalezen');
            }

            const systemPrompt = `
                Jsi zkušený copywriter specializující se na produktové popisky pro farmářské produkty. 
                Piš přesné, informativní a stylisticky bezchybné popisy ve třetí osobě.
            `;

            const userPrompt = `
                Vygeneruj popisky pro produkt s těmito parametry:
                
                Název produktu: ${product.name}
                Ingredience: ${product.ingredients || 'Nejsou specifikované'}

                Požadavky na popis:
                1. Krátký popis: Max 150 znaků
                2. Dlouhý popis: Min 100 znaků, max 300 znaků
                3. Zaměř se na původ produktu, jeho specifické vlastnosti a použití
                4. Piš ve třetí osobě
                5. Vyvaruj se přehnaně marketingového jazyka
            `;

            const response = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 300,
                temperature: 0.7,
            });

            const description = response.data.choices[0].message?.content;
            if (!description) {
                throw new Error('OpenAI nevrátil žádný popis');
            }

            const [shortDescription, longDescription] = this.parseDescription(description);

            // Update product in database
            await this.db.updateProduct(product.id, {
                generated_short_description: shortDescription,
                generated_long_description: longDescription,
            });

            return {
                short_description: shortDescription,
                long_description: longDescription,
            };
        } catch (error) {
            console.error('Chyba při generování popisků:', error);
            throw error;
        }
    }

    // Generate images for a product
    async generateImages(productId: string): Promise<string[]> {
        try {
            const product = await this.db.getProductById(productId);
            if (!product) {
                throw new Error('Produkt nenalezen');
            }

            const prompt = `
                Product photo of ${product.name}, 
                high quality, professional product photography, 
                white background, studio lighting, 
                detailed and clear image
            `;

            const output = await this.replicate.run(
                "black-forest-labs/flux-1.1-pro",
                { input: { prompt } }
            );

            if (!Array.isArray(output)) {
                throw new Error('Replicate nevrátil pole URL');
            }

            const uploadPromises = output.map(async (imageUrl: string, index: number) => {
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    throw new Error(`Chyba při stahování obrázku: ${response.statusText}`);
                }
                const buffer = await response.arrayBuffer();

                const key = `products/${product.shop_sku}_${index}.jpg`;
                await this.s3.putObject({
                    Bucket: process.env.DO_SPACES_BUCKET!,
                    Key: key,
                    Body: Buffer.from(buffer),
                    ContentType: 'image/jpeg',
                    ACL: 'public-read'
                });

                return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            // Update product in database
            await this.db.updateProduct(product.id, {
                image_generation_attempts: [
                    ...(product.image_generation_attempts || []),
                    {
                        id: Date.now().toString(),
                        urls: uploadedUrls,
                        selected: false,
                        created_at: new Date(),
                    }
                ]
            });

            return uploadedUrls;
        } catch (error) {
            console.error('Chyba při generování obrázků:', error);
            throw error;
        }
    }

    // Helper method to parse descriptions
    private parseDescription(fullDescription: string): [string, string] {
        const lines = fullDescription.split('\n').filter(line => line.trim() !== '');

        const shortDescription = lines[0]?.trim().slice(0, 150) || '';
        const longDescription = lines.slice(1).join(' ').trim().slice(0, 300);

        return [shortDescription, longDescription];
    }
}
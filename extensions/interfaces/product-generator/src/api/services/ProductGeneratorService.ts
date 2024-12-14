import { DatabaseService } from './DatabaseService';
import { OpenAI } from 'openai';
import { Replicate } from 'replicate';
import { S3 } from '@aws-sdk/client-s3';
import { Farm, Product } from '../types';

export class ProductGeneratorService {
    private db: DatabaseService;
    private openai: OpenAI;
    private replicate: Replicate;
    private s3: S3;

    constructor() {
        this.db = new DatabaseService();
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN
        });
        this.s3 = new S3({
            endpoint: process.env.DO_SPACES_ENDPOINT,
            credentials: {
                accessKeyId: process.env.DO_SPACES_KEY,
                secretAccessKey: process.env.DO_SPACES_SECRET
            }
        });
    }

    // Metody pro práci s farmami
    async getFarms(): Promise<Farm[]> {
        return this.db.getFarms();
    }

    async createFarm(name: string, farmId: string, file: any): Promise<Farm> {
        // Implementace nahrávání CSV souboru
        return this.db.createFarm(name, farmId, file?.path);
    }

    // Metody pro generování popisků a obrázků
    async generateDescriptions(product: Product): Promise<{
        short_description: string;
        long_description: string;
    }> {
        try {
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

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            const description = response.choices[0].message.content;
            const [shortDescription, longDescription] = this.parseDescription(description);

            // Aktualizace produktu v databázi
            await this.db.updateProduct(product.id, {
                generated_short_description: shortDescription,
                generated_long_description: longDescription
            });

            return {
                short_description: shortDescription,
                long_description: longDescription
            };
        } catch (error) {
            console.error('Chyba při generování popisků:', error);
            throw error;
        }
    }

    async generateImages(product: Product): Promise<string[]> {
        try {
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

            const uploadPromises = output.map(async (imageUrl: string, index: number) => {
                const response = await fetch(imageUrl);
                const buffer = await response.arrayBuffer();

                const key = `products/${product.shop_sku}_${index}.jpg`;
                await this.s3.putObject({
                    Bucket: process.env.DO_SPACES_BUCKET!,
                    Key: key,
                    Body: buffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read'
                });

                return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            // Aktualizace produktu v databázi
            await this.db.updateProduct(product.id, {
                image_generation_attempts: [
                    ...(product.image_generation_attempts || []),
                    {
                        id: Date.now().toString(),
                        urls: uploadedUrls,
                        selected: false,
                        created_at: new Date()
                    }
                ]
            });

            return uploadedUrls;
        } catch (error) {
            console.error('Chyba při generování obrázků:', error);
            throw error;
        }
    }

    private parseDescription(fullDescription: string): [string, string] {
        const lines = fullDescription.split('\n').filter(line => line.trim() !== '');
        
        const shortDescription = lines[0]?.trim().slice(0, 150) || '';
        const longDescription = lines.slice(1).join(' ').trim().slice(0, 300);

        return [shortDescription, longDescription];
    }
}

import Replicate from 'replicate';
import { S3 } from '@aws-sdk/client-s3';
import { Product } from '../types';

export class ImageGeneratorService {
    private replicate: Replicate;
    private s3: S3;

    constructor() {
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

    async generateImages(product: Product): Promise<string[]> {
        const prompt = this.buildImagePrompt(product);

        try {
            const output = await this.replicate.run(
                "black-forest-labs/flux-1.1-pro",
                { input: { prompt } }
            );

            const uploadedUrls = await this.uploadImagesToSpaces(output, product.shop_sku);
            return uploadedUrls;
        } catch (error) {
            console.error('Chyba při generování obrázků:', error);
            throw error;
        }
    }

    private buildImagePrompt(product: Product): string {
        return `
            Product photo of ${product.name}, 
            high quality, professional product photography, 
            white background, studio lighting, 
            detailed and clear image
        `;
    }

    private async uploadImagesToSpaces(images: string[], shopSku: string): Promise<string[]> {
        const uploadPromises = images.map(async (imageUrl, index) => {
            const response = await fetch(imageUrl);
            const buffer = await response.arrayBuffer();

            const key = `products/${shopSku}_${index}.jpg`;
            await this.s3.putObject({
                Bucket: process.env.DO_SPACES_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            });

            return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
        });

        return Promise.all(uploadPromises);
    }
}

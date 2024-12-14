import OpenAI from 'openai';
import { Product } from '../types';

export class TextGeneratorService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateDescriptions(product: Product): Promise<{
        shortDescription: string;
        longDescription: string;
    }> {
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

        try {
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

            return {
                shortDescription,
                longDescription
            };
        } catch (error) {
            console.error('Chyba při generování popisu:', error);
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

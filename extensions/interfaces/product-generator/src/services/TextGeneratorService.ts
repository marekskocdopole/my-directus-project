// src/services/TextGeneratorService.ts
import OpenAI from 'openai';
import Replicate from 'replicate';
import { S3 } from '@aws-sdk/client-s3';

export class TextGeneratorService {
    private openai: OpenAI;
    private replicate: Replicate;
    private s3: S3;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN
        });

        this.s3 = new S3({
            endpoint: process.env.DO_SPACES_ENDPOINT,
            credentials: {
                accessKeyId: process.env.DO_SPACES_KEY!,
                secretAccessKey: process.env.DO_SPACES_SECRET!
            },
            region: 'fra1'
        });
    }

    private upravNazevProduktu(nazev: string): string {
        // Seznam nepotřebných slov
        const zbytecnaSlova = [
            'produkt', 'potravina', 'čerstvé', 'bio', 'organické',
            'selský', 'měkký', 'tučný', 'bílý', 'černý', 'krémový', 'čerstvý'
        ];
        
        // Odstranění množství (např. "1 kg", "5 kg")
        let nazevBezMnozstvi = nazev.replace(/\b\d+\s*kg\b/gi, '').trim();
        
        // Odstranění zbytečných slov
        let slova = nazevBezMnozstvi.split(' ');
        let filtrovanaSLova = slova.filter(slovo => 
            !zbytecnaSlova.includes(slovo.toLowerCase())
        );
        let novyNazev = filtrovanaSLova.join(' ');
        
        // Zkrácení názvu pokud je příliš dlouhý
        if (novyNazev.length > 15) {
            let kratkaSLova = [];
            let delka = 0;
            for (let slovo of filtrovanaSLova) {
                if (delka + slovo.length + 1 <= 15) {
                    kratkaSLova.push(slovo);
                    delka += slovo.length + 1;
                } else {
                    break;
                }
            }
            novyNazev = kratkaSLova.join(' ');
        }
        
        return novyNazev;
    }

    private analyzujCetnostSlov(popisky: string[], maxCetnost: number = 3): string[] {
        const vsechnaSlova: string[] = [];
        const cetnost = new Map<string, number>();
        
        // Získání všech slov
        for (const popisek of popisky) {
            const slova = popisek.toLowerCase().match(/\w+/g) || [];
            for (const slovo of slova) {
                cetnost.set(slovo, (cetnost.get(slovo) || 0) + 1);
            }
        }
        
        // Nalezení často se opakujících slov
        const castaSlova = Array.from(cetnost.entries())
            .filter(([_, pocet]) => pocet > maxCetnost)
            .map(([slovo, _]) => slovo);
            
        return castaSlova;
    }

    private formatPercentages(text: string): string {
        return text.replace(/(\d+)%/g, '$1 %');
    }

    private async translateAndClassify(nazev: string): Promise<[string, string]> {
        const prompt = `
        Přelož následující název produktu do angličtiny a urč jeho typ (pevný, mazlavý, tekutý).

        Název produktu: ${nazev}

        Výstup formátovaný jako:

        Název produktu v angličtině: <translated_name>
        Typ produktu: <type>

        Typy produktu jsou: pevný, mazlavý, tekutý.
        `;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Jsi odborný překladač a klasifikátor produktů." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.2,
            });

            const textResponse = response.choices[0].message.content || '';
            
            // Parsování odpovědi
            const translatedNameMatch = textResponse.match(/Název produktu v angličtině:\s*(.+)/);
            const typeMatch = textResponse.match(/Typ produktu:\s*(\w+)/);

            if (translatedNameMatch && typeMatch) {
                const translatedName = translatedNameMatch[1].trim();
                const productType = typeMatch[1].trim().toLowerCase();
                
                // Převod typu na anglický termín
                const typeTranslation: { [key: string]: string } = {
                    'pevný': 'solid',
                    'mazlavý': 'semi-solid',
                    'tekutý': 'liquid'
                };
                
                const productTypeEnglish = typeTranslation[productType] || 'unknown';
                return [translatedName, productTypeEnglish];
            }
            
            return [nazev, 'unknown'];
        } catch (error) {
            console.error('Chyba při překladu a klasifikaci:', error);
            return [nazev, 'unknown'];
        }
    }

    private async generujPopisky(
        nazev: string,
        charakteristika: string,
        informace: string,
        priprava: string,
        castaSlova: string[],
        predchoziPuvody: string[]
    ): Promise<[string, string, string]> {
        const nazevNormalized = this.upravNazevProduktu(nazev);
        const [productNameEnglish, productType] = await this.translateAndClassify(nazevNormalized);

        const systemPrompt = `
        Jsi zkušený český copywriter specializující se na věcné a informativní produktové popisky 
        pro farmářské potraviny. Píšeš přesné a stylisticky bezchybné popisky v češtině pro 
        online farmářský marketplace zaměřený na gastronomické podniky.
        `;

        const castaSlovaText = castaSlova.length > 0 ? castaSlova.join(', ') : 'žádná';
        
        const userPrompt = `
        Název produktu: ${productNameEnglish}
        Typ produktu: ${productType}
        Charakteristika produktu: ${charakteristika || 'Vymysli zajímavé informace o produktu.'}
        Informace o dodavateli/farmáři: ${informace}
        Způsob přípravy: ${priprava}

        [LONG_DESCRIPTION]
        Napiš dlouhý popisek pro produkt s názvem ${productNameEnglish}, rozdělený do tří odstavců.
        
        [SHORT_DESCRIPTION]
        Napiš 1-2 věty s celkovou maximální délkou 150 znaků.
        `;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            });

            const textResponse = response.choices[0].message.content || '';
            const formattedResponse = this.formatPercentages(textResponse);

            const [longDesc, shortDesc] = formattedResponse.split('[SHORT_DESCRIPTION]');
            const finalLongDesc = this.formatLongDescription(longDesc.replace('[LONG_DESCRIPTION]', '').trim());
            
            return [nazevNormalized, finalLongDesc, shortDesc.trim()];

        } catch (error) {
            console.error('Chyba při generování popisků:', error);
            return ['', '', ''];
        }
    }

    private formatLongDescription(text: string): string {
        const parts = text.split('\n\n');
        let formattedDesc = '';
        
        parts.forEach((part, i) => {
            if (i === 1) {
                formattedDesc += "<p><strong>O původu</strong></p>";
            } else if (i === 2) {
                formattedDesc += "<p><strong>Tipy do kuchyně</strong></p>";
            }
            formattedDesc += `<p>${part}</p>`;
        });
        
        return formattedDesc;
    }

    async generateImage(
        imageName: string, 
        productType: string, 
        sku: string
    ): Promise<string | null> {
        try {
            // Vytvoření promptu podle typu produktu
            let container = '';
            let prompt = '';
            
            if (productType === 'liquid') {
                container = "glass pitcher";
                prompt = `Side view product photo of ${imageName}, placed in a ${container}, ` +
                        `on a clean white background, well-lit and centered. The ${imageName} appears creamy and smooth. No text.`;
            } else if (productType === 'semi-solid') {
                container = "black ceramic bowl";
                prompt = `Side view product photo of ${imageName}, served in a ${container}, ` +
                        `on a clean white background, well-lit and centered. The ${imageName} has a rich and creamy texture. No text.`;
            } else if (productType === 'solid') {
                prompt = `Side view product photo of ${imageName}, placed on a clean white background, ` +
                        `well-lit and centered. The ${imageName} is firm and has a smooth consistency. No text.`;
            } else {
                prompt = `Side view product photo of ${imageName}, placed on a clean white background, ` +
                        `well-lit and centered. No text.`;
            }

            // Přidání negativních promptů
            const negativePrompt = "No watermarks, no text, no logos, no background objects.";
            const fullPrompt = `${prompt} ${negativePrompt}`;

            // Generování obrázku pomocí Replicate
            const output = await this.replicate.run(
                "black-forest-labs/flux-1.1-pro",
                { input: { prompt: fullPrompt } }
            );

            // Získání URL obrázku
            let imageUrl = '';
            if (Array.isArray(output)) {
                imageUrl = output[0];
            } else if (typeof output === 'string') {
                imageUrl = output;
            } else if (output && typeof output === 'object' && 'url' in output) {
                imageUrl = (output as { url: string }).url;
            } else {
                throw new Error('Neplatný formát výstupu z Replicate API');
            }

            // Stažení a uložení obrázku
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const buffer = await response.arrayBuffer();
            
            // Uložení do DigitalOcean Spaces
            const key = `products/${sku}.jpg`;
            await this.s3.putObject({
                Bucket: process.env.DO_SPACES_BUCKET!,
                Key: key,
                Body: buffer,
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            });

            return `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
            
        } catch (error) {
            console.error('Chyba při generování obrázku:', error);
            return null;
        }
    }

    // Hlavní metoda pro zpracování produktu
    async processProduct(productData: any): Promise<any> {
        const {
            name,
            characteristics,
            information,
            preparation,
            previousDescriptions = [],
            sku
        } = productData;

        // Generování popisků
        const [normalizedName, longDesc, shortDesc] = await this.generujPopisky(
            name,
            characteristics,
            information,
            preparation,
            this.analyzujCetnostSlov(previousDescriptions),
            previousDescriptions
        );

        // Překlad a klasifikace pro generování obrázku
        const [translatedName, productType] = await this.translateAndClassify(normalizedName);
        
        // Generování obrázku
        const imageUrl = await this.generateImage(translatedName, productType, sku);

        return {
            name: normalizedName,
            short_description: shortDesc,
            long_description: longDesc,
            image_url: imageUrl,
            product_type: productType
        };
    }
}

// src/api/services/DatabaseService.ts

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Debugging logs
console.log('Začínám načítat DatabaseService');

// Determine __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Hledám .env soubor na cestě:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env soubor nalezen');
    dotenv.config({ path: envPath });
} else {
    console.error('.env soubor nebyl nalezen!');
}

// Log environment variables for database
console.log('Proměnné prostředí pro databázi:', {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_USER: process.env.DB_USER
});

export class DatabaseService {
    private pool: Pool;

    constructor() {
        console.log('Vytvářím připojení k databázi');
        
        // Check required environment variables
        if (!process.env.DB_HOST) {
            throw new Error('DB_HOST není nastaven v prostředí');
        }
        if (!process.env.DB_USER) {
            throw new Error('DB_USER není nastaven v prostředí');
        }
        if (!process.env.DB_DATABASE) {
            throw new Error('DB_DATABASE není nastaven v prostředí');
        }
        if (!process.env.DB_PASSWORD) {
            throw new Error('DB_PASSWORD není nastaven v prostředí');
        }
        if (!process.env.DB_PORT) {
            console.warn('DB_PORT není nastaven, používám výchozí hodnotu 5432');
        }

        this.pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432'),
        });

        console.log('Připojení k databázi vytvořeno');
    }

    public getPool(): Pool {
        return this.pool;
    }

    async testConnection(): Promise<void> {
        try {
            console.log('Zkouším připojení k databázi...');
            const result = await this.pool.query('SELECT NOW()');
            console.log('Připojení k databázi je funkční:', result.rows[0]);
        } catch (error) {
            console.error('Chyba při připojení k databázi:', error);
            throw error;
        }
    }

    async createTables(): Promise<void> {
        try {
            // Create UUID extension
            await this.pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            
            // Create farms table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS product_generator_farms (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name VARCHAR(255) NOT NULL,
                    farm_id VARCHAR(255) NOT NULL UNIQUE,
                    import_file UUID REFERENCES directus_files(id) ON DELETE SET NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create products table
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS product_generator_products (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    farm_id UUID REFERENCES product_generator_farms(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    shop_sku VARCHAR(255) NOT NULL UNIQUE,
                    generated_short_description TEXT,
                    generated_long_description TEXT,
                    ingredients TEXT,
                    selected_image_url TEXT,
                    status VARCHAR(50) NOT NULL DEFAULT 'draft',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create indices for products
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_product_generator_products_farm_id ON product_generator_products(farm_id);
                CREATE INDEX IF NOT EXISTS idx_product_generator_products_status ON product_generator_products(status);
            `);

            console.log('Tabulky byly úspěšně vytvořeny');
        } catch (error) {
            console.error('Chyba při vytváření tabulek:', error);
            throw error;
        }
    }

    async closeConnection(): Promise<void> {
        await this.pool.end();
    }

    // Methods for working with products
    async getProducts(farmId: string): Promise<any[]> {
        const result = await this.pool.query('SELECT * FROM product_generator_products WHERE farm_id = $1', [farmId]);
        return result.rows;
    }

    async getProductById(id: string): Promise<any | null> {
        const result = await this.pool.query('SELECT * FROM product_generator_products WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    async updateProduct(id: string, data: Partial<any>): Promise<void> {
        const fields = Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const values = Object.values(data);
        if (fields.length === 0) {
            throw new Error('No fields provided for update');
        }
        await this.pool.query(`UPDATE product_generator_products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1}`, [...values, id]);
    }

    async getProductHistory(productId: string): Promise<any[]> {
        const result = await this.pool.query('SELECT * FROM product_history WHERE product_id = $1 ORDER BY created_at DESC', [productId]);
        return result.rows;
    }

    async getFarms(): Promise<any[]> {
        const result = await this.pool.query('SELECT * FROM product_generator_farms');
        return result.rows;
    }

    async createFarm(name: string, farmId: string, filePath?: string): Promise<any> {
        const result = await this.pool.query(
            `INSERT INTO product_generator_farms (name, farm_id, import_file) VALUES ($1, $2, $3) RETURNING *`,
            [name, farmId, filePath]
        );
        return result.rows[0];
    }
}

console.log('DatabaseService načten');
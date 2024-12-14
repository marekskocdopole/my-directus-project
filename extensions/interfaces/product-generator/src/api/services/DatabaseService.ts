import pg from 'pg';
import type { Pool as PoolType } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

console.log('Začínám načítat DatabaseService');

// Řešení pro ES moduly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitní načtení .env souboru
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Hledám .env soubor na cestě:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env soubor nalezen');
    dotenv.config({ path: envPath });
} else {
    console.error('.env soubor nebyl nalezen!');
}

// Výpis všech načtených proměnných prostředí
console.log('Proměnné prostředí pro databázi:', {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_USER: process.env.DB_USER
});

export class DatabaseService {
    private pool: PoolType;

    constructor() {
        console.log('Vytvářím připojení k databázi');
        
        // Přidáme další kontroly před vytvořením připojení
        if (!process.env.DB_HOST) {
            throw new Error('DB_HOST není nastaven v prostředí');
        }

        this.pool = new pg.Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432'),
        });

        console.log('Připojení k databázi vytvořeno');
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
            // Nejdřív vytvoříme UUID rozšíření
            await this.pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            
            // Vytvoříme tabulku farms
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS product_generator_farms (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name VARCHAR(255) NOT NULL,
                    farm_id VARCHAR(255) NOT NULL UNIQUE,
                    import_file VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
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
}

console.log('DatabaseService načten');
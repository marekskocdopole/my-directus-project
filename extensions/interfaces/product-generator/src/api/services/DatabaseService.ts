import { Pool } from 'pg';
import type { Farm, Product } from '@/types';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseService {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432'),
        });
    }

    // Metody pro práci s farmami
    async getFarms(): Promise<Farm[]> {
        const query = `
            SELECT * 
            FROM product_generator_farms 
            ORDER BY created_at DESC
        `;
        const result = await this.pool.query(query);
        return result.rows;
    }

    async createFarm(name: string, farmId: string, importFile?: string): Promise<Farm> {
        const query = `
            INSERT INTO product_generator_farms 
            (name, farm_id, import_file)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await this.pool.query(query, [name, farmId, importFile]);
        return result.rows[0];
    }

    // Metody pro práci s produkty
    async getProducts(farmId: string): Promise<Product[]> {
        const query = `
            SELECT * 
            FROM product_generator_products 
            WHERE farm_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await this.pool.query(query, [farmId]);
        return result.rows;
    }

    async createProduct(product: Partial<Product>): Promise<Product> {
        const query = `
            INSERT INTO product_generator_products (
                farm_id, 
                name, 
                shop_sku, 
                generated_short_description, 
                generated_long_description,
                ingredients, 
                selected_image_url, 
                image_generation_attempts,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const values = [
            product.farm_id,
            product.name,
            product.shop_sku,
            product.generated_short_description || '',
            product.generated_long_description || '',
            product.ingredients || '',
            product.selected_image_url || '',
            JSON.stringify(product.image_generation_attempts || []),
            product.status || 'draft'
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
        const setStatements: string[] = [];
        const values: any[] = [];
        let paramCounter = 1;

        Object.entries(product).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id') {
                setStatements.push(`${key} = $${paramCounter}`);
                values.push(value);
                paramCounter++;
            }
        });

        const query = `
            UPDATE product_generator_products 
            SET ${setStatements.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCounter}
            RETURNING *
        `;
        values.push(id);

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Inicializace databáze
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

            // Vytvoříme tabulku products
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
                    image_generation_attempts JSONB DEFAULT '[]',
                    status VARCHAR(50) DEFAULT 'draft',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Vytvoříme indexy
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_pg_products_farm_id 
                ON product_generator_products(farm_id);
            `);

            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_pg_products_shop_sku 
                ON product_generator_products(shop_sku);
            `);

            console.log('Tabulky byly úspěšně vytvořeny');
        } catch (error) {
            console.error('Chyba při vytváření tabulek:', error);
            throw error;
        }
    }

    // Test připojení
    async testConnection(): Promise<void> {
        try {
            const result = await this.pool.query('SELECT NOW()');
            console.log('Připojení k databázi je funkční:', result.rows[0]);
        } catch (error) {
            console.error('Chyba při připojení k databázi:', error);
            throw error;
        }
    }
}

// Inicializace a test
const db = new DatabaseService();
db.testConnection()
    .then(() => db.createTables())
    .then(() => console.log('Inicializace databáze dokončena'))
    .catch(error => console.error('Chyba při inicializaci:', error));

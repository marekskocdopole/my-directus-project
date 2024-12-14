import express from 'express';
import dotenv from 'dotenv';
import productRoutes from '../api/routes';
import { DatabaseService } from '../api/services/DatabaseService';

// Načtení environmetálních proměnných
dotenv.config();

class Server {
    private app: express.Application;
    private port: number;
    private dbService: DatabaseService;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || '3000');
        this.dbService = new DatabaseService();

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeDatabase();
    }

    private initializeMiddlewares() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes() {
        this.app.use('/api/ext/product-generator', productRoutes);

        // Základní error handling middleware
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error(err.stack);
            res.status(500).send({
                status: 'error',
                message: err.message || 'Něco se pokazilo'
            });
        });
    }

    private async initializeDatabase() {
        try {
            await this.dbService.createTables();
            console.log('Databázové tabulky byly úspěšně inicializovány');
        } catch (error) {
            console.error('Chyba při inicializaci databáze:', error);
        }
    }

    public start() {
        this.app.listen(this.port, () => {
            console.log(`Serverběží na portu ${this.port}`);
        });
    }
}

export default new Server();

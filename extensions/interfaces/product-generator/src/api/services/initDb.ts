import { DatabaseService } from './DatabaseService';

async function initDatabase() {
    const db = new DatabaseService();
    try {
        await db.createTables();
        console.log('Tabulky byly úspěšně vytvořeny');
    } catch (error) {
        console.error('Chyba při vytváření tabulek:', error);
    }
}

initDatabase();

console.log('Start inicializace');
console.log('Verze Node.js:', process.version);
console.log('Argumenty:', process.argv);
console.log('Proměnné prostředí:', Object.keys(process.env));

async function main() {
  try {
    console.log('Začínám import DatabaseService');
    const module = await import('./DatabaseService.js');
    console.log('Modul importován:', Object.keys(module));
    
    const DatabaseService = module.DatabaseService;
    console.log('DatabaseService nalezen');

    const db = new DatabaseService();
    console.log('Instance DatabaseService vytvořena');

    await db.testConnection();
    console.log('Připojení k databázi úspěšné');

    await db.createTables();
    console.log('Tabulky vytvořeny');
  } catch (error) {
    console.error('Kritická chyba:', error);
    if (error instanceof Error) {
      console.error('Název chyby:', error.name);
      console.error('Zpráva:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

main().catch(console.error);
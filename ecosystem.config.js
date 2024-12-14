require('dotenv').config(); // Přidáno pro načítání .env souborů

module.exports = {
  apps: [{
    name: 'directus',
    script: 'npx directus start',
    env: {
      NODE_ENV: 'production',
      ...process.env // Rozbalení všech proměnných z .env
    }
  }]
};
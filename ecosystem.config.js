module.exports = {
  apps: [{
    name: 'directus',
    script: 'npx directus start',
    env: {
      NODE_ENV: 'production',
      DB_CLIENT: process.env.DB_CLIENT,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_DATABASE: process.env.DB_DATABASE,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
      DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT,
      DO_SPACES_KEY: process.env.DO_SPACES_KEY,
      DO_SPACES_SECRET: process.env.DO_SPACES_SECRET,
      KEY: process.env.KEY,
      SECRET: process.env.SECRET
    }
  }]
};
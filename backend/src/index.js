const app = require('./app');
const config = require('./config');
const prisma = require('./lib/prisma');
const { connectRedis } = require('./lib/redis');

async function start() {
  await connectRedis();
  console.log('Connected to Redis');

  await prisma.$connect();
  console.log('Connected to PostgreSQL');

  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
    console.log(`Swagger docs at http://localhost:${config.port}/api-docs`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

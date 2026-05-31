const net = require('net');

async function waitForPostgres(maxAttempts = 30) {
  const url = new URL(process.env.DATABASE_URL);
  const host = url.hostname;
  const port = parseInt(url.port || '5432', 10);

  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ host, port }, () => {
          socket.end();
          resolve();
        });
        socket.on('error', reject);
        socket.setTimeout(2000, () => {
          socket.destroy();
          reject(new Error('timeout'));
        });
      });
      console.log('PostgreSQL is ready.');
      return;
    } catch {
      console.log('Waiting for PostgreSQL...');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('PostgreSQL not available');
}

async function main() {
  await waitForPostgres();
  const { execSync } = require('child_process');
  console.log('Running migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Running seed...');
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  console.log('Starting API...');
  require('../src/index.js');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

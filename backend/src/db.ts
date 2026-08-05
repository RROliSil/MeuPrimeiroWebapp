import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgrespassword@db:5432/meudatabase',
});

export async function initDb() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS apps (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      logo TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const client = await pool.connect();
    await client.query(createTableQuery);

    // Verificar se a tabela está vazia e inserir dados iniciais de demonstração
    const countRes = await client.query('SELECT COUNT(*) FROM apps;');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('[DB] Inserindo aplicativos iniciais de exemplo...');
      const seedApps = [
        {
          name: 'Portainer',
          url: 'http://192.168.2.72:9000',
          logo: 'https://raw.githubusercontent.com/portainer/portainer/develop/app/assets/ico/favicon-32x32.png',
          position: 0,
        },
        {
          name: 'GitHub',
          url: 'https://github.com/RROliSil/MeuPrimeiroWebapp',
          logo: 'https://github.githubassets.com/favicons/favicon.png',
          position: 1,
        },
        {
          name: 'Google',
          url: 'https://google.com',
          logo: 'https://www.google.com/favicon.ico',
          position: 2,
        },
        {
          name: 'pgAdmin',
          url: 'http://192.168.2.72:5050',
          logo: 'https://www.pgadmin.org/static/favicon.ico',
          position: 3,
        },
      ];

      for (const app of seedApps) {
        await client.query(
          'INSERT INTO apps (name, url, logo, position) VALUES ($1, $2, $3, $4);',
          [app.name, app.url, app.logo, app.position]
        );
      }
    }

    client.release();
    console.log('[DB] Tabela "apps" verificada e pronta para uso.');
  } catch (error) {
    console.error('[DB] Erro ao inicializar o banco de dados:', error);
  }
}

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgrespassword@db:5432/meudatabase',
});

export async function initDb() {
  const createAppsTableQuery = `
    CREATE TABLE IF NOT EXISTS apps (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      logo TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const client = await pool.connect();
    
    // Criar tabelas
    await client.query(createAppsTableQuery);
    await client.query(createUsersTableQuery);

    // Verificar e criar usuário admin padrão (admin / admin1)
    const adminCheck = await client.query('SELECT * FROM users WHERE username = $1;', ['admin']);
    if (adminCheck.rows.length === 0) {
      console.log('[DB] Criando usuário admin padrão (admin / admin1)...');
      await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3);',
        ['admin', 'admin1', 'admin']
      );
    }

    // Verificar se a tabela de apps está vazia e inserir dados iniciais de demonstração
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
    console.log('[DB] Tabelas "apps" e "users" verificadas e prontas para uso.');
  } catch (error) {
    console.error('[DB] Erro ao inicializar o banco de dados:', error);
  }
}

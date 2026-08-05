import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/meudatabase',
});

// Rotas da API
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API Node.js + Express + TypeScript rodando com sucesso!' });
});

app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const client = await pool.connect();
    dbStatus = 'connected';
    client.release();
  } catch (err) {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    message: 'Backend Express + TS está ativo!',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Servidor rodando na porta ${PORT}`);
});

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDb } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Aumentar o limite do body-parser para permitir envio de imagens Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializa o banco de dados
initDb();

// Rota de Healthcheck
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
    message: 'Backend SHELF API está ativo!',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Listar todos os apps ordenados por posição
app.get('/api/apps', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM apps ORDER BY position ASC, id ASC;');
    res.json(rows);
  } catch (error) {
    console.error('[API] Erro ao buscar aplicativos:', error);
    res.status(500).json({ error: 'Erro ao buscar aplicativos' });
  }
});

// Criar um novo aplicativo
app.post('/api/apps', async (req: Request, res: Response) => {
  const { name, url, logo } = req.body;

  if (!name || !url || !logo) {
    return res.status(400).json({ error: 'Nome, URL e Logo são obrigatórios.' });
  }

  try {
    // Obter a maior posição atual para colocar o novo app no final
    const maxPosRes = await pool.query('SELECT COALESCE(MAX(position), -1) as max_pos FROM apps;');
    const nextPos = maxPosRes.rows[0].max_pos + 1;

    const insertRes = await pool.query(
      'INSERT INTO apps (name, url, logo, position) VALUES ($1, $2, $3, $4) RETURNING *;',
      [name, url, logo, nextPos]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('[API] Erro ao criar aplicativo:', error);
    res.status(500).json({ error: 'Erro ao salvar aplicativo' });
  }
});

// Atualizar a ordem (reorder) dos aplicativos após Drag-and-Drop
app.put('/api/apps/reorder', async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: number; position: number }[] };

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Formato inválido. Esperado array "items".' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query('UPDATE apps SET position = $1 WHERE id = $2;', [
          item.position,
          item.id,
        ]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ message: 'Ordem dos aplicativos atualizada com sucesso!' });
  } catch (error) {
    console.error('[API] Erro ao reordenar aplicativos:', error);
    res.status(500).json({ error: 'Erro ao reordenar aplicativos' });
  }
});

// Editar um aplicativo existente
app.put('/api/apps/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, url, logo } = req.body;

  if (!name || !url || !logo) {
    return res.status(400).json({ error: 'Nome, URL e Logo são obrigatórios.' });
  }

  try {
    const updateRes = await pool.query(
      'UPDATE apps SET name = $1, url = $2, logo = $3 WHERE id = $4 RETURNING *;',
      [name, url, logo, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Aplicativo não encontrado.' });
    }

    res.json(updateRes.rows[0]);
  } catch (error) {
    console.error('[API] Erro ao editar aplicativo:', error);
    res.status(500).json({ error: 'Erro ao editar aplicativo' });
  }
});

// Excluir um aplicativo
app.delete('/api/apps/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleteRes = await pool.query('DELETE FROM apps WHERE id = $1 RETURNING *;', [id]);

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Aplicativo não encontrado.' });
    }

    res.json({ message: 'Aplicativo excluído com sucesso!' });
  } catch (error) {
    console.error('[API] Erro ao deletar aplicativo:', error);
    res.status(500).json({ error: 'Erro ao deletar aplicativo' });
  }
});

app.listen(PORT, () => {
  console.log(`[Server SHELF] Servidor rodando na porta ${PORT}`);
});

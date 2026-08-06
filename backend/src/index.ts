import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDb } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

/* ==========================================================================
   ROTAS DE AUTENTICAÇÃO E USUÁRIOS
   ========================================================================== */

// Login de usuário
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, password, role FROM users WHERE LOWER(username) = LOWER($1);',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    const user = rows[0];

    if (user.password !== password) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('[API] Erro ao realizar login:', error);
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

// Registro de novo usuário
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'O nome de usuário deve ter pelo menos 3 caracteres.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 4 caracteres.' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1);',
      [username.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Nome de usuário já está em uso.' });
    }

    const role = 'user'; // Novo registro por padrão é perfil 'user'

    const insertRes = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role;',
      [username.trim(), password, role]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('[API] Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

// Listar todos os usuários (para o painel de permissões)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC;');
    res.json(rows);
  } catch (error) {
    console.error('[API] Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Atualizar permissão/cargo de um usuário (user/admin)
app.put('/api/users/:id/role', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ error: 'Role deve ser "user" ou "admin".' });
  }

  try {
    // Verificar se é o usuário admin principal
    const userCheck = await pool.query('SELECT username FROM users WHERE id = $1;', [id]);
    if (userCheck.rows.length > 0 && userCheck.rows[0].username.toLowerCase() === 'admin') {
      return res.status(400).json({ error: 'O usuário admin principal não pode ter sua permissão alterada.' });
    }

    const updateRes = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role;',
      [role, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(updateRes.rows[0]);
  } catch (error) {
    console.error('[API] Erro ao alterar papel do usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar permissão' });
  }
});

/* ==========================================================================
   ROTAS DE APLICATIVOS
   ========================================================================== */

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

// Importar múltiplos aplicativos/favoritos em lote (batch)
app.post('/api/apps/batch', async (req: Request, res: Response) => {
  const { apps } = req.body as { apps: { name: string; url: string; logo?: string }[] };

  if (!Array.isArray(apps) || apps.length === 0) {
    return res.status(400).json({ error: 'Nenhum aplicativo para importar.' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const maxPosRes = await client.query('SELECT COALESCE(MAX(position), -1) as max_pos FROM apps;');
      let currentPos = maxPosRes.rows[0].max_pos + 1;

      const inserted = [];
      for (const item of apps) {
        if (!item.name || !item.url) continue;

        let domain = '';
        try {
          domain = new URL(item.url).hostname;
        } catch (e) {
          domain = '';
        }

        // Se a logo for vazia ou for um ícone base64 pequeno, preferir o serviço de ícone HD da icon.horse / Google sz=128
        let logo = item.logo || '';
        if (!logo || logo.startsWith('data:image')) {
          if (domain) {
            logo = `https://icon.horse/icon/${domain}`;
          }
        }

        if (!logo) continue;

        const resInsert = await client.query(
          'INSERT INTO apps (name, url, logo, position) VALUES ($1, $2, $3, $4) RETURNING *;',
          [item.name.trim().substring(0, 100), item.url.trim(), logo, currentPos++]
        );
        inserted.push(resInsert.rows[0]);
      }
      await client.query('COMMIT');
      res.status(201).json({ message: `${inserted.length} favoritos importados com sucesso!`, count: inserted.length, items: inserted });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[API] Erro ao importar aplicativos em lote:', error);
    res.status(500).json({ error: 'Erro ao importar favoritos em lote' });
  }
});

// Otimizar e atualizar todos os ícones cadastrados para alta resolução (HD)
app.post('/api/apps/optimize-icons', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM apps;');
    const client = await pool.connect();
    let updatedCount = 0;

    try {
      await client.query('BEGIN');
      for (const appItem of rows) {
        try {
          const domain = new URL(appItem.url).hostname;
          if (domain) {
            const hdLogo = `https://icon.horse/icon/${domain}`;
            await client.query('UPDATE apps SET logo = $1 WHERE id = $2;', [hdLogo, appItem.id]);
            updatedCount++;
          }
        } catch (e) {
          // Ignorar URLs inválidas
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const updatedApps = await pool.query('SELECT * FROM apps ORDER BY position ASC, id ASC;');
    res.json({ message: `${updatedCount} ícones atualizados para Alta Resolução (HD)!`, items: updatedApps.rows });
  } catch (error) {
    console.error('[API] Erro ao otimizar ícones:', error);
    res.status(500).json({ error: 'Erro ao otimizar ícones para HD' });
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

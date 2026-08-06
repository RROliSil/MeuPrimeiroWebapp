import type { AppItem, AppInput } from '../types/app';
import type { User, UserRole, AuthResponse } from '../types/auth';

const API_BASE_URL = '/api';

/* ==========================================================================
   APLICATIVOS
   ========================================================================== */

export async function fetchApps(): Promise<AppItem[]> {
  const res = await fetch(`${API_BASE_URL}/apps`);
  if (!res.ok) {
    throw new Error('Falha ao carregar aplicativos');
  }
  return res.json();
}

export async function createApp(data: AppInput): Promise<AppItem> {
  const res = await fetch(`${API_BASE_URL}/apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Falha ao cadastrar aplicativo');
  }
  return res.json();
}

export async function updateApp(id: number, data: AppInput): Promise<AppItem> {
  const res = await fetch(`${API_BASE_URL}/apps/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Falha ao atualizar aplicativo');
  }
  return res.json();
}

export async function deleteApp(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/apps/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Falha ao excluir aplicativo');
  }
}

export async function reorderApps(items: { id: number; position: number }[]): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/apps/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error('Falha ao atualizar ordenação');
  }
}

export async function createAppsBatch(apps: AppInput[]): Promise<{ count: number; message: string }> {
  const res = await fetch(`${API_BASE_URL}/apps/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apps }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao importar aplicativos em lote');
  }
  return data;
}

/* ==========================================================================
   AUTENTICAÇÃO E USUÁRIOS
   ========================================================================== */

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao realizar login');
  }
  return data;
}

export async function registerUser(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao registrar usuário');
  }
  return data;
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/users`);
  if (!res.ok) {
    throw new Error('Falha ao carregar lista de usuários');
  }
  return res.json();
}

export async function updateUserRole(id: number, role: UserRole): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao atualizar permissão do usuário');
  }
  return data;
}

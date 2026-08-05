import type { AppItem, AppInput } from '../types/app';

const API_BASE_URL = '/api';

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

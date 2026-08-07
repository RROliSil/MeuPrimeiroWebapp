import React, { useState } from 'react';
import type { AppItem } from '../types/app';
import { AppCard } from './AppCard';
import { reorderApps } from '../services/api';

interface AppGridProps {
  apps: AppItem[];
  setApps: React.Dispatch<React.SetStateAction<AppItem[]>>;
}

export const AppGrid: React.FC<AppGridProps> = ({ apps, setApps }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Define transparência ou classe visual
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === index) return;

    // Realiza a reordenação em tempo real visualmente
    const updatedApps = [...apps];
    const [draggedItem] = updatedApps.splice(draggedIndex, 1);
    updatedApps.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setApps(updatedApps);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedIndex(null);

    // Mapeia novas posições e salva no banco de dados via API
    const itemsToUpdate = apps.map((app, idx) => ({
      id: app.id,
      position: idx,
    }));

    try {
      await reorderApps(itemsToUpdate);
    } catch (err) {
      console.error('Erro ao salvar reordenação:', err);
    }
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      setDraggedIndex(null);
      // Garante persistência
      const itemsToUpdate = apps.map((app, idx) => ({
        id: app.id,
        position: idx,
      }));
      try {
        await reorderApps(itemsToUpdate);
      } catch (err) {
        console.error('Erro ao salvar reordenação:', err);
      }
    }
  };

  if (apps.length === 0) {
    return (
      <div className="empty-grid">
        <p>Nenhum aplicativo cadastrado ainda.</p>
        <span className="empty-subtext">Acesse o <strong>Painel Admin</strong> para adicionar seus primeiros ícones!</span>
      </div>
    );
  }

  return (
    <div className="app-grid">
      {apps.map((app, index) => (
        <AppCard
          key={app.id}
          app={app}
          index={index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={draggedIndex === index}
        />
      ))}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import type { AppItem } from '../types/app';
import { fetchApps, createApp, updateApp, deleteApp } from '../services/api';

export const AdminPage: React.FC = () => {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [previewLogo, setPreviewLogo] = useState<string>('');

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await fetchApps();
      setApps(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao carregar aplicativos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  // Manipular upload de arquivo de imagem de logo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecione um arquivo de imagem válido.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoBase64(result);
        setPreviewLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLogoUrl(val);
    setPreviewLogo(val);
  };

  const handleEdit = (app: AppItem) => {
    setEditingId(app.id);
    setName(app.name);
    setUrl(app.url);
    if (app.logo.startsWith('data:image')) {
      setLogoMode('upload');
      setLogoBase64(app.logo);
      setPreviewLogo(app.logo);
    } else {
      setLogoMode('url');
      setLogoUrl(app.logo);
      setPreviewLogo(app.logo);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setUrl('');
    setLogoUrl('');
    setLogoBase64('');
    setPreviewLogo('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este aplicativo?')) return;
    try {
      await deleteApp(id);
      setMessage({ type: 'success', text: 'Aplicativo removido com sucesso!' });
      loadApps();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao excluir o aplicativo.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLogo = logoMode === 'upload' ? logoBase64 : logoUrl;

    if (!name.trim() || !url.trim() || !finalLogo.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos e adicione o logo.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (editingId) {
        await updateApp(editingId, { name, url, logo: finalLogo });
        setMessage({ type: 'success', text: 'Aplicativo atualizado com sucesso!' });
      } else {
        await createApp({ name, url, logo: finalLogo });
        setMessage({ type: 'success', text: 'Novo aplicativo cadastrado com sucesso!' });
      }

      handleCancelEdit();
      loadApps();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao salvar o aplicativo.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="admin-header">
        <h2>⚙️ Painel Administrativo</h2>
        <p>Gerencie seus links e ícones do SHELF. Adicione, edite ou remova aplicativos.</p>
      </div>

      {message && (
        <div className={`alert-banner ${message.type}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}
      <div className="admin-card-box">
        <h3>{editingId ? '✏️ Editar Aplicativo' : '➕ Adicionar Novo Aplicativo'}</h3>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="appName">Nome do App:</label>
            <input
              id="appName"
              type="text"
              placeholder="Ex: GitHub, Portainer, Notion..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="appUrl">URL do Link:</label>
            <input
              id="appUrl"
              type="url"
              placeholder="Ex: https://github.com ou http://192.168.2.72:9000"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Logo do App:</label>
            <div className="logo-mode-selector">
              <button
                type="button"
                className={`mode-btn ${logoMode === 'upload' ? 'active' : ''}`}
                onClick={() => setLogoMode('upload')}
              >
                📁 Anexar Arquivo de Imagem
              </button>
              <button
                type="button"
                className={`mode-btn ${logoMode === 'url' ? 'active' : ''}`}
                onClick={() => setLogoMode('url')}
              >
                🔗 Usar URL de Imagem
              </button>
            </div>

            {logoMode === 'upload' ? (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input"
              />
            ) : (
              <input
                type="url"
                placeholder="Ex: https://exemplo.com/logo.png"
                value={logoUrl}
                onChange={handleUrlChange}
              />
            )}
          </div>

          {/* PREVIEW DO LOGO */}
          {previewLogo && (
            <div className="logo-preview-box">
              <span>Pré-visualização do Ícone:</span>
              <div className="preview-card">
                <img src={previewLogo} alt="Preview" className="preview-img" />
                <span>{name || 'Nome do App'}</span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salva...' : editingId ? 'Atualizar App' : 'Cadastrar App'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LISTA DE APLICATIVOS EXISTENTES */}
      <div className="admin-list-section">
        <h3>📋 Aplicativos Cadastrados ({apps.length})</h3>
        {loading ? (
          <p>Carregando aplicativos...</p>
        ) : apps.length === 0 ? (
          <p className="text-muted">Nenhum aplicativo cadastrado ainda.</p>
        ) : (
          <div className="admin-apps-table-container">
            <table className="admin-apps-table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nome</th>
                  <th>URL</th>
                  <th>Posição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <img src={app.logo} alt={app.name} className="table-logo-img" />
                    </td>
                    <td>
                      <strong>{app.name}</strong>
                    </td>
                    <td>
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="table-link">
                        {app.url}
                      </a>
                    </td>
                    <td>{app.position}</td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => handleEdit(app)} className="btn-action edit">
                          ✏️ Editar
                        </button>
                        <button onClick={() => handleDelete(app.id)} className="btn-action delete">
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

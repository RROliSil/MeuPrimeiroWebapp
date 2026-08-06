import React, { useEffect, useState } from 'react';
import type { AppItem } from '../types/app';
import type { User, UserRole } from '../types/auth';
import { fetchApps, createApp, updateApp, deleteApp, fetchUsers, updateUserRole, optimizeAppIcons } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookmarkImporter } from '../components/BookmarkImporter';

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'apps' | 'users'>('apps');
  const [showBookmarkImporter, setShowBookmarkImporter] = useState<boolean>(false);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOptimizeIcons = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await optimizeAppIcons();
      setMessage({ type: 'success', text: res.message });
      loadData();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Erro ao otimizar ícones.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  // App Form states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [previewLogo, setPreviewLogo] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, usersData] = await Promise.all([fetchApps(), fetchUsers()]);
      setApps(appsData);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao carregar dados do sistema.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      loadData();
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
      loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao salvar o aplicativo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: number, currentRole: UserRole) => {
    const newRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
    if (
      !window.confirm(
        `Deseja alterar a permissão do usuário para "${newRole.toUpperCase()}"?`
      )
    ) {
      return;
    }

    try {
      await updateUserRole(userId, newRole);
      setMessage({ type: 'success', text: 'Permissão de usuário atualizada com sucesso!' });
      loadData();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Erro ao alterar permissão do usuário.';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  return (
    <div className="page-container">
      <div className="admin-header">
        <h2>⚙️ Painel Administrativo</h2>
        <p>Gerencie aplicativos e controle as permissões dos usuários do SHELF.</p>
      </div>

      <div className="admin-tab-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'apps' ? 'active' : ''}`}
          onClick={() => setActiveTab('apps')}
        >
          📱 Aplicativos ({apps.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuários e Permissões ({users.length})
        </button>
      </div>

      {message && (
        <div className={`alert-banner ${message.type}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {activeTab === 'apps' ? (
        <>
          {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}
          <div className="admin-card-box">
            <div className="admin-card-box-header">
              <h3>{editingId ? '✏️ Editar Aplicativo' : '➕ Adicionar Novo Aplicativo'}</h3>
              <div className="admin-header-actions">
                <button
                  type="button"
                  className="btn-hd-optimize"
                  onClick={handleOptimizeIcons}
                  title="Atualizar todos os ícones para alta resolução (HD)"
                >
                  ✨ Converter Ícones para HD
                </button>
                <button
                  type="button"
                  className="btn-star-import"
                  onClick={() => setShowBookmarkImporter(true)}
                >
                  ⭐ Importar Favoritos do Navegador
                </button>
              </div>
            </div>
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
                  {saving ? 'Salvando...' : editingId ? 'Atualizar App' : 'Cadastrar App'}
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
            <h3>📋 Aplicativos Cadastrados</h3>
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
        </>
      ) : (
        /* LISTA DE USUÁRIOS E PERMISSÕES */
        <div className="admin-list-section">
          <h3>👥 Controle de Permissões de Usuários</h3>
          {loading ? (
            <p>Carregando usuários...</p>
          ) : users.length === 0 ? (
            <p className="text-muted">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="admin-apps-table-container">
              <table className="admin-apps-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome de Usuário</th>
                    <th>Permissão (Role)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMainAdmin = u.username.trim().toLowerCase() === 'admin';
                    const isSelf = currentUser && (
                      String(u.id) === String(currentUser.id) ||
                      u.username.trim().toLowerCase() === currentUser.username.trim().toLowerCase()
                    );

                    return (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td>
                          <strong>👤 {u.username}</strong>
                        </td>
                        <td>
                          <span className={`user-role-pill ${u.role}`}>
                            {u.role === 'admin' ? '⚙️ Admin' : '👤 Usuário'}
                          </span>
                        </td>
                        <td>
                          {isMainAdmin ? (
                            <span className="text-muted text-sm">🔒 Admin Principal</span>
                          ) : isSelf ? (
                            <span className="text-muted text-sm">🔒 Seu Perfil</span>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u.id, u.role)}
                              className={`btn-action ${u.role === 'admin' ? 'delete' : 'edit'}`}
                            >
                              {u.role === 'admin' ? '⬇️ Rebaixar para Usuário' : '⬆️ Promover a Admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showBookmarkImporter && (
        <BookmarkImporter
          onSuccess={() => {
            setShowBookmarkImporter(false);
            setMessage({ type: 'success', text: 'Favoritos do navegador importados com sucesso!' });
            loadData();
          }}
          onClose={() => setShowBookmarkImporter(false)}
        />
      )}
    </div>
  );
};

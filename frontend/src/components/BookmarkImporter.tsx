import React, { useState } from 'react';
import type { AppInput } from '../types/app';
import { createAppsBatch } from '../services/api';

interface ParsedBookmark extends AppInput {
  selected: boolean;
}

interface BookmarkImporterProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const BookmarkImporter: React.FC<BookmarkImporterProps> = ({ onSuccess, onClose }) => {
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState<boolean>(true);

  const processHtmlFile = (file: File) => {
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setError('Não foi possível ler o conteúdo do arquivo.');
        return;
      }

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const anchors = Array.from(doc.querySelectorAll('a'));

        const bookmarks: ParsedBookmark[] = [];
        const seenUrls = new Set<string>();

        for (const a of anchors) {
          const href = a.getAttribute('href')?.trim() || '';
          if (!href.startsWith('http://') && !href.startsWith('https://')) {
            continue;
          }

          const title = a.textContent?.trim() || a.getAttribute('title') || 'Favorito Sem Nome';
          const iconAttr = a.getAttribute('icon') || a.getAttribute('ICON') || a.getAttribute('Icon');

          let logo = '';
          if (iconAttr && iconAttr.startsWith('data:image')) {
            logo = iconAttr;
          } else {
            try {
              const domain = new URL(href).hostname;
              logo = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch {
              logo = '';
            }
          }

          if (!logo || seenUrls.has(href)) continue;
          seenUrls.add(href);

          bookmarks.push({
            name: title.substring(0, 100),
            url: href,
            logo,
            selected: true,
          });
        }

        if (bookmarks.length === 0) {
          setError('Nenhum favorito com URL válida encontrado neste arquivo HTML.');
        } else {
          setParsedBookmarks(bookmarks);
          setSelectAll(true);
        }
      } catch (err) {
        console.error(err);
        setError('Falha ao analisar o arquivo de favoritos. Certifique-se de que é um arquivo HTML válido exportado do seu navegador.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processHtmlFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processHtmlFile(file);
    }
  };

  const toggleSelectAll = () => {
    const nextState = !selectAll;
    setSelectAll(nextState);
    setParsedBookmarks((prev) => prev.map((b) => ({ ...b, selected: nextState })));
  };

  const toggleBookmarkSelect = (index: number) => {
    setParsedBookmarks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, selected: !b.selected } : b))
    );
  };

  const handleImportSubmit = async () => {
    const selectedItems = parsedBookmarks.filter((b) => b.selected);
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos um favorito para importar.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const itemsToImport: AppInput[] = selectedItems.map((b) => ({
        name: b.name,
        url: b.url,
        logo: b.logo,
      }));

      await createAppsBatch(itemsToImport);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar favoritos';
      setError(msg);
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = parsedBookmarks.filter((b) => b.selected).length;

  return (
    <div className="bookmark-modal-overlay">
      <div className="bookmark-modal-card">
        <div className="bookmark-modal-header">
          <h3>⭐ Importar Favoritos do Navegador</h3>
          <button className="btn-close-modal" onClick={onClose}>✖</button>
        </div>

        <div className="bookmark-instructions">
          <p>💡 <strong>Como exportar seus favoritos para um arquivo no seu navegador:</strong></p>
          <ul>
            <li><strong>Chrome / Edge / Brave / Opera:</strong> Pressione <code>Ctrl + Shift + O</code> (ou <code>Cmd + Option + B</code>), clique no menu <code>⋮</code> e escolha <strong>Exportar favoritos</strong>.</li>
            <li><strong>Firefox:</strong> Pressione <code>Ctrl + Shift + O</code>, clique em <strong>Importar e Backup</strong> ➔ <strong>Exportar Favoritos em HTML...</strong></li>
            <li><strong>Safari:</strong> Vá ao menu superior <strong>Arquivo</strong> ➔ <strong>Exportar Favoritos</strong>.</li>
          </ul>
        </div>

        {error && <div className="alert-banner error">❌ {error}</div>}

        {parsedBookmarks.length === 0 ? (
          <div
            className="bookmark-drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <span className="drop-icon">⭐</span>
            <p><strong>Arraste o arquivo HTML de favoritos aqui</strong></p>
            <p className="subtext">ou clique no botão abaixo para selecionar o arquivo</p>
            <label className="btn-primary file-select-label">
              📁 Selecionar Arquivo HTML
              <input type="file" accept=".html,.htm" onChange={handleFileChange} hidden />
            </label>
            {fileName && <span className="selected-filename">Arquivo: {fileName}</span>}
          </div>
        ) : (
          <div className="bookmark-preview-section">
            <div className="bookmark-preview-header">
              <h4>
                Favoritos Encontrados ({parsedBookmarks.length}) — {selectedCount} selecionados
              </h4>
              <button type="button" className="btn-action edit" onClick={toggleSelectAll}>
                {selectAll ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
            </div>

            <div className="bookmark-list-scroll">
              <table className="admin-apps-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Importar</th>
                    <th style={{ width: '50px' }}>Ícone</th>
                    <th>Nome</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedBookmarks.map((b, idx) => (
                    <tr key={idx} onClick={() => toggleBookmarkSelect(idx)} style={{ cursor: 'pointer' }}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={b.selected}
                          onChange={() => toggleBookmarkSelect(idx)}
                        />
                      </td>
                      <td>
                        <img
                          src={b.logo}
                          alt={b.name}
                          className="table-logo-img"
                          onError={(e) => {
                            // Fallback caso imagem não carregue
                            (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=google.com&sz=64`;
                          }}
                        />
                      </td>
                      <td>
                        <strong>{b.name}</strong>
                      </td>
                      <td>
                        <span className="table-link">{b.url}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bookmark-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setParsedBookmarks([])}
              >
                🔄 Escolher Outro Arquivo
              </button>
              <button
                type="button"
                className="btn-primary btn-import-submit"
                onClick={handleImportSubmit}
                disabled={importing || selectedCount === 0}
              >
                {importing ? 'Importando...' : `🚀 Importar ${selectedCount} Favoritos para o SHELF`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

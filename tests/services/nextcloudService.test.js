import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextcloudService } from '../../src/services/nextcloudService.js';

global.fetch = vi.fn();

const response = (status, overrides = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  text: vi.fn().mockResolvedValue(''),
  json: vi.fn().mockResolvedValue({}),
  ...overrides
});

const connect = async () => {
  fetch
    .mockResolvedValueOnce(response(207))
    .mockResolvedValueOnce(response(404))
    .mockResolvedValueOnce(response(201));

  await nextcloudService.connect({
    serverUrl: 'https://cloud.example.com/',
    username: 'sergio@example.com',
    appPassword: 'senha exclusiva'
  });
};

describe('nextcloudService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    nextcloudService.disconnect();
  });

  it('valida a conexão e cria a pasta TASS quando necessário', async () => {
    await connect();

    expect(nextcloudService.isAuthenticated()).toBe(true);
    expect(nextcloudService.getConnection()).toEqual({
      serverUrl: 'https://cloud.example.com',
      username: 'sergio@example.com'
    });
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'https://cloud.example.com/remote.php/dav/files/sergio%40example.com/TASS',
      expect.objectContaining({ method: 'MKCOL' })
    );
    expect(sessionStorage.getItem('tass_nextcloud_session')).toContain('senha exclusiva');
    expect(localStorage.getItem('tass_nextcloud_session')).toBeNull();
  });

  it('recusa HTTP fora do ambiente local', async () => {
    await expect(nextcloudService.connect({
      serverUrl: 'http://cloud.example.com',
      username: 'sergio',
      appPassword: 'senha'
    })).rejects.toThrow('HTTPS');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('impede segmentos de navegação no caminho WebDAV', async () => {
    await connect();
    expect(() => nextcloudService.getResourceUrl('TASS/../segredo.json')).toThrow('caminho');
  });

  it('explica falhas de rede ou CORS', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(nextcloudService.connect({
      serverUrl: 'https://cloud.example.com',
      username: 'sergio',
      appPassword: 'senha'
    })).rejects.toThrow('CORS');
  });

  it('envia um backup JSON para a pasta TASS', async () => {
    await connect();
    fetch
      .mockResolvedValueOnce(response(207))
      .mockResolvedValueOnce(response(201));

    await expect(nextcloudService.uploadBackup({ tasks: [] })).resolves.toBe(true);

    const uploadCall = fetch.mock.calls.at(-1);
    expect(uploadCall[0]).toMatch(/\/TASS\/tass_backup_.+\.json$/);
    expect(uploadCall[1]).toEqual(expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ tasks: [] })
    }));
  });

  it('lista somente backups TASS e ordena pelo mais recente', async () => {
    await connect();
    const xml = `<?xml version="1.0"?>
      <d:multistatus xmlns:d="DAV:">
        <d:response><d:href>/TASS/</d:href></d:response>
        <d:response><d:href>/TASS/anotacoes.txt</d:href><d:propstat><d:prop><d:getlastmodified>Wed, 01 Jan 2025 10:00:00 GMT</d:getlastmodified></d:prop></d:propstat></d:response>
        <d:response><d:href>/TASS/tass_backup_antigo.json</d:href><d:propstat><d:prop><d:getlastmodified>Wed, 01 Jan 2025 10:00:00 GMT</d:getlastmodified></d:prop></d:propstat></d:response>
        <d:response><d:href>/TASS/tass_backup_novo.json</d:href><d:propstat><d:prop><d:getlastmodified>Thu, 02 Jan 2025 10:00:00 GMT</d:getlastmodified></d:prop></d:propstat></d:response>
      </d:multistatus>`;
    fetch
      .mockResolvedValueOnce(response(207))
      .mockResolvedValueOnce(response(207, { text: vi.fn().mockResolvedValue(xml) }));

    const files = await nextcloudService.listBackups();

    expect(files.map(file => file.name)).toEqual([
      'tass_backup_novo.json',
      'tass_backup_antigo.json'
    ]);
  });

  it('baixa e exclui um backup pelo nome codificado', async () => {
    await connect();
    const backup = { tasks: [], settings: [] };
    fetch
      .mockResolvedValueOnce(response(200, { json: vi.fn().mockResolvedValue(backup) }))
      .mockResolvedValueOnce(response(204));

    await expect(nextcloudService.downloadBackup('tass_backup_teste.json')).resolves.toEqual(backup);
    await expect(nextcloudService.deleteBackup('tass_backup_teste.json')).resolves.toBe(true);
    expect(fetch.mock.calls.at(-1)[1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
  });
});

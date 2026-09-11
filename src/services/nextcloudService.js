const SESSION_KEY = 'tass_nextcloud_session';
const BACKUP_FOLDER = 'TASS';
const BACKUP_PREFIX = 'tass_backup_';

let activeSession = null;

const getSessionStorage = () => {
  return typeof window !== 'undefined' ? window.sessionStorage : null;
};

const normalizeServerUrl = (value) => {
  const rawUrl = value?.trim();
  if (!rawUrl) throw new Error('Informe a URL da sua Nextcloud.');

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error('Informe uma URL válida, incluindo https://.');
  }

  const isLocalServer = ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);
  if (parsedUrl.protocol !== 'https:' && !(isLocalServer && parsedUrl.protocol === 'http:')) {
    throw new Error('Por segurança, a Nextcloud deve usar HTTPS.');
  }

  parsedUrl.search = '';
  parsedUrl.hash = '';
  return parsedUrl.toString().replace(/\/$/, '');
};

const encodeBasicAuth = (username, password) => {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binaryValue = '';
  bytes.forEach(byte => { binaryValue += String.fromCharCode(byte); });
  return btoa(binaryValue);
};

const readSavedSession = () => {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const savedSession = JSON.parse(storage.getItem(SESSION_KEY));
    if (savedSession?.serverUrl && savedSession?.username && savedSession?.appPassword) {
      return savedSession;
    }
  } catch {
    storage.removeItem(SESSION_KEY);
  }
  return null;
};

const getFriendlyConnectionError = (error) => {
  if (error instanceof TypeError) {
    return new Error('Não foi possível acessar a Nextcloud. Verifique a rede e a configuração de CORS do servidor.');
  }
  return error;
};

const getElementText = (parent, localName) => {
  return parent.getElementsByTagNameNS('*', localName)[0]?.textContent || '';
};

const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizeDavDate = (value) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? new Date(0).toISOString() : new Date(timestamp).toISOString();
};

activeSession = readSavedSession();

export const nextcloudService = {
  getConnection() {
    if (!activeSession) return null;
    return {
      serverUrl: activeSession.serverUrl,
      username: activeSession.username
    };
  },

  isAuthenticated() {
    return Boolean(activeSession);
  },

  getDavRoot() {
    if (!activeSession) throw new Error('Conecte sua conta Nextcloud primeiro.');
    return `${activeSession.serverUrl}/remote.php/dav/files/${encodeURIComponent(activeSession.username)}`;
  },

  getResourceUrl(resourceName = '') {
    const cleanSegments = resourceName
      .split('/')
      .filter(Boolean);

    if (cleanSegments.some(segment => segment === '.' || segment === '..')) {
      throw new Error('O caminho solicitado para a Nextcloud é inválido.');
    }

    const encodedSegments = cleanSegments.map(segment => encodeURIComponent(segment));
    return [this.getDavRoot(), ...encodedSegments].join('/');
  },

  async request(resourceName, options = {}) {
    const headers = {
      Authorization: `Basic ${encodeBasicAuth(activeSession.username, activeSession.appPassword)}`,
      ...options.headers
    };

    try {
      return await fetch(this.getResourceUrl(resourceName), { ...options, headers });
    } catch (error) {
      throw getFriendlyConnectionError(error);
    }
  },

  async connect({ serverUrl, username, appPassword }) {
    const normalizedUsername = username?.trim();
    if (!normalizedUsername) throw new Error('Informe o usuário da Nextcloud.');
    if (!appPassword) throw new Error('Informe uma senha de aplicativo da Nextcloud.');

    activeSession = {
      serverUrl: normalizeServerUrl(serverUrl),
      username: normalizedUsername,
      appPassword
    };

    try {
      const response = await this.request('', {
        method: 'PROPFIND',
        headers: { Depth: '0' }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Usuário ou senha de aplicativo inválidos.');
      }
      if (!response.ok) {
        throw new Error(`A Nextcloud recusou a conexão (HTTP ${response.status}).`);
      }

      await this.ensureBackupFolder();
      getSessionStorage()?.setItem(SESSION_KEY, JSON.stringify(activeSession));
      return this.getConnection();
    } catch (error) {
      activeSession = null;
      getSessionStorage()?.removeItem(SESSION_KEY);
      throw error;
    }
  },

  disconnect() {
    activeSession = null;
    getSessionStorage()?.removeItem(SESSION_KEY);
  },

  async ensureBackupFolder() {
    const folderResponse = await this.request(BACKUP_FOLDER, {
      method: 'PROPFIND',
      headers: { Depth: '0' }
    });

    if (folderResponse.ok) return true;
    if (folderResponse.status !== 404) {
      throw new Error(`Não foi possível verificar a pasta TASS (HTTP ${folderResponse.status}).`);
    }

    const createResponse = await this.request(BACKUP_FOLDER, { method: 'MKCOL' });
    if (!createResponse.ok && createResponse.status !== 405) {
      throw new Error(`Não foi possível criar a pasta TASS (HTTP ${createResponse.status}).`);
    }
    return true;
  },

  async uploadBackup(data) {
    await this.ensureBackupFolder();
    const filename = `${BACKUP_PREFIX}${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const response = await this.request(`${BACKUP_FOLDER}/${filename}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`Falha ao enviar o backup (HTTP ${response.status}).`);
    return true;
  },

  async listBackups() {
    await this.ensureBackupFolder();
    const response = await this.request(BACKUP_FOLDER, {
      method: 'PROPFIND',
      headers: {
        Depth: '1',
        'Content-Type': 'application/xml; charset=utf-8'
      },
      body: '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:getlastmodified/><d:getcontenttype/></d:prop></d:propfind>'
    });

    if (!response.ok) throw new Error(`Falha ao listar backups (HTTP ${response.status}).`);

    const document = new DOMParser().parseFromString(await response.text(), 'application/xml');
    const parserError = document.querySelector('parsererror');
    if (parserError) throw new Error('A Nextcloud retornou uma lista de arquivos inválida.');

    return [...document.getElementsByTagNameNS('*', 'response')]
      .map(item => {
        const href = getElementText(item, 'href');
        const filename = safeDecodeURIComponent(href.split('/').filter(Boolean).pop() || '');
        const lastModified = getElementText(item, 'getlastmodified');
        return {
          id: filename,
          name: filename,
          createdTime: normalizeDavDate(lastModified)
        };
      })
      .filter(file => file.name.startsWith(BACKUP_PREFIX) && file.name.endsWith('.json'))
      .sort((first, second) => new Date(second.createdTime) - new Date(first.createdTime));
  },

  async downloadBackup(filename) {
    const response = await this.request(`${BACKUP_FOLDER}/${filename}`);
    if (!response.ok) throw new Error(`Falha ao baixar o backup (HTTP ${response.status}).`);

    try {
      return await response.json();
    } catch {
      throw new Error('O arquivo selecionado não contém um backup JSON válido.');
    }
  },

  async deleteBackup(filename) {
    const response = await this.request(`${BACKUP_FOLDER}/${filename}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Falha ao excluir o backup (HTTP ${response.status}).`);
    return true;
  }
};

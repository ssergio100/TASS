import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { db } from '../../src/db.js';

// Mocks do DB
vi.mock('../../src/db.js', () => ({
  db: {
    settings: {
      toArray: vi.fn(),
      put: vi.fn(),
      bulkPut: vi.fn()
    }
  }
}));

describe('SettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  it('deve carregar configurações do banco de dados na inicialização', async () => {
    const store = useSettingsStore();
    db.settings.toArray.mockResolvedValue([
      { key: 'app-theme', value: 'light' },
      { key: 'app-columns', value: 4 },
      { key: 'app-darken-wallpaper', value: false }
    ]);

    await store.loadSettings();

    expect(store.theme).toBe('light');
    expect(store.columns).toBe(4);
    expect(store.darkenWallpaper).toBe(false);
    expect(store.isInitialized).toBe(true);
  });

  it('expõe a coleção e a branch base do provedor ativo sem depender de nomes fixos', async () => {
    const store = useSettingsStore();
    db.settings.toArray.mockResolvedValue([
      { key: 'app-git-provider', value: 'github' },
      {
        key: 'app-github-environments',
        value: [
          { id: 'stable', branch: 'release/customer-a', alias: 'Cliente A' },
          { id: 'integration', branch: 'integration/next', alias: 'Integração' }
        ]
      },
      { key: 'app-github-base-environment-id', value: 'integration' }
    ]);

    await store.loadSettings();

    expect(store.activeEnvironments).toHaveLength(2);
    expect(store.activeBaseEnvironment).toEqual({
      id: 'integration',
      branch: 'integration/next',
      alias: 'Integração'
    });
    expect(store.activeBaseBranch).toBe('integration/next');
  });

  it('deve ter darkenWallpaper como true por padrão', () => {
    const store = useSettingsStore();
    expect(store.darkenWallpaper).toBe(true);
  });

  it('deve salvar uma configuração individual', async () => {
    const store = useSettingsStore();
    await store.saveSetting('app-theme', 'dark');
    expect(db.settings.put).toHaveBeenCalledWith({ key: 'app-theme', value: 'dark' });
  });

  it('deve realizar auto-upgrade da largura se estiver no padrão antigo', async () => {
    const store = useSettingsStore();
    db.settings.toArray.mockResolvedValue([{ key: 'app-width', value: 1000 }]);

    await store.loadSettings();

      expect(store.appWidth).toBe(1400);
    expect(db.settings.put).toHaveBeenCalledWith({ key: 'app-width', value: 1400 });
  });

  it('deve possuir valores padronizados para a Doca na inicialização', () => {
    const store = useSettingsStore();
    expect(store.dockIconSize).toBe(16);
    expect(store.dockBackgroundEnabled).toBe(true);
    expect(store.dockOpacity).toBe(80);
    expect(store.normalizedDockOpacity).toBe(0.2);
    expect(store.dockVisibleItems).toBeDefined();
    expect(store.dockVisibleItems.addTask).toBe(true);
    expect(store.dockVisibleItems.workedHours).toBe(true);
    expect(store.dockVisibleItems.sprints).toBe(true);
    expect(store.dockVisibleItems.weather).toBe(true);
  });
});

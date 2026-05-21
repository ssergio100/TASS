import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';

vi.mock('../../src/stores/authStore', () => {
  const mockInstance = {
    isAuthenticated: true,
    request: vi.fn()
  };
  return {
    useAuthStore: () => mockInstance
  };
});

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
    const authStore = useAuthStore();
    authStore.request.mockResolvedValue({
      'app-theme': 'light',
      'app-columns': 4,
      'app-darken-wallpaper': false
    });

    await store.loadSettings();

    expect(store.theme).toBe('light');
    expect(store.columns).toBe(4);
    expect(store.darkenWallpaper).toBe(false);
    expect(store.isInitialized).toBe(true);
  });

  it('deve ter darkenWallpaper como true por padrão', () => {
    const store = useSettingsStore();
    expect(store.darkenWallpaper).toBe(true);
  });

  it('deve salvar uma configuração individual', async () => {
    const store = useSettingsStore();
    const authStore = useAuthStore();
    
    await store.saveSetting('app-theme', 'dark');
    
    expect(authStore.request).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"app-theme":"dark"')
    }));
  });

  it('deve realizar auto-upgrade da largura se estiver no padrão antigo', async () => {
    const store = useSettingsStore();
    const authStore = useAuthStore();
    authStore.request.mockResolvedValue({ 'app-width': 1000 });

    await store.loadSettings();

    expect(store.appWidth).toBe(1400);
    expect(authStore.request).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"app-width":1400')
    }));
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../src/stores/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Mock localStorage
    const store = {};
    const localStorageMock = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { for (const key in store) delete store[key]; })
    };
    vi.stubGlobal('localStorage', localStorageMock);
    
    // Mock fetch globally
    vi.stubGlobal('fetch', vi.fn());
  });

  it('deve iniciar com estado autenticado vazio se localStorage estiver limpo', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.token).toBe('');
    expect(store.user).toBeNull();
  });

  it('deve realizar login por email com sucesso', async () => {
    const store = useAuthStore();
    const mockUser = { id: 1, email: 'teste@tass.com' };
    const mockResponse = { token: 'jwt_token_123', user: mockUser };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });

    await store.login('teste@tass.com', 'senha123');

    expect(store.token).toBe('jwt_token_123');
    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('tass_token', 'jwt_token_123');
    expect(localStorage.setItem).toHaveBeenCalledWith('tass_user', JSON.stringify(mockUser));
  });

  it('deve realizar login com conta Google com sucesso', async () => {
    const store = useAuthStore();
    const mockUser = { id: 2, email: 'googleuser@gmail.com' };
    const mockResponse = { token: 'jwt_google_123', user: mockUser };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });

    await store.loginWithGoogle('google_access_token_xyz');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/google'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ accessToken: 'google_access_token_xyz' })
      })
    );
    expect(store.token).toBe('jwt_google_123');
    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('tass_token', 'jwt_google_123');
  });

  it('deve realizar cadastro com sucesso', async () => {
    const store = useAuthStore();
    const mockUser = { id: 3, email: 'novouser@tass.com' };
    const mockResponse = { token: 'jwt_new_123', user: mockUser, recoveryCode: 'TASS-1234-5678' };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse
    });

    const result = await store.register('novouser@tass.com', 'senha123');

    expect(store.token).toBe('jwt_new_123');
    expect(store.user).toEqual(mockUser);
    expect(result.recoveryCode).toBe('TASS-1234-5678');
  });

  it('deve fazer logout e limpar token e localStorage', () => {
    const store = useAuthStore();
    store.token = 'some_token';
    store.user = { id: 1 };

    store.logout();

    expect(store.token).toBe('');
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('tass_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('tass_user');
  });
});

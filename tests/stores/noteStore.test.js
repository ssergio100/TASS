import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNoteStore } from '../../src/stores/noteStore';
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

describe('NoteStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('deve carregar a última nota salva', async () => {
    const store = useNoteStore();
    const authStore = useAuthStore();
    const mockNotes = [{ id: 1, content: 'Minha nota' }];
    
    authStore.request.mockResolvedValue(mockNotes);

    await store.loadNote();

    expect(authStore.request).toHaveBeenCalledWith('/api/notes');
    expect(store.note).toBe('Minha nota');
    expect(store.isLoaded).toBe(true);
  });

  it('deve salvar alterações na nota existente', async () => {
    const store = useNoteStore();
    const authStore = useAuthStore();
    
    authStore.request.mockResolvedValue({ id: 1, content: 'nova' });

    await store.saveNote('nova');

    expect(store.note).toBe('nova');
    expect(authStore.request).toHaveBeenCalledWith('/api/notes', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"content":"nova"')
    }));
  });
});

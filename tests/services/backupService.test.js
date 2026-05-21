import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backupService } from '../../src/services/backupService';
import { setActivePinia, createPinia } from 'pinia';

// Mock do notificationService
vi.mock('../../src/services/notificationService', () => ({
  notificationService: {
    toast: vi.fn(),
    alert: vi.fn()
  }
}));

// Mock dos stores de Pinia
const mockAuthStore = {
  request: vi.fn(),
  isAuthenticated: true
};

const mockNoteStore = {
  loadNote: vi.fn()
};

const mockRadioStore = {
  init: vi.fn()
};

vi.mock('../../src/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore
}));

vi.mock('../../src/stores/noteStore', () => ({
  useNoteStore: () => mockNoteStore
}));

vi.mock('../../src/stores/radioStore', () => ({
  useRadioStore: () => mockRadioStore
}));

describe('backupService', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Mock do download para evitar erros de DOM real
    vi.spyOn(backupService, 'downloadJson').mockImplementation(() => {});
  });

  describe('exportSystem', () => {
    it('deve coletar dados de todas as APIs do backend e chamar downloadJson', async () => {
      mockAuthStore.request.mockImplementation((endpoint) => {
        if (endpoint === '/api/tasks') return Promise.resolve([{ id: 1, title: 'Task 1' }]);
        if (endpoint === '/api/sprints') return Promise.resolve([{ id: 10 }]);
        if (endpoint === '/api/settings') return Promise.resolve({ theme: 'dark' });
        if (endpoint === '/api/notes') return Promise.resolve([{ content: 'Nota 1' }]);
        if (endpoint === '/api/radios') return Promise.resolve([{ name: 'Radio 1', url: 'http://stream' }]);
        return Promise.resolve([]);
      });

      await backupService.exportSystem();

      expect(backupService.downloadJson).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: expect.arrayContaining([expect.objectContaining({ title: 'Task 1' })]),
          sprints: expect.arrayContaining([expect.objectContaining({ id: 10 })]),
          settings: expect.arrayContaining([expect.objectContaining({ key: 'theme', value: 'dark' })]),
          notes: expect.arrayContaining([expect.objectContaining({ content: 'Nota 1' })]),
          radios: expect.arrayContaining([expect.objectContaining({ name: 'Radio 1' })]),
          version: '1.1'
        }),
        'tass_full_system_backup.json'
      );
    });
  });

  describe('importTasks', () => {
    it('deve realizar um Merge Seguro (remover ID, resetar status e chamar API POST para cada)', async () => {
      const mockTaskStore = { loadTasks: vi.fn() };
      const originalTask = { id: 1, title: 'Importada', sprintId: '123', isRunning: true, lastStartTime: 5000 };
      const mockFileContent = JSON.stringify([originalTask]);
      const mockFile = new Blob([mockFileContent], { type: 'application/json' });

      // Simula o comportamento do FileReader
      const importPromise = backupService.importTasks(mockFile, mockTaskStore);
      
      await importPromise;

      // Verifica se o POST foi chamado no backend
      expect(mockAuthStore.request).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
      
      const lastCall = mockAuthStore.request.mock.calls.find(call => call[0] === '/api/tasks');
      const sentTask = JSON.parse(lastCall[1].body);
      expect(sentTask).toEqual(expect.objectContaining({
        title: 'Importada',
        sprintId: null,
        isRunning: false,
        lastStartTime: null
      }));
      
      expect(mockTaskStore.loadTasks).toHaveBeenCalled();
    });

    it('deve disparar um alerta se o formato do arquivo for inválido', async () => {
      const { notificationService } = await import('../../src/services/notificationService');
      const mockTaskStore = { loadTasks: vi.fn() };
      const mockFile = new Blob(['invalid-json'], { type: 'application/json' });

      await expect(backupService.importTasks(mockFile, mockTaskStore)).rejects.toThrow();
      expect(notificationService.alert).toHaveBeenCalledWith(
        'Falha na importação', 
        expect.any(String), 
        'error'
      );
    });
  });

  describe('applyBackupData', () => {
    it('deve resetar o banco do usuario, enviar payload para o backend e atualizar stores', async () => {
      const mockSettingsStore = { loadSettings: vi.fn() };
      const mockTaskStore = { loadTasks: vi.fn(), loadSprints: vi.fn() };
      
      const backupData = {
        tasks: [{ id: 1, title: 'Tarefa do backup', position: 0, columnId: 1, sprintId: 10 }],
        sprints: [{ id: 10, endDate: '2026-05-20' }],
        settings: [{ key: 'app-theme', value: 'light' }],
        notes: [{ content: 'Nota do backup' }],
        radios: [{ name: 'Radio backup', url: 'http://radio' }]
      };

      const success = await backupService.applyBackupData(backupData, mockSettingsStore, mockTaskStore);

      expect(success).toBe(true);
      expect(mockAuthStore.request).toHaveBeenCalledWith('/api/auth/reset', { method: 'POST' });
      expect(mockAuthStore.request).toHaveBeenCalledWith('/api/migrate', expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      }));

      const migrateCall = mockAuthStore.request.mock.calls.find(call => call[0] === '/api/migrate');
      const payload = JSON.parse(migrateCall[1].body);
      expect(payload).toEqual({
        tasks: [{ id: 1, title: 'Tarefa do backup', position: 0, columnId: 1, completed: false, sprintId: 10, totalTimeSpent: 0, totalWorked: 0, isRunning: false, lastStartTime: null, gitlabBranch: null, gitlabMrId: null, createdAt: expect.any(Number) }],
        sprints: [{ id: 10, endDate: '2026-05-20' }],
        settings: { 'app-theme': 'light' },
        notes: [{ content: 'Nota do backup', updatedAt: expect.any(Number) }],
        radios: [{ name: 'Radio backup', url: 'http://radio', stars: 0 }]
      });

      expect(mockSettingsStore.loadSettings).toHaveBeenCalled();
      expect(mockTaskStore.loadTasks).toHaveBeenCalled();
      expect(mockTaskStore.loadSprints).toHaveBeenCalled();
      expect(mockNoteStore.loadNote).toHaveBeenCalled();
      expect(mockRadioStore.init).toHaveBeenCalled();
    });
  });
});

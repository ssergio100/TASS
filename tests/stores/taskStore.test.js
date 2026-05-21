import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTaskStore } from '../../src/stores/taskStore';
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

// Mock do SettingsStore (Pinia)
vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    columns: 3,
    activeSprintId: 'all',
    trackInactivity: false,
    inactivityThreshold: 10
  }))
}));

// Mock das notificações
vi.mock('../../src/services/notificationService', () => ({
  notificationService: {
    toast: vi.fn(),
    confirm: vi.fn(),
    alert: vi.fn()
  }
}));

describe('TaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Gerenciamento de Tarefas', () => {
    it('deve adicionar uma nova tarefa na primeira posição', async () => {
      const store = useTaskStore();
      const authStore = useAuthStore();
      const mockTaskData = { title: 'Nova Tarefa', description: 'Teste' };
      
      authStore.request.mockResolvedValue({
        id: 1,
        title: 'Nova Tarefa',
        description: 'Teste',
        position: 1,
        columnId: 1,
        completed: false,
        totalTimeSpent: 0,
        totalWorked: 0,
        isRunning: false,
        lastStartTime: null,
        createdAt: 12345
      });

      await store.addTask(mockTaskData);

      expect(authStore.request).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
        method: 'POST'
      }));
      expect(store.tasks[0].title).toBe('Nova Tarefa');
      expect(store.tasks[0].position).toBe(1);
    });

    it('deve excluir uma tarefa e salvar no histórico para restaurar', async () => {
      const store = useTaskStore();
      const authStore = useAuthStore();
      const task = { id: 1, title: 'Para Deletar', position: 1 };
      store.tasks = [task];
      
      authStore.request.mockResolvedValue({ status: 'success' });

      await store.deleteTask(1);

      expect(store.tasks.length).toBe(0);
      expect(store.lastDeletedTask.title).toBe('Para Deletar');
      expect(authStore.request).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
        method: 'DELETE'
      }));
    });
  });

  describe('Lógica do Cronômetro', () => {
    it('deve iniciar o timer de uma tarefa e parar as outras', async () => {
      const store = useTaskStore();
      const authStore = useAuthStore();
      const task1 = { id: 1, isRunning: false, totalTimeSpent: 0, completed: false };
      const task2 = { id: 2, isRunning: true, lastStartTime: Date.now(), totalTimeSpent: 100, completed: false };
      
      store.tasks = [task1, task2];
      authStore.request.mockResolvedValue({ status: 'success' });

      await store.toggleTimer(task1);

      expect(task1.isRunning).toBe(true);
      expect(task2.isRunning).toBe(false);
      expect(authStore.request).toHaveBeenCalled();
    });

    it('deve calcular o tempo acumulado ao parar o timer', async () => {
      const store = useTaskStore();
      const authStore = useAuthStore();
      const now = Date.now();
      const startTime = now - 5000; // 5 segundos atrás
      const task = { id: 1, isRunning: true, lastStartTime: startTime, totalTimeSpent: 1000, completed: false };
      
      store.tasks = [task];
      authStore.request.mockResolvedValue({ status: 'success' });

      await store.toggleTimer(task);

      expect(task.isRunning).toBe(false);
      // 1000 original + 5000 passados = 6000ms
      expect(task.totalTimeSpent).toBeGreaterThanOrEqual(6000);
    });

    it('deve ajustar o tempo da tarefa manualmente (adjustTaskTime)', async () => {
      const store = useTaskStore();
      const authStore = useAuthStore();
      const initialTask = { id: 1, totalTimeSpent: 1000, totalWorked: 1000 };
      store.tasks = [initialTask];
      authStore.request.mockResolvedValue({ status: 'success' });
      
      const newTime = 5000;
      await store.adjustTaskTime(1, newTime);

      const updatedTask = store.tasks[0];
      expect(updatedTask.totalTimeSpent).toBe(5000);
      expect(updatedTask.totalWorked).toBe(5000);
      expect(authStore.request).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"totalTimeSpent":5000')
      }));
    });
  });

  describe('Filtros e Colunas', () => {
    it('deve organizar as tarefas em colunas conforme a configuração', () => {
      const store = useTaskStore();
      store.tasks = [
        { id: 1, columnId: 1, position: 1, title: 'C1' },
        { id: 2, columnId: 2, position: 1, title: 'C2' },
        { id: 3, columnId: 1, position: 2, title: 'C1-P2' }
      ];

      const columns = store.boardColumns;
      
      expect(columns.length).toBe(3); // Mock do settingsStore retorna 3 colunas
      expect(columns[0].length).toBe(2);
      expect(columns[1].length).toBe(1);
    });

    it('deve filtrar apenas tarefas ativas quando o statusFilter for "active"', () => {
      const store = useTaskStore();
      store.tasks = [
        { id: 1, completed: true },
        { id: 2, completed: false }
      ];

      store.statusFilter = 'active';
      expect(store.filteredTasks.length).toBe(1);
      expect(store.filteredTasks[0].id).toBe(2);
    });
  });
});

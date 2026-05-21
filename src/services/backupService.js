import { useAuthStore } from '../stores/authStore';
import { useNoteStore } from '../stores/noteStore';
import { useRadioStore } from '../stores/radioStore';
import { notificationService } from './notificationService';

export const backupService = {
  /**
   * Exporta apenas as tarefas para JSON
   */
  async exportTasks() {
    try {
      const authStore = useAuthStore();
      const data = await authStore.request('/api/tasks');
      this.downloadJson(data, 'tass_tasks_backup.json');
      notificationService.toast('Backup de tarefas exportado!');
    } catch (error) {
      console.error("Export failed:", error);
      notificationService.alert('Falha na exportação', 'Não foi possível gerar o arquivo.', 'error');
    }
  },

  /**
   * Obtém todo o sistema (Tarefas, Sprints, Configs, Notas, Rádios) em um objeto
   */
  async getFullBackupData() {
    const authStore = useAuthStore();
    
    // Carrega todos os dados do backend em paralelo
    const [tasks, sprints, settingsMap, notes, radios] = await Promise.all([
      authStore.request('/api/tasks'),
      authStore.request('/api/sprints'),
      authStore.request('/api/settings'),
      authStore.request('/api/notes'),
      authStore.request('/api/radios').catch(() => [])
    ]);

    // Converte o settingsMap { 'theme': 'dark' } para o formato de array [{ key: 'theme', value: 'dark' }]
    // para manter 100% de compatibilidade retroativa com os arquivos JSON de backup antigos do IndexedDB.
    const settings = Object.entries(settingsMap).map(([key, value]) => ({
      key,
      value
    }));

    return {
      tasks,
      sprints,
      settings,
      notes,
      radios,
      version: '1.1',
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Exporta todo o sistema (Tarefas, Sprints, Configs, Notas, Rádios)
   */
  async exportSystem() {
    try {
      const fullData = await this.getFullBackupData();
      this.downloadJson(fullData, 'tass_full_system_backup.json');
      notificationService.toast('Backup completo exportado!');
    } catch (error) {
      console.error("System export failed:", error);
      notificationService.alert('Falha na exportação', 'Erro ao gerar backup completo.', 'error');
    }
  },

  /**
   * Importa tarefas de um arquivo JSON (Merge Seguro)
   */
  async importTasks(file, taskStore) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const authStore = useAuthStore();
          const data = JSON.parse(e.target.result);
          const tasksData = Array.isArray(data) ? data : (data.tasks || null);
          
          if (!tasksData) throw new Error("Formato inválido");

          // Processamento para Merge Seguro com normalização robusta
          const processedTasks = tasksData.map((t, idx) => {
            const { id, ...taskWithoutId } = t;
            const rawColId = t.columnId !== undefined ? t.columnId : t.column_id;
            const columnId = (rawColId !== undefined && rawColId !== null) ? parseInt(rawColId, 10) : 1;
            const safeColumnId = isNaN(columnId) || columnId < 1 ? 1 : columnId;

            const rawPos = t.position !== undefined ? t.position : t.position;
            const pos = (rawPos !== undefined && rawPos !== null) ? parseInt(rawPos, 10) : idx;
            const safePosition = isNaN(pos) ? idx : pos;

            return {
              ...taskWithoutId,
              title: t.title || 'Tarefa sem título',
              description: t.description || '',
              position: safePosition,
              columnId: safeColumnId,
              color: t.color || '',
              completed: t.completed === 1 || t.completed === true || t.completed === 'true' || t.completed === '1',
              sprintId: null,       // Desvincula de sprints órfãs no merge
              isRunning: false,     // Garante que não venha rodando
              lastStartTime: null,  // Limpa estado do timer
              totalTimeSpent: t.totalTimeSpent !== undefined ? t.totalTimeSpent : (t.total_time_spent !== undefined ? t.total_time_spent : 0),
              totalWorked: t.totalWorked !== undefined ? t.totalWorked : (t.total_worked !== undefined ? t.total_worked : 0),
              gitlabBranch: t.gitlabBranch !== undefined ? t.gitlabBranch : (t.gitlab_branch !== undefined ? t.gitlab_branch : null),
              gitlabMrId: t.gitlabMrId !== undefined ? t.gitlabMrId : (t.gitlab_mr_id !== undefined ? t.gitlab_mr_id : null),
              createdAt: t.createdAt !== undefined ? t.createdAt : (t.created_at !== undefined ? t.created_at : Date.now())
            };
          });

          // Insere cada tarefa sequencialmente para evitar locks concorrentes no SQLite
          for (const task of processedTasks) {
            await authStore.request('/api/tasks', {
              method: 'POST',
              body: JSON.stringify(task)
            });
          }
          
          await taskStore.loadTasks();
          notificationService.toast('Tarefas importadas com sucesso!');
          resolve();
        } catch (error) {
          console.error("Task import failed:", error);
          notificationService.alert('Falha na importação', 'Arquivo de tarefas inválido ou erro no salvamento.', 'error');
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  },

  /**
   * Aplica os dados de um backup ao banco de dados e atualiza as stores
   */
  async applyBackupData(data, settingsStore, taskStore) {
    try {
      const authStore = useAuthStore();
      const noteStore = useNoteStore();
      const radioStore = useRadioStore();

      // Validação resiliente do formato do backup
      if (Array.isArray(data)) {
        notificationService.alert(
          'Formato Incompatível',
          'Este arquivo parece conter apenas tarefas. Para restaurá-lo, use a opção "Importar" na seção "Apenas Tarefas".',
          'warning'
        );
        return false;
      }

      if (!data || (!data.tasks && !data.settings)) {
        notificationService.alert(
          'Backup Inválido',
          'O arquivo selecionado não contém os dados básicos de tarefas ou configurações do TASS.',
          'error'
        );
        return false;
      }

      // Normaliza as configurações (suporta formato chave-valor novo ou array clássico do IndexedDB)
      let normalizedSettings = {};
      if (Array.isArray(data.settings)) {
        data.settings.forEach(item => {
          if (item && item.key) {
            normalizedSettings[item.key] = item.value;
          }
        });
      } else if (data.settings && typeof data.settings === 'object') {
        normalizedSettings = data.settings;
      }

      // Normaliza outros arrays para garantir consistência
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const sprints = Array.isArray(data.sprints) ? data.sprints : [];
      const notes = Array.isArray(data.notes) ? data.notes : [];
      const radios = Array.isArray(data.radios) ? data.radios : [];

      // Adapta tarefas antigas com normalização robusta
      const processedTasks = tasks.map((t, idx) => {
        const rawColId = t.columnId !== undefined ? t.columnId : t.column_id;
        const columnId = (rawColId !== undefined && rawColId !== null) ? parseInt(rawColId, 10) : 1;
        const safeColumnId = isNaN(columnId) || columnId < 1 ? 1 : columnId;

        const rawPos = t.position !== undefined ? t.position : t.position;
        const pos = (rawPos !== undefined && rawPos !== null) ? parseInt(rawPos, 10) : idx;
        const safePosition = isNaN(pos) ? idx : pos;

        return {
          ...t,
          position: safePosition,
          columnId: safeColumnId,
          completed: t.completed === 1 || t.completed === true || t.completed === 'true' || t.completed === '1',
          sprintId: t.sprintId !== undefined ? t.sprintId : (t.sprint_id !== undefined ? t.sprint_id : null),
          totalTimeSpent: t.totalTimeSpent !== undefined ? t.totalTimeSpent : (t.total_time_spent !== undefined ? t.total_time_spent : 0),
          totalWorked: t.totalWorked !== undefined ? t.totalWorked : (t.total_worked !== undefined ? t.total_worked : 0),
          isRunning: t.isRunning === 1 || t.isRunning === true || t.isRunning === 'true' || t.isRunning === '1',
          lastStartTime: t.lastStartTime !== undefined ? t.lastStartTime : (t.last_start_time !== undefined ? t.last_start_time : null),
          gitlabBranch: t.gitlabBranch !== undefined ? t.gitlabBranch : (t.gitlab_branch !== undefined ? t.gitlab_branch : null),
          gitlabMrId: t.gitlabMrId !== undefined ? t.gitlabMrId : (t.gitlab_mr_id !== undefined ? t.gitlab_mr_id : null),
          createdAt: t.createdAt !== undefined ? t.createdAt : (t.created_at !== undefined ? t.created_at : Date.now())
        };
      });

      // Adapta notas antigas para garantir o campo content e updatedAt
      const processedNotes = notes.map(n => ({
        content: n.content || '',
        updatedAt: n.updatedAt || n.updated_at || Date.now()
      }));

      // Adapta rádios antigas
      const processedRadios = radios.map(r => ({
        name: r.name || 'Rádio Sem Nome',
        url: r.url || '',
        stars: typeof r.stars === 'number' ? r.stars : 0
      }));

      // 1. Zera o banco atual do usuário logado no servidor
      await authStore.request('/api/auth/reset', { method: 'POST' });

      // 2. Realiza a inserção relacional segura usando o endpoint de migração do Express
      await authStore.request('/api/migrate', {
        method: 'POST',
        body: JSON.stringify({
          tasks: processedTasks,
          sprints,
          settings: normalizedSettings,
          notes: processedNotes,
          radios: processedRadios
        })
      });

      // 3. Atualiza as stores do Pinia para refletir reativamente os novos dados restaurados
      await Promise.all([
        settingsStore.loadSettings(),
        taskStore.loadTasks(),
        taskStore.loadSprints(),
        noteStore.loadNote(),
        radioStore.init()
      ]);
      
      notificationService.toast('Sistema restaurado com sucesso!', 'success');
      return true;
    } catch (error) {
      console.error("Failed to apply backup data:", error);
      notificationService.alert(
        'Falha na restauração',
        'O conteúdo do backup é inválido ou ocorreu um erro na restauração.',
        'error'
      );
      return false;
    }
  },

  /**
   * Restaura o sistema completo a partir de um arquivo
   */
  async importSystem(file, settingsStore, taskStore) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const success = await this.applyBackupData(data, settingsStore, taskStore);
          if (success) resolve();
          else reject(new Error("Apply failed"));
        } catch (error) {
          notificationService.alert('Erro de Leitura', 'Não foi possível ler o arquivo de backup.', 'error');
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  },

  /**
   * Helper para disparar o download no navegador
   */
  downloadJson(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
};

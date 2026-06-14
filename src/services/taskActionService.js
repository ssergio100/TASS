import { isValidUrl, ensureProtocol } from '../utils/validation';
import { notificationService } from './notificationService';

export const taskActionService = {
  /**
   * Abre um modal do SweetAlert para capturar uma entrada do usuário e atualizar a tarefa.
   * @param {Object} task - A tarefa a ser atualizada
   * @param {Object} taskStore - A store de tarefas para persistência
   * @param {String} field - O campo da tarefa a ser atualizado (ex: 'taskUrl', 'moreInfo')
   * @param {String} label - O rótulo amigável para o modal
   * @param {String} type - Tipo de validação ('url' ou 'text')
   */
  async promptQuickUpdate(task, taskStore, field, label, type = 'url') {
    const currentValue = task[field] || '';
    const isTextArea = field === 'moreInfo' || field === 'dbScripts';

    const newValue = await notificationService.prompt({
      title: label,
      message: isTextArea ? '' : `Informe o ${label.toLowerCase()} abaixo`,
      value: currentValue,
      placeholder: type === 'url' ? 'https://...' : 'Escreva aqui...',
      promptType: isTextArea ? 'textarea' : 'text',
      confirmText: 'Salvar',
      denyText: 'Limpar'
    });

    if (newValue !== null) {
      const trimmedValue = newValue.trim();
      const formattedValue = type === 'url' ? ensureProtocol(trimmedValue) : trimmedValue;
      try {
        await taskStore.updateTask(task.id, { [field]: formattedValue });
        return true;
      } catch (error) {
        console.error('Erro ao atualizar campo da tarefa:', error);
        notificationService.toast(`Erro ao salvar alteração: ${error.message}`, 'error');
        return false;
      }
    }
    return false;
  }
};

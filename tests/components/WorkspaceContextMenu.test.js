import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WorkspaceContextMenu from '../../src/components/WorkspaceContextMenu.vue';
import { useTaskStore } from '../../src/stores/taskStore';

// Mocks das Stores e Composables
vi.mock('../../src/stores/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    workspaceContextMenuPosition: { x: 100, y: 100 },
    showWorkspaceContextMenu: true,
    animatingTaskIds: [],
    triggerPresetAnimation: vi.fn(),
    previewGlobalStyleId: null
  }))
}));

vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    columns: 2
  }))
}));

vi.mock('../../src/stores/radioStore', () => ({
  useRadioStore: vi.fn(() => ({
    showRadio: false
  }))
}));

const mockTaskStoreInstance = {
  tasks: [
    { id: 1, title: 'TSK-1', styleId: null, styleLocked: false },
    { id: 2, title: 'TSK-2', styleId: 'style-blue', styleLocked: true },
    { id: 3, title: 'TSK-3', styleId: null, styleLocked: undefined }
  ],
  updateTask: vi.fn()
};

vi.mock('../../src/stores/taskStore', () => ({
  useTaskStore: vi.fn(() => mockTaskStoreInstance)
}));

vi.mock('../../src/stores/taskStyleStore', () => ({
  useTaskStyleStore: vi.fn(() => ({
    sortedStyles: [
      { id: 'style-green', name: 'Green Preset', colors: { bgColor: '#00ff00' } }
    ]
  }))
}));

vi.mock('../../src/composables/useTheme', () => ({
  useTheme: vi.fn(() => ({
    toggleTheme: vi.fn()
  }))
}));

describe('WorkspaceContextMenu.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('deve aplicar preset global apenas em tarefas com styleLocked falso ou indefinido', async () => {
    const taskStore = useTaskStore();
    const wrapper = mount(WorkspaceContextMenu);

    // Localizar a seção de "Presets" para abrir o submenu
    const divs = wrapper.findAll('.relative');
    let presetsContainer = null;
    for (let i = 0; i < divs.length; i++) {
      if (divs.at(i).text().includes('Presets')) {
        presetsContainer = divs.at(i);
        break;
      }
    }

    expect(presetsContainer).not.toBeNull();
    await presetsContainer.trigger('mouseenter');

    // Localizar o botão de aplicação do "Green Preset"
    const buttons = wrapper.findAll('button.context-menu-item');
    let applyBtn = null;
    for (let i = 0; i < buttons.length; i++) {
      if (buttons.at(i).text().includes('Green Preset')) {
        applyBtn = buttons.at(i);
        break;
      }
    }

    expect(applyBtn).not.toBeNull();
    await applyBtn.trigger('click');

    // Validar se o updateTask foi chamado apenas para as tarefas elegíveis
    expect(taskStore.updateTask).toHaveBeenCalledWith(1, { styleId: 'style-green' });
    expect(taskStore.updateTask).not.toHaveBeenCalledWith(2, { styleId: 'style-green' });
    expect(taskStore.updateTask).toHaveBeenCalledWith(3, { styleId: 'style-green' });
  });
});

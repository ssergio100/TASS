import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useUIStore = defineStore('ui', () => {
  // Modal Visibility States
  const showWelcome = ref(false);
  const showTaskModal = ref(false);
  const showSettings = ref(false);
  const showGitRebuilder = ref(false);
  const showSprints = ref(false);
  const showInterfaceMenu = ref(false);
  const showTaskStyleBuilder = ref(false);
  const showNotes = ref(false);
  const showRadio = ref(false);
  const showTimeAdjustment = ref(false);

  // Style Picker Menu and Live Preview
  const showStylePickerMenu = ref(false);
  const stylePickerPosition = ref({ x: 0, y: 0 });
  const previewTaskId = ref(null);
  const previewStyleId = ref(null);

  // Preview global de presets (menu de contexto do Workspace)
  // null = sem preview. Qualquer outro valor (incluindo '') força o preview visual.
  const previewGlobalStyleId = ref(null);

  // Payloads / Intermediary states
  const taskToEdit = ref(null);
  const taskForTimeAdjustment = ref(null);
  const settingsInitialTab = ref(null);
  const interfaceInitialTab = ref(null);
  const sprintInitialShowAddForm = ref(false);

  const DOCK_STORAGE_KEY = 'tass_show_dock';
  const savedDockState = localStorage.getItem(DOCK_STORAGE_KEY);
  const showGlobalDock = ref(savedDockState !== null ? savedDockState === 'true' : true);
  
  watch(showGlobalDock, (val) => {
    localStorage.setItem(DOCK_STORAGE_KEY, val.toString());
  });
  
  // Workspace Context Menu
  const showWorkspaceContextMenu = ref(false);
  const workspaceContextMenuPosition = ref({ x: 0, y: 0 });

  // Actions
  const openTaskModal = (task = null) => {
    taskToEdit.value = task;
    showTaskModal.value = true;
  };

  const closeTaskModal = () => {
    showTaskModal.value = false;
    taskToEdit.value = null;
  };

  const openTimeAdjustment = (task) => {
    taskForTimeAdjustment.value = task;
    showTimeAdjustment.value = true;
  };

  const closeTimeAdjustment = () => {
    showTimeAdjustment.value = false;
    taskForTimeAdjustment.value = null;
  };

  const openSettings = (initialTab = null) => {
    settingsInitialTab.value = initialTab;
    showSettings.value = true;
  };

  const openInterfaceMenu = (initialTab = null) => {
    interfaceInitialTab.value = initialTab;
    showInterfaceMenu.value = true;
  };

  const openSprints = (showAddForm = false) => {
    sprintInitialShowAddForm.value = showAddForm;
    showSprints.value = true;
  };

  const toggleNotes = (forceState = null) => {
    if (forceState !== null) {
      showNotes.value = forceState;
    } else {
      showNotes.value = !showNotes.value;
    }
  };

  const openStylePicker = (task, event) => {
    if (showStylePickerMenu.value && previewTaskId.value === task.id) {
      closeStylePicker();
      return;
    }
    
    previewTaskId.value = task.id;
    previewStyleId.value = task.styleId || '';
    stylePickerPosition.value = { x: event.clientX, y: event.clientY };
    showStylePickerMenu.value = true;
  };

  const closeStylePicker = () => {
    showStylePickerMenu.value = false;
    previewTaskId.value = null;
    previewStyleId.value = null;
  };

  const hasOpenModal = () => {
    return showWelcome.value || 
           showTaskModal.value || 
           showSettings.value || 
           showGitRebuilder.value || 
           showSprints.value || 
           showInterfaceMenu.value || 
           showTaskStyleBuilder.value ||
           showNotes.value ||
           showRadio.value ||
           showTimeAdjustment.value ||
           showStylePickerMenu.value ||
           showWorkspaceContextMenu.value;
  };

  const closeAll = () => {
    showWelcome.value = false;
    showTaskModal.value = false;
    showSettings.value = false;
    showGitRebuilder.value = false;
    showSprints.value = false;
    showInterfaceMenu.value = false;
    showTaskStyleBuilder.value = false;
    showNotes.value = false;
    showRadio.value = false;
    showTimeAdjustment.value = false;
    showStylePickerMenu.value = false;
    showWorkspaceContextMenu.value = false;
  };

  const animatingTaskIds = ref([]);

  const triggerPresetAnimation = (taskIds) => {
    const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
    animatingTaskIds.value = [...animatingTaskIds.value, ...ids];
    setTimeout(() => {
      animatingTaskIds.value = animatingTaskIds.value.filter(id => !ids.includes(id));
    }, 600);
  };

  return {
    showWelcome, showTaskModal, showSettings, showGitRebuilder,
    showSprints, showInterfaceMenu, showTaskStyleBuilder, showNotes,
    showRadio, showTimeAdjustment, showGlobalDock,
    showWorkspaceContextMenu, workspaceContextMenuPosition,
    showStylePickerMenu, stylePickerPosition, previewTaskId, previewStyleId,
    previewGlobalStyleId,
    taskToEdit, taskForTimeAdjustment, settingsInitialTab,
    interfaceInitialTab, sprintInitialShowAddForm, animatingTaskIds,
    openTaskModal, closeTaskModal,
    openTimeAdjustment, closeTimeAdjustment,
    openSettings, openInterfaceMenu, openSprints,
    toggleNotes, openStylePicker, closeStylePicker, closeAll, hasOpenModal,
    triggerPresetAnimation
  };
});

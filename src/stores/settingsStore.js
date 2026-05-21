import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { useAuthStore } from './authStore';

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('dark');
  const columns = ref(2);
  const appWidth = ref(1400);
  const gitlabUrl = ref('https://git.lliege.com.br/POCS/ci');
  const gitlabIntegrationMode = ref('link');
  const gitlabProjectId = ref('');
  const gitlabToken = ref('');
  const gitlabBaseBranch = ref('develop');
  const inactivityThreshold = ref(1); // Em minutos
  const showEmptyPlaceholders = ref(true);
  const wellnessEnabled = ref(true);
  const wellnessInterval = ref(20); // Em minutos
  const activeSprintId = ref('all');
  const taskNumberSize = ref(12);
  const taskDescriptionSize = ref(13);
  const taskTimerSize = ref(10);
  const notesSide = ref('right');
  const backgroundImage = ref('');
  const keepWindowState = ref(localStorage.getItem('app-keep-window-state') === 'true');
  const hideWelcomeModal = ref(false);

  // Sincroniza mudança do keepWindowState com localStorage e limpa se necessário
  watch(keepWindowState, (val) => {
    localStorage.setItem('app-keep-window-state', val);
    if (!val) {
      localStorage.removeItem('app-last-settings-tab');
      localStorage.removeItem('app-last-interface-tab');
    }
  });

  const backgroundBlur = ref(0);
  const notesButtonTop = ref(128);
  const notesWidth = ref(350);
  const cardPadding = ref(16);
  const fontFamily = ref('Inter');
  const trackInactivity = ref(true);
  const workStart = ref('08:00');
  const workEnd = ref('18:00');
  const workDays = ref([1, 2, 3, 4, 5]); // Seg a Sex
  const autoPauseOutsideWork = ref(false);
  const cardOpacity = ref(80);
  const cardBorderRadius = ref(16);
  const opacityTargets = ref({
    cards: true,
    topBar: true,
    bottomBar: true,
    contextMenu: true,
    actionBar: true,
    modals: true,
    modalSidebar: true,
    modalBody: true,
    modalHeaderFooter: true,
    alerts: true
  });
  const columnTitles = ref(['', '', '', '']);
  const contextMenuStyle = ref('floating'); // 'floating' (estilo OS) ou 'dock' (estilo clássico)
  const contextMenuMode = ref('stack'); // 'stack' (empilhado) ou 'replace' (substitui a dock)
  const contrastEnhanced = ref(true);
  const darkenWallpaper = ref(true);

  const customWallpapers = ref([
    { name: 'Dark Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Minimal Nature', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Modern Scenic', url: 'https://images.unsplash.com/photo-1776811805307-a0e0289c672f?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Cozy Desk', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Studio Night', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Minimalist Zen', url: 'https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Deep Abstract', url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1920&auto=format&fit=crop' }
  ]);

  const isInitialized = ref(false);

  const loadSettings = async () => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      isInitialized.value = true;
      return;
    }
    
    try {
      const settingsMap = await authStore.request('/api/settings');

      if (settingsMap['app-theme'] !== undefined) theme.value = settingsMap['app-theme'];
      if (settingsMap['app-columns'] !== undefined) columns.value = settingsMap['app-columns'];
      if (settingsMap['app-width'] !== undefined) {
        appWidth.value = settingsMap['app-width'];
        if (appWidth.value === 1000) {
          appWidth.value = 1400;
          saveSetting('app-width', 1400);
        }
      }
      if (settingsMap['app-show-placeholders'] !== undefined) showEmptyPlaceholders.value = settingsMap['app-show-placeholders'] === true;
      if (settingsMap['app-wellness-enabled'] !== undefined) wellnessEnabled.value = settingsMap['app-wellness-enabled'] === true;
      if (settingsMap['app-wellness-interval'] !== undefined) wellnessInterval.value = parseInt(settingsMap['app-wellness-interval']);
      if (settingsMap['app-active-sprint'] !== undefined) activeSprintId.value = settingsMap['app-active-sprint'];
      if (settingsMap['app-gitlab-url'] !== undefined) gitlabUrl.value = settingsMap['app-gitlab-url'];
      if (settingsMap['app-gitlab-mode'] !== undefined) gitlabIntegrationMode.value = settingsMap['app-gitlab-mode'];
      if (settingsMap['app-gitlab-project-id'] !== undefined) gitlabProjectId.value = settingsMap['app-gitlab-project-id'];
      if (settingsMap['app-gitlab-token'] !== undefined) gitlabToken.value = settingsMap['app-gitlab-token'];
      if (settingsMap['app-gitlab-base-branch'] !== undefined) gitlabBaseBranch.value = settingsMap['app-gitlab-base-branch'];
      if (settingsMap['app-track-inactivity'] !== undefined) trackInactivity.value = settingsMap['app-track-inactivity'];
      if (settingsMap['app-inactivity-threshold'] !== undefined) inactivityThreshold.value = settingsMap['app-inactivity-threshold'];
      if (settingsMap['app-work-start'] !== undefined) workStart.value = settingsMap['app-work-start'];
      if (settingsMap['app-work-end'] !== undefined) workEnd.value = settingsMap['app-work-end'];
      if (settingsMap['app-work-days'] !== undefined) workDays.value = settingsMap['app-work-days'];
      if (settingsMap['app-auto-pause-work'] !== undefined) autoPauseOutsideWork.value = settingsMap['app-auto-pause-work'];
      if (settingsMap['app-bg-image'] !== undefined) backgroundImage.value = settingsMap['app-bg-image'];
      if (settingsMap['app-bg-blur'] !== undefined) backgroundBlur.value = settingsMap['app-bg-blur'];
      if (settingsMap['app-card-opacity'] !== undefined) cardOpacity.value = settingsMap['app-card-opacity'];
      if (settingsMap['app-card-radius'] !== undefined) cardBorderRadius.value = settingsMap['app-card-radius'];
      if (settingsMap['app-font-family'] !== undefined) fontFamily.value = settingsMap['app-font-family'];
      if (settingsMap['app-opacity-targets'] !== undefined) opacityTargets.value = settingsMap['app-opacity-targets'];
      if (settingsMap['app-hide-welcome'] !== undefined) hideWelcomeModal.value = settingsMap['app-hide-welcome'] === 'true' || settingsMap['app-hide-welcome'] === true;
      
      if (settingsMap['app-custom-wallpapers'] !== undefined) {
        customWallpapers.value = settingsMap['app-custom-wallpapers'];
      }

      if (customWallpapers.value.length === 0) {
        const eliteWallpapers = [
          { name: 'Minimalist Zen', url: 'https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?q=80&w=1920&auto=format&fit=crop' },
          { name: 'Deep Abstract', url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1920&auto=format&fit=crop' },
          { name: 'Neon Rain', url: 'https://images.unsplash.com/photo-1493238792000-811347057630?q=80&w=1920&auto=format&fit=crop' },
          { name: 'Foggy Silence', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1920&auto=format&fit=crop' },
          { name: 'Liquid Obsidian', url: 'https://images.unsplash.com/photo-1614850523296-e811cf7ef895?q=80&w=1920&auto=format&fit=crop' },
          { name: 'Scholar’s Retreat', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1920&auto=format&fit=crop' }
        ];
        customWallpapers.value = eliteWallpapers;
        saveAllSettings();
      }

      if (settingsMap['app-task-number-size'] !== undefined) taskNumberSize.value = settingsMap['app-task-number-size'];
      if (settingsMap['app-task-desc-size'] !== undefined) taskDescriptionSize.value = settingsMap['app-task-desc-size'];
      if (settingsMap['app-task-timer-size'] !== undefined) taskTimerSize.value = settingsMap['app-task-timer-size'];
      if (settingsMap['app-notes-side'] !== undefined) notesSide.value = settingsMap['app-notes-side'];
      if (settingsMap['app-notes-btn-top'] !== undefined) notesButtonTop.value = settingsMap['app-notes-btn-top'];
      if (settingsMap['app-notes-width'] !== undefined) notesWidth.value = settingsMap['app-notes-width'];
      if (settingsMap['app-card-padding'] !== undefined) cardPadding.value = settingsMap['app-card-padding'];

      if (settingsMap['app-column-titles'] !== undefined) columnTitles.value = settingsMap['app-column-titles'];
      if (settingsMap['app-context-menu-style'] !== undefined) contextMenuStyle.value = settingsMap['app-context-menu-style'];
      if (settingsMap['app-context-menu-mode'] !== undefined) contextMenuMode.value = settingsMap['app-context-menu-mode'];
      if (settingsMap['app-contrast-enhanced'] !== undefined) contrastEnhanced.value = settingsMap['app-contrast-enhanced'] === true;
      if (settingsMap['app-darken-wallpaper'] !== undefined) darkenWallpaper.value = settingsMap['app-darken-wallpaper'] === true;
      
      keepWindowState.value = localStorage.getItem('app-keep-window-state') === 'true';

      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to load settings from SQLite", error);
    }
  };

  const saveSetting = async (key, value) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;

    try {
      await authStore.request('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ [key]: value })
      });
    } catch (error) {
      console.error(`Failed to save setting ${key}`, error);
    }
  };

  const saveAllSettings = async () => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;

    const settingsToSave = {
      'app-theme': theme.value,
      'app-columns': columns.value,
      'app-width': appWidth.value,
      'app-show-placeholders': showEmptyPlaceholders.value,
      'app-wellness-enabled': wellnessEnabled.value,
      'app-wellness-interval': wellnessInterval.value,
      'app-active-sprint': activeSprintId.value,
      'app-gitlab-url': gitlabUrl.value,
      'app-gitlab-mode': gitlabIntegrationMode.value,
      'app-gitlab-project-id': gitlabProjectId.value,
      'app-gitlab-token': gitlabToken.value,
      'app-gitlab-base-branch': gitlabBaseBranch.value,
      'app-track-inactivity': trackInactivity.value,
      'app-inactivity-threshold': inactivityThreshold.value,
      'app-work-start': workStart.value,
      'app-work-end': workEnd.value,
      'app-work-days': workDays.value,
      'app-auto-pause-work': autoPauseOutsideWork.value,
      'app-bg-image': backgroundImage.value,
      'app-bg-blur': backgroundBlur.value,
      'app-card-opacity': cardOpacity.value,
      'app-card-radius': cardBorderRadius.value,
      'app-font-family': fontFamily.value,
      'app-opacity-targets': opacityTargets.value,
      'app-custom-wallpapers': customWallpapers.value,
      'app-task-number-size': taskNumberSize.value,
      'app-task-desc-size': taskDescriptionSize.value,
      'app-task-timer-size': taskTimerSize.value,
      'app-notes-side': notesSide.value,
      'app-notes-btn-top': notesButtonTop.value,
      'app-notes-width': notesWidth.value,
      'app-card-padding': cardPadding.value,
      'app-column-titles': columnTitles.value,
      'app-context-menu-style': contextMenuStyle.value,
      'app-context-menu-mode': contextMenuMode.value,
      'app-contrast-enhanced': contrastEnhanced.value,
      'app-darken-wallpaper': darkenWallpaper.value,
      'app-hide-welcome': hideWelcomeModal.value
    };

    try {
      await authStore.request('/api/settings', {
        method: 'POST',
        body: JSON.stringify(settingsToSave)
      });
      console.log("All settings saved to SQLite");
    } catch (error) {
      console.error("Failed to save all settings", error);
    }
  };

  return {
    theme, columns, appWidth, gitlabUrl, gitlabIntegrationMode,
    gitlabProjectId, gitlabToken, gitlabBaseBranch,
    inactivityThreshold, activeSprintId, taskNumberSize,
    taskDescriptionSize, taskTimerSize, notesSide, backgroundImage, backgroundBlur,
    notesButtonTop, notesWidth, cardPadding, fontFamily, trackInactivity,
    workStart, workEnd, workDays, autoPauseOutsideWork, cardOpacity,
    cardBorderRadius, opacityTargets, customWallpapers, columnTitles,
    wellnessEnabled, wellnessInterval, contrastEnhanced, darkenWallpaper, keepWindowState,
    contextMenuStyle, contextMenuMode, hideWelcomeModal,
    isInitialized, loadSettings, saveSetting, saveAllSettings
  };
});

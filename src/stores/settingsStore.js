import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import {
  getBaseEnvironment,
  getDefaultGitEnvironmentConfig,
  loadGitEnvironmentConfig
} from '../utils/gitEnvironments.js';

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('dark');
  const columns = ref(2);
  const appWidth = ref(1400);
  const gitlabUrl = ref('https://git.lliege.com.br/POCS/ci');
  const gitlabIntegrationMode = ref('link');
  const gitlabProjectId = ref('');
  const gitlabToken = ref('');
  const gitProvider = ref('gitlab');
  const githubOwner = ref('');
  const githubRepo = ref('');
  const githubToken = ref('');
  const inactivityThreshold = ref(1); // Em minutos
  const showEmptyPlaceholders = ref(true);
  const wellnessEnabled = ref(true);
  const wellnessInterval = ref(20); // Em minutos
  const activeSprintId = ref('all');
  const taskNumberSize = ref(12);
  const taskDescriptionSize = ref(13);
  const taskTimerSize = ref(10);
  const taskMinHeight = ref(40);
  const taskMaxWidth = ref(0); // 0 significa 100% (auto)
  const notesSide = ref('right');
  const backgroundImage = ref('');
  const keepWindowState = ref(localStorage.getItem('app-keep-window-state') === 'true');
  const hideWelcomeModal = ref(false);
  
  const gitlabDefaults = getDefaultGitEnvironmentConfig('gitlab');
  const gitlabEnvironments = ref(gitlabDefaults.environments);
  const gitlabBaseEnvironmentId = ref(gitlabDefaults.baseEnvironmentId);

  const githubDefaults = getDefaultGitEnvironmentConfig('github');
  const githubEnvironments = ref(githubDefaults.environments);
  const githubBaseEnvironmentId = ref(githubDefaults.baseEnvironmentId);

  const consoleFontSize = ref(11);

  // A interface e os serviços consomem uma coleção genérica, sem inferir papéis pelo nome.
  const activeEnvironments = computed(() => (
    gitProvider.value === 'gitlab' ? gitlabEnvironments.value : githubEnvironments.value
  ));
  const activeBaseEnvironmentId = computed(() => (
    gitProvider.value === 'gitlab' ? gitlabBaseEnvironmentId.value : githubBaseEnvironmentId.value
  ));
  const activeBaseEnvironment = computed(() => (
    getBaseEnvironment(activeEnvironments.value, activeBaseEnvironmentId.value)
  ));
  const activeBaseBranch = computed(() => activeBaseEnvironment.value?.branch || '');

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
  
  // Widget Radio
  const radioPositionX = ref(window.innerWidth - 350);
  const radioPositionY = ref(80);
  
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
    contextMenu: true,
    actionBar: true,
    modals: true,
    modalSidebar: true,
    modalBody: true,
    modalHeaderFooter: true,
    alerts: true,
    notes: true
  });
  const globalGlassEnabled = ref(true);
  const columnTitles = ref(['', '', '', '', '', '']);
  const columnStyles = ref(['', '', '', '', '', '']);
  const contextMenuStyle = ref('floating'); // 'floating' (estilo OS) ou 'dock' (estilo clássico)
  const contextMenuMode = ref('stack'); // 'stack' (empilhado) ou 'replace' (substitui a dock)
  const contrastEnhanced = ref(true);
  const darkenWallpaper = ref(true);
  const taskStyleProfiles = ref([]);
  
  const titlePalette = ref([]);
  const bodyPalette = ref([]);
  const textLightPalette = ref([]);
  const textDarkPalette = ref([]);

  // Widgets
  const weatherWidgetEnabled = ref(false);
  const weatherCity = ref('');
  const immersiveClockEnabled = ref(true);

  // Doca (Dock)
  const dockIconSize = ref(16);
  const dockBackgroundEnabled = ref(true);
  const dockOpacity = ref(80);
  const dockVisibleItems = ref({
    addTask: true,
    workedHours: true,
    sprints: true,
    weather: true,
    filters: true,
    gitRebuilder: true,
    radio: true,
    notes: true,
    themeToggle: true,
    settings: true
  });

  // Getters Universais
  const normalizedCardOpacity = computed(() => {
    return (globalGlassEnabled.value && opacityTargets.value?.cards) ? Math.max(0, (100 - cardOpacity.value) / 100) : 1.0;
  });

  const normalizedDockOpacity = computed(() => {
    return globalGlassEnabled.value ? Math.max(0, (100 - dockOpacity.value) / 100) : 1.0;
  });

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
    try {
      const allSettings = await db.settings.toArray();
      const settingsMap = Object.fromEntries(allSettings.map(s => [s.key, s.value]));

      if (settingsMap['app-theme'] !== undefined) theme.value = settingsMap['app-theme'];
      if (settingsMap['app-columns'] !== undefined) columns.value = settingsMap['app-columns'];
      if (settingsMap['app-work-days'] !== undefined) workDays.value = settingsMap['app-work-days'];
      if (settingsMap['app-width'] !== undefined) {
        appWidth.value = settingsMap['app-width'];
        // Auto-upgrade: Se o usuário estiver no padrão antigo (1000px), sobe para o novo padrão (1400px)
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
      if (settingsMap['app-git-provider'] !== undefined) gitProvider.value = settingsMap['app-git-provider'];
      if (settingsMap['app-github-owner'] !== undefined) githubOwner.value = settingsMap['app-github-owner'];
      if (settingsMap['app-github-repo'] !== undefined) githubRepo.value = settingsMap['app-github-repo'];
      if (settingsMap['app-github-token'] !== undefined) githubToken.value = settingsMap['app-github-token'];
      if (settingsMap['app-track-inactivity'] !== undefined) trackInactivity.value = settingsMap['app-track-inactivity'];
      if (settingsMap['app-inactivity-threshold'] !== undefined) inactivityThreshold.value = settingsMap['app-inactivity-threshold'];
      if (settingsMap['app-work-start'] !== undefined) workStart.value = settingsMap['app-work-start'];
      if (settingsMap['app-work-end'] !== undefined) workEnd.value = settingsMap['app-work-end'];
      if (settingsMap['app-auto-pause-work'] !== undefined) autoPauseOutsideWork.value = settingsMap['app-auto-pause-work'];
      if (settingsMap['app-bg-image'] !== undefined) {
        backgroundImage.value = settingsMap['app-bg-image'];
      }
      if (settingsMap['app-bg-blur'] !== undefined) backgroundBlur.value = settingsMap['app-bg-blur'];
      if (settingsMap['app-card-opacity'] !== undefined) cardOpacity.value = settingsMap['app-card-opacity'];
      if (settingsMap['app-card-radius'] !== undefined) cardBorderRadius.value = settingsMap['app-card-radius'];
      if (settingsMap['app-font-family'] !== undefined) fontFamily.value = settingsMap['app-font-family'];
      if (settingsMap['app-opacity-targets'] !== undefined) opacityTargets.value = settingsMap['app-opacity-targets'];
      if (settingsMap['app-global-glass'] !== undefined) globalGlassEnabled.value = settingsMap['app-global-glass'];
      
      if (settingsMap['app-title-palette'] !== undefined) titlePalette.value = settingsMap['app-title-palette'];
      if (settingsMap['app-body-palette'] !== undefined) bodyPalette.value = settingsMap['app-body-palette'];
      if (settingsMap['app-text-light-palette'] !== undefined) textLightPalette.value = settingsMap['app-text-light-palette'];
      if (settingsMap['app-text-dark-palette'] !== undefined) textDarkPalette.value = settingsMap['app-text-dark-palette'];
      
      // Carrega wallpapers customizados salvos no banco
      if (settingsMap['app-custom-wallpapers'] !== undefined) {
        customWallpapers.value = settingsMap['app-custom-wallpapers'];
      }

      if (settingsMap['app-radio-pos-x'] !== undefined) radioPositionX.value = settingsMap['app-radio-pos-x'];
      if (settingsMap['app-radio-pos-y'] !== undefined) radioPositionY.value = settingsMap['app-radio-pos-y'];


      if (settingsMap['app-task-number-size'] !== undefined) taskNumberSize.value = settingsMap['app-task-number-size'];
      if (settingsMap['app-task-desc-size'] !== undefined) taskDescriptionSize.value = settingsMap['app-task-desc-size'];
      if (settingsMap['app-task-timer-size'] !== undefined) taskTimerSize.value = settingsMap['app-task-timer-size'];
      if (settingsMap['app-task-min-height'] !== undefined) taskMinHeight.value = settingsMap['app-task-min-height'];
      if (settingsMap['app-task-max-width'] !== undefined) taskMaxWidth.value = settingsMap['app-task-max-width'];
      if (settingsMap['app-notes-side'] !== undefined) notesSide.value = settingsMap['app-notes-side'];
      if (settingsMap['app-notes-btn-top'] !== undefined) notesButtonTop.value = settingsMap['app-notes-btn-top'];
      if (settingsMap['app-notes-width'] !== undefined) notesWidth.value = settingsMap['app-notes-width'];
      if (settingsMap['app-card-padding'] !== undefined) cardPadding.value = settingsMap['app-card-padding'];

      if (settingsMap['app-column-titles'] !== undefined) columnTitles.value = settingsMap['app-column-titles'];
      if (settingsMap['app-column-styles'] !== undefined) columnStyles.value = settingsMap['app-column-styles'];
      if (settingsMap['app-context-menu-style'] !== undefined) contextMenuStyle.value = settingsMap['app-context-menu-style'];
      if (settingsMap['app-context-menu-mode'] !== undefined) contextMenuMode.value = settingsMap['app-context-menu-mode'];
      if (settingsMap['app-contrast-enhanced'] !== undefined) contrastEnhanced.value = settingsMap['app-contrast-enhanced'] === true;
      if (settingsMap['app-darken-wallpaper'] !== undefined) darkenWallpaper.value = settingsMap['app-darken-wallpaper'] === true;
      if (settingsMap['app-task-style-profiles'] !== undefined) taskStyleProfiles.value = settingsMap['app-task-style-profiles'];
      
      // Carrega configuração do localStorage
      keepWindowState.value = localStorage.getItem('app-keep-window-state') === 'true';
      if (settingsMap['app-hide-welcome'] !== undefined) hideWelcomeModal.value = settingsMap['app-hide-welcome'] === true;

      // Widgets
      if (settingsMap['app-weather-enabled'] !== undefined) weatherWidgetEnabled.value = settingsMap['app-weather-enabled'] === true;
      if (settingsMap['app-weather-city'] !== undefined) weatherCity.value = settingsMap['app-weather-city'];
      if (settingsMap['app-immersive-clock'] !== undefined) immersiveClockEnabled.value = settingsMap['app-immersive-clock'] === true;
      
      const gitlabEnvironmentConfig = loadGitEnvironmentConfig(settingsMap, 'gitlab');
      gitlabEnvironments.value = gitlabEnvironmentConfig.environments;
      gitlabBaseEnvironmentId.value = gitlabEnvironmentConfig.baseEnvironmentId;

      const githubEnvironmentConfig = loadGitEnvironmentConfig(settingsMap, 'github');
      githubEnvironments.value = githubEnvironmentConfig.environments;
      githubBaseEnvironmentId.value = githubEnvironmentConfig.baseEnvironmentId;

      // A migração grava imediatamente o formato novo para que o legado seja lido uma única vez.
      if (gitlabEnvironmentConfig.migrated || githubEnvironmentConfig.migrated) {
        await db.settings.bulkPut([
          { key: 'app-gitlab-environments', value: JSON.parse(JSON.stringify(gitlabEnvironments.value)) },
          { key: 'app-gitlab-base-environment-id', value: gitlabBaseEnvironmentId.value },
          { key: 'app-github-environments', value: JSON.parse(JSON.stringify(githubEnvironments.value)) },
          { key: 'app-github-base-environment-id', value: githubBaseEnvironmentId.value }
        ]);
      }
      if (settingsMap['app-console-font-size'] !== undefined) consoleFontSize.value = parseInt(settingsMap['app-console-font-size'], 10);
      
      // Doca (Dock)
      if (settingsMap['app-dock-icon-size'] !== undefined) dockIconSize.value = parseInt(settingsMap['app-dock-icon-size'], 10);
      if (settingsMap['app-dock-bg-enabled'] !== undefined) {
        dockBackgroundEnabled.value = settingsMap['app-dock-bg-enabled'] === true;
      }
      if (settingsMap['app-dock-opacity'] !== undefined) {
        dockOpacity.value = parseInt(settingsMap['app-dock-opacity'], 10);
      }
      if (settingsMap['app-dock-visible-items'] !== undefined) {
        dockVisibleItems.value = {
          ...dockVisibleItems.value,
          ...settingsMap['app-dock-visible-items']
        };
      }

      // Injeção Inteligente: Sugere os wallpapers de elite apenas se a galeria ainda estiver vazia
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
        await saveAllSettings(); // Salva a carga inicial
      }

      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to load settings from IndexedDB", error);
      notificationService.toast("Erro ao carregar as configurações locais do sistema.", "error");
    }
  };

  const saveSetting = async (key, value) => {
    try {
      // "Limpa" o dado para remover proxies do Vue e evitar DataCloneError no IndexedDB
      const cleanValue = (value && typeof value === 'object') 
        ? JSON.parse(JSON.stringify(value)) 
        : value;
      await db.settings.put({ key, value: cleanValue });
    } catch (error) {
      console.error(`Failed to save setting ${key}`, error);
      notificationService.toast("Falha ao salvar configuração no banco de dados.", "error");
    }
  };

  const saveAllSettings = async () => {
    const settingsToSave = [
      { key: 'app-theme', value: theme.value },
      { key: 'app-columns', value: columns.value },
      { key: 'app-width', value: appWidth.value },
      { key: 'app-show-placeholders', value: showEmptyPlaceholders.value },
      { key: 'app-wellness-enabled', value: wellnessEnabled.value },
      { key: 'app-wellness-interval', value: wellnessInterval.value },
      { key: 'app-active-sprint', value: activeSprintId.value },
      { key: 'app-gitlab-url', value: gitlabUrl.value },
      { key: 'app-gitlab-mode', value: gitlabIntegrationMode.value },
      { key: 'app-gitlab-project-id', value: gitlabProjectId.value },
      { key: 'app-gitlab-token', value: gitlabToken.value },
      { key: 'app-git-provider', value: gitProvider.value },
      { key: 'app-github-owner', value: githubOwner.value },
      { key: 'app-github-repo', value: githubRepo.value },
      { key: 'app-github-token', value: githubToken.value },
      { key: 'app-track-inactivity', value: trackInactivity.value },
      { key: 'app-inactivity-threshold', value: inactivityThreshold.value },
      { key: 'app-work-start', value: workStart.value },
      { key: 'app-work-end', value: workEnd.value },
      { key: 'app-work-days', value: workDays.value },
      { key: 'app-auto-pause-work', value: autoPauseOutsideWork.value },
      { key: 'app-bg-image', value: backgroundImage.value },
      { key: 'app-bg-blur', value: backgroundBlur.value },
      { key: 'app-card-opacity', value: cardOpacity.value },
      { key: 'app-card-radius', value: cardBorderRadius.value },
      { key: 'app-font-family', value: fontFamily.value },
      { key: 'app-opacity-targets', value: opacityTargets.value },
      { key: 'app-global-glass', value: globalGlassEnabled.value },
      { key: 'app-custom-wallpapers', value: customWallpapers.value },
      { key: 'app-task-number-size', value: taskNumberSize.value },
      { key: 'app-task-desc-size', value: taskDescriptionSize.value },
      { key: 'app-task-timer-size', value: taskTimerSize.value },
      { key: 'app-task-min-height', value: taskMinHeight.value },
      { key: 'app-task-max-width', value: taskMaxWidth.value },
      { key: 'app-notes-side', value: notesSide.value },
      { key: 'app-notes-btn-top', value: notesButtonTop.value },
      { key: 'app-notes-width', value: notesWidth.value },
      { key: 'app-radio-pos-x', value: radioPositionX.value },
      { key: 'app-radio-pos-y', value: radioPositionY.value },
      { key: 'app-card-padding', value: cardPadding.value },

      { key: 'app-column-titles', value: columnTitles.value },
      { key: 'app-column-styles', value: columnStyles.value },
      { key: 'app-context-menu-style', value: contextMenuStyle.value },
      { key: 'app-context-menu-mode', value: contextMenuMode.value },
      { key: 'app-contrast-enhanced', value: contrastEnhanced.value },
      { key: 'app-darken-wallpaper', value: darkenWallpaper.value },
      { key: 'app-task-style-profiles', value: taskStyleProfiles.value },
      { key: 'app-title-palette', value: titlePalette.value },
      { key: 'app-body-palette', value: bodyPalette.value },
      { key: 'app-text-light-palette', value: textLightPalette.value },
      { key: 'app-text-dark-palette', value: textDarkPalette.value },
      { key: 'app-hide-welcome', value: hideWelcomeModal.value },
      { key: 'app-weather-enabled', value: weatherWidgetEnabled.value },
      { key: 'app-weather-city', value: weatherCity.value },
      { key: 'app-immersive-clock', value: immersiveClockEnabled.value },
      { key: 'app-gitlab-environments', value: gitlabEnvironments.value },
      { key: 'app-gitlab-base-environment-id', value: gitlabBaseEnvironmentId.value },
      { key: 'app-github-environments', value: githubEnvironments.value },
      { key: 'app-github-base-environment-id', value: githubBaseEnvironmentId.value },
      { key: 'app-console-font-size', value: consoleFontSize.value },
      { key: 'app-dock-icon-size', value: dockIconSize.value },
      { key: 'app-dock-bg-enabled', value: dockBackgroundEnabled.value },
      { key: 'app-dock-opacity', value: dockOpacity.value },
      { key: 'app-dock-visible-items', value: dockVisibleItems.value }

    ].map(item => ({
      key: item.key,
      // "Limpa" o dado para remover proxies do Vue
      value: (item.value && typeof item.value === 'object') 
        ? JSON.parse(JSON.stringify(item.value)) 
        : item.value
    }));

    try {
      await db.settings.bulkPut(settingsToSave);
      console.log("All settings saved to database");
    } catch (error) {
      console.error("Failed to save all settings", error);
      notificationService.toast("Erro ao salvar configurações no banco de dados.", "error");
    }
  };

  return {
    theme, columns, appWidth, gitlabUrl, gitlabIntegrationMode,
    gitlabProjectId, gitlabToken,
    gitProvider, githubOwner, githubRepo, githubToken,
    inactivityThreshold, activeSprintId, taskNumberSize,
    taskDescriptionSize, taskTimerSize, taskMinHeight, taskMaxWidth, notesSide, backgroundImage, backgroundBlur,
    notesButtonTop, notesWidth, radioPositionX, radioPositionY, cardPadding, fontFamily, trackInactivity,

    workStart, workEnd, workDays, autoPauseOutsideWork, cardOpacity,
    cardBorderRadius, opacityTargets, customWallpapers, columnTitles, columnStyles,
    wellnessEnabled, wellnessInterval, contrastEnhanced, darkenWallpaper, keepWindowState,
    contextMenuStyle, contextMenuMode, hideWelcomeModal,
    gitlabEnvironments, gitlabBaseEnvironmentId,
    githubEnvironments, githubBaseEnvironmentId,
    activeEnvironments, activeBaseEnvironmentId, activeBaseEnvironment, activeBaseBranch,
    consoleFontSize, taskStyleProfiles,
    titlePalette, bodyPalette, textLightPalette, textDarkPalette,
    isInitialized, globalGlassEnabled,
    weatherWidgetEnabled, weatherCity,
    dockIconSize, dockVisibleItems, dockBackgroundEnabled, dockOpacity, normalizedDockOpacity,
    loadSettings, saveSetting, saveAllSettings, normalizedCardOpacity

  };
});

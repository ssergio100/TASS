<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { 
  Download, Upload, Globe, Palette, Cloud, Loader2, LogOut, LogIn, Trash2,
  ShieldCheck, Monitor, Briefcase, Activity, FileJson, Server, Clock, X, Sparkles, Bug, MousePointer2, Layout, Layers, Maximize,
  RefreshCw, Play, CheckCircle2, AlertTriangle, Terminal, ArrowRight, History, Info, Github, MessageCircle, Code2, Coffee, Copy, Keyboard
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/notificationService';
import { googleDriveService } from '../services/googleDriveService';
import { backupService } from '../services/backupService';
import { db } from '../db.js';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import BaseModal from './BaseModal.vue';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { ptBR } from 'date-fns/locale';
import '@vuepic/vue-datepicker/dist/main.css';
import AppInput from './base/AppInput.vue';
import AppSelect from './base/AppSelect.vue';
import AppRadio from './base/AppRadio.vue';
import QrcodeVue from 'qrcode.vue';
import { useTabSwipe } from '../composables/useTabSwipe';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const uiStore = useUIStore();
const props = defineProps({
  initialTab: {
    type: String,
    default: null
  }
});
const emit = defineEmits(['save', 'test-wellness', 'close', 'open-interface']);
const activeTab = ref(props.initialTab || 'git');
const isGoogleLoading = ref(false);
const isGoogleAuthenticated = ref(googleDriveService.isAuthenticated());
const googleUser = ref(googleDriveService.getProfile());
const googleBackups = ref([]);
const showGoogleRestoreList = ref(false);

const showPix = ref(false);
const pixKey = '8990fa68-8d2b-45e9-a588-531c620845d0';

const copyPixKey = async () => {
  try {
    await navigator.clipboard.writeText(pixKey);
    notificationService.toast('Chave PIX copiada!', 'success');
  } catch (err) {
    console.error('Erro ao copiar chave PIX para a área de transferência:', err);
    notificationService.toast(`Erro ao copiar chave PIX: ${err.message}`, 'error');
  }
};

onMounted(() => {
  // Inicializa o serviço do Google com um callback para atualizar o estado de autenticação
  googleDriveService.init((status, profile) => {
    isGoogleAuthenticated.value = status;
    googleUser.value = profile;
  });

  if (props.initialTab) {
    activeTab.value = props.initialTab;
  } else if (settings.keepWindowState) {
    const saved = localStorage.getItem('app-last-settings-tab');
    if (saved) activeTab.value = saved;
  }
});

watch(activeTab, (newVal, oldVal) => {
  if (newVal === 'action-interface') {
    emit('open-interface');
    setTimeout(() => { activeTab.value = oldVal !== 'action-interface' && oldVal ? oldVal : 'about'; }, 50);
  } else if (settings.keepWindowState) {
    localStorage.setItem('app-last-settings-tab', newVal);
  }
});

const tabs = [
  { id: 'git', label: 'Integração Remota', icon: Globe, color: 'text-indigo-500', desc: 'Conecte ao GitHub ou GitLab.' },
  { id: 'work', label: 'Jornada de Trabalho', icon: Briefcase, color: 'text-indigo-500', desc: 'Defina seu horário e dias de trabalho.' },
  { id: 'health', label: 'Saúde e Bem-estar', icon: Activity, color: 'text-indigo-500', desc: 'Lembretes inteligentes para manter sua saúde.' },
  { id: 'system', label: 'Sistema e Interface', icon: Monitor, color: 'text-indigo-500', desc: 'Configurações globais de comportamento.' },
  { id: 'security', label: 'Dados e Segurança', icon: ShieldCheck, color: 'text-indigo-500', desc: 'Gerencie backups e o banco de dados local.' },
  { id: 'shortcuts', label: 'Atalhos', icon: Keyboard, color: 'text-indigo-500', desc: 'Aumente sua produtividade com o teclado.' },
  { id: 'about', label: 'Sobre o TASS', icon: Info, color: 'text-indigo-500', desc: 'Informações, desenvolvedor e links.' },
  { id: 'action-interface', label: 'Ajustes Visuais', icon: Palette, color: 'text-indigo-500', isAction: true },
];

const activeTabObj = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);

const navRef = ref(null);
const swipeAreaRef = ref(null);
const { offsetX, isSwiping, jumpMode, disableVueTransition } = useTabSwipe(activeTab, tabs, navRef, swipeAreaRef);

// Helper to convert "HH:mm" to { hours, minutes }
const stringToTimeObj = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const [h, m] = timeStr.split(':');
  return { hours: parseInt(h) || 0, minutes: parseInt(m) || 0 };
};

// Helper to convert { hours, minutes } to "HH:mm"
const timeObjToString = (obj) => {
  if (!obj) return "00:00";
  return `${String(obj.hours).padStart(2, '0')}:${String(obj.minutes).padStart(2, '0')}`;
};

// Local state for transactional editing
const localSettings = ref({
  gitProvider: settings.gitProvider,
  githubOwner: settings.githubOwner,
  githubRepo: settings.githubRepo,
  githubToken: settings.githubToken,
  gitlabUrl: settings.gitlabUrl,
  gitlabIntegrationMode: settings.gitlabIntegrationMode,
  gitlabProjectId: settings.gitlabProjectId,
  gitlabToken: settings.gitlabToken,
  gitlabBranchMaster: settings.gitlabBranchMaster,
  gitlabAliasMaster: settings.gitlabAliasMaster,
  gitlabBranchHml: settings.gitlabBranchHml,
  gitlabAliasHml: settings.gitlabAliasHml,
  gitlabBranchDev: settings.gitlabBranchDev,
  gitlabAliasDev: settings.gitlabAliasDev,
  gitlabBaseTarget: settings.gitlabBaseTarget,
  githubBranchMaster: settings.githubBranchMaster,
  githubAliasMaster: settings.githubAliasMaster,
  githubBranchHml: settings.githubBranchHml,
  githubAliasHml: settings.githubAliasHml,
  githubBranchDev: settings.githubBranchDev,
  githubAliasDev: settings.githubAliasDev,
  githubBaseTarget: settings.githubBaseTarget,
  trackInactivity: settings.trackInactivity,
  workStart: stringToTimeObj(settings.workStart),
  workEnd: stringToTimeObj(settings.workEnd),
  workDays: [...settings.workDays],
  autoPauseOutsideWork: settings.autoPauseOutsideWork,
  wellnessEnabled: settings.wellnessEnabled,
  wellnessInterval: settings.wellnessInterval,
  inactivityThreshold: { 
    hours: Math.floor((settings.inactivityThreshold || 1) / 60), 
    minutes: (settings.inactivityThreshold || 1) % 60 
  },
  contrastEnhanced: settings.contrastEnhanced,
  darkenWallpaper: settings.darkenWallpaper,
  notesSide: settings.notesSide,
  contextMenuStyle: settings.contextMenuStyle,
  contextMenuMode: settings.contextMenuMode,
  hideWelcomeModal: settings.hideWelcomeModal
});


const dayNames = [
  { id: 1, label: 'S' }, { id: 2, label: 'T' }, { id: 3, label: 'Q' }, 
  { id: 4, label: 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }, { id: 0, label: 'D' }
];

const toggleDay = (dayId) => {
  const index = localSettings.value.workDays.indexOf(dayId);
  if (index > -1) {
    localSettings.value.workDays.splice(index, 1);
  } else {
    localSettings.value.workDays.push(dayId);
    localSettings.value.workDays.sort();
  }
};

const testGitStatus = ref(null);
const testGitMessage = ref('');

const githubRepos = ref([]);
const githubReposLoading = ref(false);
const githubReposLoaded = ref(false);
const githubReposError = ref('');

const loadGithubRepos = async (force = false) => {
  const owner = localSettings.value.githubOwner;
  const token = localSettings.value.githubToken;
  if (!owner || !token) {
    githubRepos.value = [];
    githubReposError.value = 'Informe o Dono e o Token para listar os repositórios.';
    return;
  }
  if (githubReposLoaded.value && !force) return;
  githubReposLoading.value = true;
  githubReposError.value = '';
  try {
    const allRepos = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 10) {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&page=${page}&sort=updated`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      if (!res.ok) throw new Error(`GitHub respondeu com erro HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      allRepos.push(...data);
      if (data.length < 100) hasMore = false;
      page += 1;
    }
    githubRepos.value = allRepos
      .map(r => ({ value: r.name, label: r.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    githubReposLoaded.value = true;
  } catch (err) {
    githubReposError.value = `Erro ao carregar repositórios: ${err.message}`;
  } finally {
    githubReposLoading.value = false;
  }
};

watch(
  () => [localSettings.value.githubOwner, localSettings.value.githubToken],
  () => {
    githubReposLoaded.value = false;
    githubRepos.value = [];
    githubReposError.value = '';
  }
);

const testGitConnection = async () => {
  testGitStatus.value = 'checking';
  testGitMessage.value = 'Testando conexão...';
  
  if (localSettings.value.gitProvider === 'gitlab') {
    const token = localSettings.value.gitlabToken;
    const projectId = localSettings.value.gitlabProjectId;
    let apiBase = localSettings.value.gitlabUrl || 'https://gitlab.com';
    
    if (localSettings.value.gitlabIntegrationMode === 'link') {
      testGitStatus.value = 'warning';
      testGitMessage.value = 'Modo Link Mágico ativado. Não é possível testar conexão via API.';
      return;
    }
    
    if (!token || !projectId) {
      testGitStatus.value = 'error';
      testGitMessage.value = 'Token e ID do Projeto são obrigatórios para o GitLab.';
      return;
    }
    
    try {
      if (!apiBase.includes('/api/v4')) {
        const urlObj = new URL(apiBase);
        apiBase = `${urlObj.protocol}//${urlObj.host}/api/v4`;
      }
      const safeProjectId = encodeURIComponent(decodeURIComponent(projectId));
      const url = `${apiBase}/projects/${safeProjectId}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': token
        }
      });

      if (res.ok) {
        const data = await res.json();
        testGitStatus.value = 'success';
        testGitMessage.value = `Conectado! Projeto: "${data.name_with_namespace}"`;
      } else {
        testGitStatus.value = 'error';
        testGitMessage.value = `GitLab respondeu com erro HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (err) {
      testGitStatus.value = 'error';
      testGitMessage.value = `Erro de rede/resolução: ${err.message}`;
    }
  } else if (localSettings.value.gitProvider === 'github') {
    const owner = localSettings.value.githubOwner;
    const repo = localSettings.value.githubRepo;
    const token = localSettings.value.githubToken;
    
    if (!owner || !repo || !token) {
      testGitStatus.value = 'error';
      testGitMessage.value = 'Dono, Repositório e Token são obrigatórios para o GitHub.';
      return;
    }
    
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        testGitStatus.value = 'success';
        testGitMessage.value = `Conectado! Repositório: "${data.full_name}"`;
      } else {
        testGitStatus.value = 'error';
        testGitMessage.value = `GitHub respondeu com erro HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (err) {
      testGitStatus.value = 'error';
      testGitMessage.value = `Erro de rede/resolução: ${err.message}`;
    }
  }
};

const handleSave = async () => {
  settings.gitProvider = localSettings.value.gitProvider;
  settings.githubOwner = localSettings.value.githubOwner;
  settings.githubRepo = localSettings.value.githubRepo;
  settings.githubToken = localSettings.value.githubToken;
  settings.gitlabUrl = localSettings.value.gitlabUrl;
  settings.gitlabIntegrationMode = localSettings.value.gitlabIntegrationMode;
  settings.gitlabProjectId = localSettings.value.gitlabProjectId;
  settings.gitlabToken = localSettings.value.gitlabToken;
  settings.gitlabBranchMaster = localSettings.value.gitlabBranchMaster;
  settings.gitlabAliasMaster = localSettings.value.gitlabAliasMaster;
  settings.gitlabBranchHml = localSettings.value.gitlabBranchHml;
  settings.gitlabAliasHml = localSettings.value.gitlabAliasHml;
  settings.gitlabBranchDev = localSettings.value.gitlabBranchDev;
  settings.gitlabAliasDev = localSettings.value.gitlabAliasDev;
  settings.gitlabBaseTarget = localSettings.value.gitlabBaseTarget;
  settings.githubBranchMaster = localSettings.value.githubBranchMaster;
  settings.githubAliasMaster = localSettings.value.githubAliasMaster;
  settings.githubBranchHml = localSettings.value.githubBranchHml;
  settings.githubAliasHml = localSettings.value.githubAliasHml;
  settings.githubBranchDev = localSettings.value.githubBranchDev;
  settings.githubAliasDev = localSettings.value.githubAliasDev;
  settings.githubBaseTarget = localSettings.value.githubBaseTarget;
  settings.trackInactivity = localSettings.value.trackInactivity;
  settings.workStart = timeObjToString(localSettings.value.workStart);
  settings.workEnd = timeObjToString(localSettings.value.workEnd);
  settings.workDays = [...localSettings.value.workDays];
  settings.autoPauseOutsideWork = localSettings.value.autoPauseOutsideWork;
  settings.wellnessEnabled = localSettings.value.wellnessEnabled;
  settings.wellnessInterval = localSettings.value.wellnessInterval;
  settings.inactivityThreshold = (localSettings.value.inactivityThreshold.hours * 60) + localSettings.value.inactivityThreshold.minutes;
  settings.contrastEnhanced = localSettings.value.contrastEnhanced;
  settings.darkenWallpaper = localSettings.value.darkenWallpaper;
  settings.notesSide = localSettings.value.notesSide;
  settings.contextMenuStyle = localSettings.value.contextMenuStyle;
  settings.contextMenuMode = localSettings.value.contextMenuMode;
  settings.hideWelcomeModal = localSettings.value.hideWelcomeModal;

  await settings.saveAllSettings();
  notificationService.toast('Configurações Salvas!');
  emit('save');
};

const handleExportTasks = () => backupService.exportTasks();
const handleExportSystem = () => backupService.exportSystem();

const handleImportTasks = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await backupService.importTasks(file, taskStore);
    event.target.value = '';
  }
};

const handleImportSystem = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await backupService.importSystem(file, settings, taskStore);
    // Reload logic for theme can be handled by reactivity or emitting an event if really needed.
    // For now, it will load settings and reactivity will pick up.
    event.target.value = '';
  }
};

// --- GOOGLE DRIVE HANDLERS ---
const handleGoogleLogin = () => googleDriveService.login();
const handleGoogleLogout = () => {
  googleDriveService.logout();
  googleBackups.value = [];
  showGoogleRestoreList.value = false;
};

const handleGoogleBackup = async () => {
  isGoogleLoading.value = true;
  try {
    const data = await backupService.getFullBackupData();
    const success = await googleDriveService.uploadBackup(data);
    if (success) {
      notificationService.toast('Backup enviado com sucesso!', 'success');
    }
  } catch (error) {
    console.error('Google Backup Failed:', error);
  } finally {
    isGoogleLoading.value = false;
  }
};

const handleLoadGoogleBackups = async () => {
  isGoogleLoading.value = true;
  try {
    const files = await googleDriveService.listBackups();
    googleBackups.value = files;
    showGoogleRestoreList.value = true;
  } catch (error) {
    console.error('Failed to load Google backups:', error);
  } finally {
    isGoogleLoading.value = false;
  }
};

const handleRestoreFromGoogle = async (file) => {
  const confirmed = await notificationService.confirm(
    'Restaurar Backup?',
    `Deseja restaurar o backup "${file.name}"? Isso substituirá seus dados atuais.`,
    'Sim, Restaurar',
    'warning'
  );

  if (!confirmed) return;

  isGoogleLoading.value = true;
  try {
    const data = await googleDriveService.downloadBackup(file.id);
    if (data) {
      const success = await backupService.applyBackupData(data, settings, taskStore);
      if (success) {
        showGoogleRestoreList.value = false;
        uiStore.showSettings = false;
      }
    }
  } catch (error) {
    console.error('Google Restore Failed:', error);
  } finally {
    isGoogleLoading.value = false;
  }
};

const handleGoogleDelete = async (file) => {
  const confirmed = await notificationService.confirm(
    'Excluir Backup?',
    `Tem certeza que deseja remover "${file.name}" permanentemente da nuvem?`,
    'Sim, Excluir',
    'error'
  );

  if (!confirmed) return;

  isGoogleLoading.value = true;
  try {
    const success = await googleDriveService.deleteBackup(file.id);
    if (success) {
      // Atualiza a lista local removendo o arquivo sem precisar recarregar tudo
      googleBackups.value = googleBackups.value.filter(b => b.id !== file.id);
    }
  } catch (error) {
    console.error('Google Delete Failed:', error);
  } finally {
    isGoogleLoading.value = false;
  }
};

const handleResetSystem = async () => {
  const confirmed = await notificationService.confirm(
    'Zerar Sistema?',
    'Isso apagará TODAS as tarefas e sprints permanentemente. Esta ação não pode ser desfeita!',
    'Sim, Apagar Tudo',
    'error'
  );

  if (confirmed) {
    const success = await taskStore.resetSystem();
    
    if (success) {
      notificationService.toast('Sistema resetado com sucesso!', 'success');
      emit('close');
    } else {
      notificationService.alert('Erro', 'Não foi possível resetar o sistema.', 'error');
    }
  }
};
</script>

<template>
  <BaseModal 
    :title="activeTabObj.label" 
    :subtitle="activeTabObj.desc"
    :icon="activeTabObj.icon"
    maxWidth="max-w-4xl" 
    customClass="h-[95vh] md:h-[600px] flex flex-col"
    layout="sidebar"
    @close="emit('close')"
  >
    <!-- Sidebar -->
    <template #sidebar>
      <nav ref="navRef" class="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-1 md:space-y-1 pb-2 md:pb-0 scroll-smooth">
        <template v-for="tab in tabs" :key="tab.id">
          <div v-if="tab.isAction" class="hidden md:block w-full h-px border-t border-app-border-light my-2"></div>
          <button 
            :data-tab-id="tab.id"
            @click="tab.isAction ? emit('open-interface') : activeTab = tab.id"
            class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all group"
            :class="activeTab === tab.id 
              ? 'bg-app-surface text-indigo-600 dark:text-indigo-400' 
              : (tab.isAction ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10' : 'text-app-sub hover:bg-app-surface')"
          >
            <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : (tab.isAction ? '' : 'text-slate-400')" />
            <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
          </button>
        </template>
      </nav>
      
      <div class="hidden md:block p-4 bg-indigo-500/5 rounded-2xl border border-app-border-light mt-auto">
        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
          Confirme as alterações no botão abaixo para persistir no banco de dados.
        </p>
      </div>
    </template>

    <!-- Conteúdo Principal -->
    <div 
      ref="swipeAreaRef" 
      class="h-full w-full flex-1 overflow-x-hidden touch-pan-y max-md:min-h-[80vh]" 
      :style="{
        touchAction: 'pan-y',
        transform: `translateX(${offsetX}px)`,
        transition: (isSwiping || jumpMode) ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }"
    >
      <transition :name="disableVueTransition ? '' : 'fade-slide'" :mode="disableVueTransition ? '' : 'out-in'">
              <div v-if="activeTab === 'git'" :key="'git'" class="space-y-8 w-full">
                <div class="glass-section p-6 space-y-6">
                  <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
                    <div class="flex items-center gap-3">
                      <div class="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                        <Globe class="w-5 h-5" />
                      </div>
                      <div>
                        <h3 class="text-sm font-black text-app-main uppercase tracking-tight">Provedor Git</h3>
                        <p class="text-[9px] text-app-muted font-bold uppercase tracking-widest">Escolha a plataforma</p>
                      </div>
                    </div>
                    <div class="flex bg-app-surface p-1 rounded-xl border border-app-border-light w-full md:w-auto overflow-x-auto">
                      <button @click="localSettings.gitProvider = 'gitlab'" class="flex-1 md:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all flex items-center justify-center gap-2" :class="localSettings.gitProvider === 'gitlab' ? 'bg-indigo-500 text-white shadow-md' : 'text-app-muted hover:text-indigo-500'"><Globe class="w-3 h-3" /> GitLab</button>
                      <button @click="localSettings.gitProvider = 'github'" class="flex-1 md:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all flex items-center justify-center gap-2" :class="localSettings.gitProvider === 'github' ? 'bg-indigo-500 text-white shadow-md' : 'text-app-muted hover:text-indigo-500'"><Github class="w-3 h-3" /> GitHub</button>
                    </div>
                  </div>

                  <!-- Configurações GitLab -->
                  <div v-if="localSettings.gitProvider === 'gitlab'" class="grid gap-6 pt-4 border-t border-app-border-light animate-fadeIn">
                    <div class="flex w-full mb-2">
                      <div class="flex bg-app-surface p-1 rounded-xl border border-app-border-light w-full">
                        <button @click="localSettings.gitlabIntegrationMode = 'link'" class="flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all" :class="localSettings.gitlabIntegrationMode === 'link' ? 'bg-indigo-500 text-white shadow' : 'text-app-muted'">Link Mágico</button>
                        <button @click="localSettings.gitlabIntegrationMode = 'api'" class="flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all" :class="localSettings.gitlabIntegrationMode === 'api' ? 'bg-indigo-500 text-white shadow' : 'text-app-muted'">API Automática</button>
                      </div>
                    </div>
                    <AppInput v-model="localSettings.gitlabUrl" type="url" label="URL da Instância GitLab" placeholder="https://gitlab.com" />
                    <template v-if="localSettings.gitlabIntegrationMode === 'api'">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AppInput v-model="localSettings.gitlabProjectId" label="ID do Projeto" placeholder="Ex: 1234" />
                      </div>
                      <AppInput v-model="localSettings.gitlabToken" type="password" label="Personal Access Token (PAT)" placeholder="glpat-..." help-text="O token é armazenado apenas localmente." />
                    </template>
                    <div v-else class="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                      <p class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed">No modo <b>Link Mágico</b>, o TASS apenas gerará URLs diretas para criação de branches. Nenhuma credencial de API é necessária.</p>
                    </div>

                    <div class="space-y-4 pt-4 mt-2 border-t border-app-border-light">
                      <h4 class="text-[10px] font-black uppercase text-app-main tracking-widest">Ambientes e Aliases</h4>
                      
                      <!-- Master -->
                      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-app-surface border border-app-border-light rounded-xl p-3 relative transition-all" :class="localSettings.gitlabBaseTarget === 'master' ? 'ring-2 ring-indigo-500/50' : ''">
                        <div class="grid grid-cols-2 gap-4 flex-1">
                          <AppInput v-model="localSettings.gitlabBranchMaster" label="Branch (Master)" placeholder="master" />
                          <AppInput v-model="localSettings.gitlabAliasMaster" label="Alias" placeholder="Produção" />
                        </div>
                        <div class="flex flex-row md:flex-col items-center justify-center shrink-0 w-full md:w-24 border-t md:border-t-0 md:border-l border-app-border-light pt-3 md:pt-0 md:pl-4">
                          <label class="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center cursor-pointer md:mb-2 flex flex-row md:flex-col items-center gap-2 md:gap-1 hover:text-indigo-500">
                            Branch Base
                            <input type="radio" v-model="localSettings.gitlabBaseTarget" value="master" class="w-4 h-4 text-indigo-500 accent-indigo-500 cursor-pointer" />
                          </label>
                        </div>
                      </div>
                      
                      <!-- HML -->
                      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-app-surface border border-app-border-light rounded-xl p-3 relative transition-all" :class="localSettings.gitlabBaseTarget === 'hml' ? 'ring-2 ring-indigo-500/50' : ''">
                        <div class="grid grid-cols-2 gap-4 flex-1">
                          <AppInput v-model="localSettings.gitlabBranchHml" label="Branch (Hml)" placeholder="hml" />
                          <AppInput v-model="localSettings.gitlabAliasHml" label="Alias" placeholder="Homologação" />
                        </div>
                        <div class="flex flex-row md:flex-col items-center justify-center shrink-0 w-full md:w-24 border-t md:border-t-0 md:border-l border-app-border-light pt-3 md:pt-0 md:pl-4">
                          <label class="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center cursor-pointer md:mb-2 flex flex-row md:flex-col items-center gap-2 md:gap-1 hover:text-indigo-500">
                            Branch Base
                            <input type="radio" v-model="localSettings.gitlabBaseTarget" value="hml" class="w-4 h-4 text-indigo-500 accent-indigo-500 cursor-pointer" />
                          </label>
                        </div>
                      </div>

                      <!-- DEV -->
                      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-app-surface border border-app-border-light rounded-xl p-3 relative transition-all" :class="localSettings.gitlabBaseTarget === 'dev' ? 'ring-2 ring-indigo-500/50' : ''">
                        <div class="grid grid-cols-2 gap-4 flex-1">
                          <AppInput v-model="localSettings.gitlabBranchDev" label="Branch (Dev)" placeholder="dev" />
                          <AppInput v-model="localSettings.gitlabAliasDev" label="Alias" placeholder="Desenvolvimento" />
                        </div>
                        <div class="flex flex-row md:flex-col items-center justify-center shrink-0 w-full md:w-24 border-t md:border-t-0 md:border-l border-app-border-light pt-3 md:pt-0 md:pl-4">
                          <label class="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center cursor-pointer md:mb-2 flex flex-row md:flex-col items-center gap-2 md:gap-1 hover:text-indigo-500">
                            Branch Base
                            <input type="radio" v-model="localSettings.gitlabBaseTarget" value="dev" class="w-4 h-4 text-indigo-500 accent-indigo-500 cursor-pointer" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Configurações GitHub -->
                  <div v-else-if="localSettings.gitProvider === 'github'" class="grid gap-6 pt-4 border-t border-app-border-light animate-fadeIn">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AppInput v-model="localSettings.githubOwner" label="Dono do Repositório (Owner)" placeholder="Ex: ssergio100" />
                      <AppSelect
                        v-model="localSettings.githubRepo"
                        label="Nome do Repositório"
                        placeholder="Selecione o repositório..."
                        searchable
                        search-placeholder="Buscar repositório..."
                        :options="githubRepos"
                        :loading="githubReposLoading"
                        :empty-message="githubReposError || 'Nenhum repositório encontrado para este dono.'"
                        @open="loadGithubRepos()"
                      />
                    </div>
                    <AppInput v-model="localSettings.githubToken" type="password" label="Personal Access Token (Classic ou Fine-grained)" placeholder="ghp_..." help-text="Precisa das permissões de leitura/escrita em Pull Requests e Conteúdo (repo)." />
                    
                    <div class="space-y-4 pt-4 mt-2 border-t border-app-border-light">
                      <h4 class="text-[10px] font-black uppercase text-app-main tracking-widest">Ambientes e Aliases</h4>
                      
                      <!-- Master -->
                      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-app-surface border border-app-border-light rounded-xl p-3 relative transition-all" :class="localSettings.githubBaseTarget === 'master' ? 'ring-2 ring-indigo-500/50' : ''">
                        <div class="grid grid-cols-2 gap-4 flex-1">
                          <AppInput v-model="localSettings.githubBranchMaster" label="Branch (Master)" placeholder="main" />
                          <AppInput v-model="localSettings.githubAliasMaster" label="Alias" placeholder="Master" />
                        </div>
                        <div class="flex flex-row md:flex-col items-center justify-center shrink-0 w-full md:w-24 border-t md:border-t-0 md:border-l border-app-border-light pt-3 md:pt-0 md:pl-4">
                          <label class="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center cursor-pointer md:mb-2 flex flex-row md:flex-col items-center gap-2 md:gap-1 hover:text-indigo-500">
                            Branch Base
                            <input type="radio" v-model="localSettings.githubBaseTarget" value="master" class="w-4 h-4 text-indigo-500 accent-indigo-500 cursor-pointer" />
                          </label>
                        </div>
                      </div>
                      
                      <!-- HML -->
                      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-app-surface border border-app-border-light rounded-xl p-3 relative transition-all" :class="localSettings.githubBaseTarget === 'hml' ? 'ring-2 ring-indigo-500/50' : ''">
                        <div class="grid grid-cols-2 gap-4 flex-1">
                          <AppInput v-model="localSettings.githubBranchHml" label="Branch (Hml)" placeholder="hml" />
                          <AppInput v-model="localSettings.githubAliasHml" label="Alias" placeholder="Homologação" />
                        </div>
                        <div class="flex flex-row md:flex-col items-center justify-center shrink-0 w-full md:w-24 border-t md:border-t-0 md:border-l border-app-border-light pt-3 md:pt-0 md:pl-4">
                          <label class="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center cursor-pointer md:mb-2 flex flex-row md:flex-col items-center gap-2 md:gap-1 hover:text-indigo-500">
                            Branch Base
                            <input type="radio" v-model="localSettings.githubBaseTarget" value="hml" class="w-4 h-4 text-indigo-500 accent-indigo-500 cursor-pointer" />
                          </label>
                        </div>
                      </div>

                      <!-- DEV -->
                      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-app-surface border border-app-border-light rounded-xl p-3 relative transition-all" :class="localSettings.githubBaseTarget === 'dev' ? 'ring-2 ring-indigo-500/50' : ''">
                        <div class="grid grid-cols-2 gap-4 flex-1">
                          <AppInput v-model="localSettings.githubBranchDev" label="Branch (Dev)" placeholder="dev" />
                          <AppInput v-model="localSettings.githubAliasDev" label="Alias" placeholder="Desenvolvimento" />
                        </div>
                        <div class="flex flex-row md:flex-col items-center justify-center shrink-0 w-full md:w-24 border-t md:border-t-0 md:border-l border-app-border-light pt-3 md:pt-0 md:pl-4">
                          <label class="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center cursor-pointer md:mb-2 flex flex-row md:flex-col items-center gap-2 md:gap-1 hover:text-indigo-500">
                            Branch Base
                            <input type="radio" v-model="localSettings.githubBaseTarget" value="dev" class="w-4 h-4 text-indigo-500 accent-indigo-500 cursor-pointer" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="pt-6 mt-4 border-t border-app-border-light flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <button @click="testGitConnection" class="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-app-border-light shadow-sm w-full sm:w-auto">
                      <RefreshCw class="w-4 h-4" :class="{'animate-spin': testGitStatus === 'checking'}" />
                      Testar Conexão Remota
                    </button>
                    <div v-if="testGitStatus" class="flex items-center gap-2 flex-1 w-full p-2 rounded-lg" :class="{
                      'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400': testGitStatus === 'checking',
                      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400': testGitStatus === 'success',
                      'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400': testGitStatus === 'error',
                      'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400': testGitStatus === 'warning'
                    }">
                      <Loader2 v-if="testGitStatus === 'checking'" class="w-4 h-4 animate-spin shrink-0" />
                      <CheckCircle2 v-else-if="testGitStatus === 'success'" class="w-4 h-4 shrink-0" />
                      <AlertTriangle v-else class="w-4 h-4 shrink-0" />
                      <span class="text-[10px] font-bold line-clamp-2 leading-tight">{{ testGitMessage }}</span>
                    </div>
                  </div>
                </div>
              </div>



              <div v-else-if="activeTab === 'work'" :key="'work'" class="space-y-8">
                <div class="glass-section p-6 space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div class="input-group">
                      <label class="!text-amber-600 dark:!text-amber-400">Início</label>
                      <VueDatePicker v-model="localSettings.workStart" time-picker auto-apply :dark="settings.theme === 'dark'" class="app-timepicker" input-class-name="app-input px-4 py-3 shadow-sm transition-all w-full text-center font-bold" teleport="body" :format-locale="ptBR" :locale="ptBR" format="HH:mm">
                        <template #input-icon><Clock class="w-4 h-4 ml-2 text-amber-500" /></template>
                      </VueDatePicker>
                    </div>
                    <div class="input-group">
                      <label class="!text-amber-600 dark:!text-amber-400">Término</label>
                      <VueDatePicker v-model="localSettings.workEnd" time-picker auto-apply :dark="settings.theme === 'dark'" class="app-timepicker" input-class-name="app-input px-4 py-3 shadow-sm transition-all w-full text-center font-bold" teleport="body" :format-locale="ptBR" :locale="ptBR" format="HH:mm">
                        <template #input-icon><Clock class="w-4 h-4 ml-2 text-amber-500" /></template>
                      </VueDatePicker>
                    </div>
                  </div>
                  <div class="space-y-3">
                    <label class="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dias Ativos</label>
                    <div class="grid grid-cols-7 gap-1.5 justify-center max-w-sm mx-auto">
                      <button v-for="day in dayNames" :key="day.id" @click="toggleDay(day.id)"
                        class="w-full aspect-square md:w-10 md:h-10 text-xs font-black transition-all border rounded-xl"
                        :class="localSettings.workDays.includes(day.id) ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-400'">
                        {{ day.label }}
                      </button>
                    </div>
                  </div>
                  <label class="flex items-center justify-between p-4 bg-app-solid rounded-2xl cursor-pointer border border-amber-500/10">
                    <div>
                      <p class="text-sm font-bold text-app-main">Pausa Automática</p>
                      <p class="text-[10px] text-app-sub">Pausar tarefas ao atingir o horário de término.</p>
                    </div>
                    <div class="relative inline-flex items-center">
                      <input type="checkbox" class="sr-only peer" v-model="localSettings.autoPauseOutsideWork">
                      <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div v-else-if="activeTab === 'health'" :key="'health'" class="space-y-8">
                <div class="glass-section p-6 space-y-6">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20"><Activity class="w-6 h-6" /></div>
                      <div>
                        <p class="text-sm font-bold text-app-main">Sussurro de Bem-estar</p>
                        <p class="text-[10px] text-app-sub">Lembretes suaves de postura, olhos e pausas.</p>
                      </div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer" v-model="localSettings.wellnessEnabled">
                      <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
                    </label>
                  </div>
                  <div v-if="localSettings.wellnessEnabled" class="space-y-4 pt-4 border-t border-emerald-500/10">
                    <div class="flex justify-between">
                      <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Frequência</span>
                      <span class="text-sm font-black text-slate-700 dark:text-slate-200">{{ localSettings.wellnessInterval }} min</span>
                    </div>
                    <input type="range" v-model.number="localSettings.wellnessInterval" min="5" max="120" step="5" class="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none" />
                    <button @click="emit('test-wellness')" class="flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:underline"><Sparkles class="w-3 h-3" /> Testar Sussurro Agora</button>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'system'" :key="'system'" class="space-y-8">
                <div class="space-y-4">
                  <div class="glass-section p-6 space-y-6">
                    <div class="flex items-center gap-3">
                      <MousePointer2 class="w-5 h-5 text-indigo-500" />
                      <h3 class="text-sm font-bold text-app-main uppercase tracking-tight">Menu de Contexto</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-12">
                      <div class="space-y-4">
                        <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Estilo Visual</p>
                        <div class="flex flex-col gap-3">
                          <AppRadio
                            v-model="localSettings.contextMenuStyle"
                            value="floating"
                            label="Flutuante (OS)"
                          />
                          <AppRadio
                            v-model="localSettings.contextMenuStyle"
                            value="dock"
                            label="Dock Fixo"
                          />
                        </div>
                      </div>

                      <div class="space-y-4" :class="{ 'opacity-40 pointer-events-none': localSettings.contextMenuStyle !== 'dock' }">
                        <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Comportamento da Dock</p>
                        <div class="flex flex-col gap-3">
                          <AppRadio
                            v-model="localSettings.contextMenuMode"
                            value="stack"
                            label="Empilhar Acima"
                          />
                          <AppRadio
                            v-model="localSettings.contextMenuMode"
                            value="replace"
                            label="Substituir"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="glass-section p-4 space-y-4">
                    <div><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Painel de Notas Rápidas</p><p class="text-[10px] text-slate-500">Escolha de qual lado da tela o terminal de notas deve deslizar.</p></div>
                    <div class="flex bg-slate-200 dark:bg-white/5 p-1 rounded-xl w-full">
                      <button @click="localSettings.notesSide = 'left'" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all" :class="localSettings.notesSide === 'left' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">Lado Esquerdo</button>
                      <button @click="localSettings.notesSide = 'right'" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all" :class="localSettings.notesSide === 'right' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">Lado Direito</button>
                    </div>
                  </div>

                  <div class="glass-section p-4 space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Monitor de Inatividade</p><p class="text-[10px] text-slate-500">Pausar tarefa automaticamente após tempo de ócio.</p></div>
                      <div class="relative inline-flex items-center"><input type="checkbox" class="sr-only peer" v-model="localSettings.trackInactivity"><div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div></div>
                    </label>
                    <div v-if="localSettings.trackInactivity" class="pt-4 border-t border-app-border-light animate-fadeIn">
                      <div class="flex items-center justify-between gap-4">
                        <div class="flex-1"><p class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 ml-1">Tempo de Espera (HH:mm)</p><VueDatePicker v-model="localSettings.inactivityThreshold" time-picker auto-apply :dark="settings.theme === 'dark'" class="app-timepicker" input-class-name="app-input px-4 py-3 shadow-sm transition-all w-full text-center font-bold" teleport="body" :format-locale="ptBR" :locale="ptBR" format="HH:mm"><template #input-icon><Clock class="w-4 h-4 ml-2 text-slate-400" /></template></VueDatePicker></div>
                        <div class="text-right"><p class="text-[10px] text-slate-500 font-bold uppercase">Total</p><p class="text-lg font-black text-indigo-600 dark:text-indigo-400">{{ (localSettings.inactivityThreshold.hours * 60) + localSettings.inactivityThreshold.minutes }} min</p></div>
                      </div>
                    </div>
                  </div>

                  <div class="glass-section p-4 space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Ocultar Guia Inicial</p><p class="text-[10px] text-slate-500">Não exibir o modal de atalhos e dicas ao carregar o sistema.</p></div>
                      <div class="relative inline-flex items-center"><input type="checkbox" class="sr-only peer" v-model="localSettings.hideWelcomeModal"><div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div></div>
                    </label>
                  </div>

                  <div class="glass-section p-4 space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Realce de Contraste</p><p class="text-[10px] text-slate-500">Otimiza a legibilidade do texto em interfaces transparentes.</p></div>
                      <div class="relative inline-flex items-center"><input type="checkbox" class="sr-only peer" v-model="localSettings.contrastEnhanced"><div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div></div>
                    </label>
                  </div>

                  <div class="glass-section p-4 space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Esmaecer Papel de Parede</p><p class="text-[10px] text-slate-500">Escurece o fundo automaticamente no modo escuro para maior foco.</p></div>
                      <div class="relative inline-flex items-center"><input type="checkbox" class="sr-only peer" v-model="localSettings.darkenWallpaper"><div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div></div>
                    </label>
                  </div>

                  <div class="glass-section p-4 space-y-4">
                    <label class="flex items-center justify-between cursor-pointer">
                      <div class="flex-1 pr-4"><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Manter o estado das janelas</p><p class="text-[10px] text-slate-500 leading-relaxed">Memoriza a última aba aberta nas configurações e ajustes gráficos. <span class="text-indigo-500 font-bold block mt-1 italic">* Esta preferência é salva apenas no seu navegador (Local Storage).</span></p></div>
                      <div class="relative inline-flex items-center shrink-0"><input type="checkbox" class="sr-only peer" v-model="settings.keepWindowState"><div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div></div>
                    </label>
                  </div>
                </div>
              </div>

              <div v-else-if="activeTab === 'security'" :key="'security'" class="space-y-6">
                <div class="glass-section p-6 space-y-4 border border-indigo-500/20 relative overflow-hidden" :class="isGoogleAuthenticated ? 'bg-indigo-500/5' : 'bg-slate-500/5'">
                  <div class="absolute -top-6 -right-6 opacity-[0.03] pointer-events-none"><Cloud class="w-40 h-40" /></div>
                  <div class="flex items-center justify-between relative z-10">
                    <div class="flex items-center gap-3">
                      <div v-if="isGoogleAuthenticated && googleUser" class="relative group/avatar"><img :src="googleUser.picture" class="w-10 h-10 rounded-full border-2 border-indigo-500/30 shadow-md group-hover/avatar:scale-105 transition-transform" /><div class="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"><Cloud class="w-2.5 h-2.5 text-white" /></div></div>
                      <Cloud v-else class="w-5 h-5" :class="isGoogleAuthenticated ? 'text-indigo-500' : 'text-slate-400'" />
                      <div><h4 class="text-sm font-black uppercase tracking-tight" :class="isGoogleAuthenticated ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">{{ (isGoogleAuthenticated && googleUser) ? googleUser.name : 'Google Drive Cloud' }}</h4><p class="text-[9px] font-bold" :class="isGoogleAuthenticated ? 'text-emerald-500' : 'text-slate-400'">{{ isGoogleAuthenticated ? 'Conectado' : 'Desconectado' }}</p></div>
                    </div>
                    <div v-if="isGoogleLoading" class="animate-spin text-indigo-500"><Loader2 class="w-4 h-4" /></div>
                  </div>
                  <p class="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4 relative z-10">Sincronize seu sistema com a nuvem. Os backups são salvos em <b>"TASS Backups"</b> e ordenados por data.</p>
                  <div v-if="!isGoogleAuthenticated" class="relative z-10"><button @click="handleGoogleLogin" class="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"><LogIn class="w-4 h-4" /> Conectar Google Drive</button></div>
                  <div v-else class="space-y-4 relative z-10">
                    <div v-if="!showGoogleRestoreList" class="flex flex-col sm:flex-row gap-3"><button @click="handleGoogleBackup" :disabled="isGoogleLoading" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"><Upload class="w-4 h-4" /> Criar Novo Backup</button><button @click="handleLoadGoogleBackups" :disabled="isGoogleLoading" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"><Download class="w-4 h-4" /> Ver Backups</button></div>
                    <div v-else class="space-y-3 animate-fadeIn">
                      <div class="flex items-center justify-between mb-2"><p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Escolha um ponto para restaurar</p><button @click="showGoogleRestoreList = false" class="text-[10px] font-bold text-slate-400 hover:text-indigo-500">Voltar</button></div>
                      <div v-if="googleBackups.length === 0" class="py-10 text-center border-2 border-dashed border-app-border-light rounded-2xl px-6"><Cloud class="w-8 h-8 text-slate-300 mx-auto mb-2" /><p class="text-[11px] font-bold text-app-muted uppercase tracking-widest">Nenhum backup encontrado.</p><p class="text-[9px] text-slate-400 mt-1 italic">Verifique a pasta <span class="text-indigo-500 font-bold uppercase">TASS</span> no seu Google Drive.</p></div>
                      <div v-else class="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar"><div v-for="(file, index) in googleBackups" :key="file.id" class="flex items-center p-3 bg-white dark:bg-white/5 border border-app-border-light rounded-xl transition-all group hover:bg-indigo-500/5"><div class="flex-1 text-left cursor-pointer" @click="handleRestoreFromGoogle(file)"><div class="flex items-center gap-2"><p class="text-[11px] font-bold text-app-main group-hover:text-indigo-500">{{ index === 0 ? 'Último Backup' : 'Backup Anterior' }}</p><span v-if="index === 0" class="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded">Mais Recente</span></div><p class="text-[9px] text-app-muted">{{ new Date(file.createdTime).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) }}</p></div><div class="flex items-center gap-2"><button @click="handleRestoreFromGoogle(file)" title="Restaurar este backup" class="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"><Download class="w-3.5 h-3.5" /></button><button @click="handleGoogleDelete(file)" title="Excluir da nuvem" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 class="w-3.5 h-3.5" /></button></div></div></div>
                    </div>
                    <button @click="handleGoogleLogout" class="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"><LogOut class="w-3 h-3" /> Desconectar conta</button>
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="glass-section p-6 space-y-4 relative overflow-hidden"><div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Server class="w-16 h-16" /></div><div class="flex items-center gap-3 mb-2 relative z-10"><ShieldCheck class="w-5 h-5 text-emerald-500" /><h4 class="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Sistema Completo</h4></div><p class="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4 relative z-10">Exporta <b>absolutamente tudo</b>: tarefas, sprints, notas rápidas e todas as configurações de interface.</p><div class="flex flex-row gap-3 relative z-10"><button @click="handleExportSystem" class="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"><Download class="w-4 h-4" /> Exportar</button><label class="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"><Upload class="w-4 h-4" /> Restaurar<input type="file" accept=".json" class="hidden" @change="handleImportSystem" /></label></div></div>
                  <div class="glass-section p-6 space-y-4 relative overflow-hidden flex-1"><div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><FileJson class="w-16 h-16" /></div><div class="flex items-center gap-3 mb-2 relative z-10"><FileJson class="w-5 h-5 text-indigo-500" /><h4 class="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Apenas Tarefas</h4></div><p class="text-[10px] text-slate-500 leading-relaxed mb-4 relative z-10">Lista de tarefas atual. Ideal para transferências rápidas ou backups frequentes.</p><div class="flex flex-row gap-3 relative z-10"><button @click="handleExportTasks" class="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-white/5 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-app-border-light"><Download class="w-4 h-4" /> Exportar</button><label class="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-app-border-light cursor-pointer text-center"><Upload class="w-4 h-4" /> Importar<input type="file" accept=".json" class="hidden" @change="handleImportTasks" /></label></div></div>
                </div>
                <div class="glass-section p-6 bg-red-500/5 dark:bg-red-500/10 border-red-500/20 space-y-4"><div class="flex items-center gap-3 mb-2"><Activity class="w-5 h-5 text-red-500" /><h4 class="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Zona de Perigo</h4></div><p class="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">Deseja limpar tudo e começar do zero? Esta ação removerá todas as tarefas e sprints do seu banco de dados local.</p><button @click="handleResetSystem" class="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95">Zerar Banco de Dados</button></div>
              </div>
              
              <div v-else-if="activeTab === 'shortcuts'" :key="'shortcuts'" class="space-y-6">
                <div class="glass-section p-6 space-y-6">
                  <div class="flex items-center gap-4 mb-2">
                    <div class="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                      <Keyboard class="w-6 h-6" />
                    </div>
                    <div>
                      <h3 class="text-sm font-black text-app-main uppercase tracking-tight">Atalhos de Teclado</h3>
                      <p class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Ações rápidas para o seu fluxo</p>
                    </div>
                  </div>

                  <div class="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-4 space-y-2">
                    <div class="flex items-center gap-3">
                      <MousePointer2 class="w-4 h-4 text-amber-500" />
                      <p class="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                        <span class="uppercase">Importante:</span> Para os atalhos de tarefa funcionarem, o cursor do mouse deve estar <span class="underline underline-offset-2">posicionado sobre a tarefa</span> desejada.
                      </p>
                    </div>
                    <div class="flex items-center gap-3 pt-2 border-t border-amber-500/10">
                      <Info class="w-4 h-4 text-amber-500 shrink-0" />
                      <p class="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                        <span class="uppercase">Aviso Mobile:</span> Atalhos de teclado e ações de mouse hover **não estão disponíveis** no modo móvel.
                      </p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Coluna 1: Ações de Tarefa -->
                    <div class="space-y-3">
                      <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gestão de Tarefas</h4>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Editar Tarefa</span>
                          <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500 shadow-sm">E</kbd>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Concluir / Reabrir</span>
                          <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500 shadow-sm">F</kbd>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Clonar Tarefa</span>
                          <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500 shadow-sm">C</kbd>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Zerar Cronômetro</span>
                          <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500 shadow-sm">Z</kbd>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub text-rose-500">Excluir Permanente</span>
                          <kbd class="px-2 py-1 bg-rose-500 text-white rounded-lg text-[12px] font-black shadow-sm">D</kbd>
                        </div>
                      </div>
                    </div>

                    <!-- Coluna 2: Interface e Dados -->
                    <div class="space-y-3">
                      <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Estilo e Dados</h4>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Seletor de Presets</span>
                          <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500 shadow-sm">P</kbd>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Anexar em Observações</span>
                          <div class="flex gap-1">
                            <kbd class="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 border border-app-border-light rounded-lg text-[10px] font-black text-slate-500">CTRL</kbd>
                            <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500">V</kbd>
                          </div>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Anexar Scripts SQL</span>
                          <div class="flex gap-1">
                            <kbd class="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 border border-app-border-light rounded-lg text-[10px] font-black text-slate-500">CTRL</kbd>
                            <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500">B</kbd>
                          </div>
                        </div>
                        <hr class="border-app-border-light my-2" />
                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 pt-1">Global</h4>
                        <div class="flex items-center justify-between p-3 bg-app-surface border border-app-border-light rounded-xl group hover:border-indigo-500/30 transition-all">
                          <span class="text-xs font-bold text-app-sub">Terminal de Notas</span>
                          <kbd class="px-2 py-1 bg-white dark:bg-slate-800 border border-app-border-light rounded-lg text-[12px] font-black text-indigo-500 shadow-sm">T</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else-if="activeTab === 'about'" :key="'about'" class="space-y-8">
                <div class="glass-section p-8 space-y-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
                  <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Code2 class="w-32 h-32 text-indigo-500" />
                  </div>
                  
                  <div class="relative z-10 space-y-4">
                    <h1 class="text-4xl leading-none bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] bg-clip-text text-transparent pb-2" style="font-family: 'Satisfy', cursive;">
                      Tass
                    </h1>
                    <p class="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Task & Agile System Setup</p>
                    <div class="flex items-center justify-center gap-2 mt-2">
                      <span class="px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Versão 1.0.0</span>
                    </div>
                  </div>

                  <div class="relative z-10 max-w-md mx-auto space-y-6 pt-6 border-t border-app-border-light">
                    <div class="space-y-2">
                      <p class="text-sm font-bold text-slate-600 dark:text-slate-300">Desenvolvido por</p>
                      <p class="text-lg font-black text-indigo-600 dark:text-indigo-400">Sérgio Moreira</p>
                    </div>

                    <div class="flex flex-row flex-wrap gap-3 justify-center pt-4">
                      <a href="https://github.com/ssergio100/TASS" target="_blank" rel="noopener noreferrer" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-app-border-light shadow-sm text-center whitespace-nowrap">
                        <Github class="w-4 h-4" />
                        GitHub
                      </a>
                      
                      <button @click="showPix = true" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 text-center whitespace-nowrap">
                        <Coffee class="w-4 h-4" />
                        Buy me a coffee
                      </button>

                      <a href="https://wa.me/5511991386328?text=Olá!%20Gostaria%20de%20falar%20com%20você%20sobre%20o%20projeto%20TASS." target="_blank" rel="noopener noreferrer" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/20 shadow-sm text-center whitespace-nowrap">
                        <MessageCircle class="w-4 h-4" />
                        WhatsApp
                      </a>
                    </div>


                  </div>
                  
                  <div class="relative z-10 pt-8 mt-4 border-t border-app-border-light w-full">
                    <p class="text-[10px] text-slate-500 leading-relaxed font-medium">
                      O TASS é um sistema open-source de gestão de tarefas e produtividade.<br>
                      De desenvolvedor para desenvolvedor. Para ajudar e não microgerenciar.<br>
                      Distribuído sob a licença MIT. Copyright &copy; 2026.
                    </p>
                    <div class="flex justify-center gap-4 mt-3">
                      <router-link to="/privacy" @click="uiStore.showSettings = false" class="text-[10px] text-indigo-500 hover:underline font-bold transition-colors">Política de Privacidade</router-link>
                      <router-link to="/terms" @click="uiStore.showSettings = false" class="text-[10px] text-indigo-500 hover:underline font-bold transition-colors">Termos de Uso</router-link>
                    </div>
                  </div>
                </div>
              </div>
      </transition>
    </div>

    <template #footer>
      <button type="button" @click="uiStore.showSettings = false" class="btn btn-secondary px-6 py-2 border-none shadow-none text-xs">Fechar</button>
      <button type="button" @click="handleSave" class="btn btn-primary px-8 py-2 border-none shadow-none text-xs font-black uppercase tracking-widest">Salvar</button>
    </template>
  </BaseModal>

  <teleport to="body">
    <BaseModal 
      v-if="showPix"
      title="Apoiar o Projeto"
      subtitle="Escaneie o QR Code ou copie a chave PIX"
      :icon="Coffee"
      iconBgColor="#f59e0b"
      maxWidth="max-w-md"
      :showClose="true"
      @close="showPix = false"
    >
      <div class="flex flex-col items-center gap-4 py-2">
        <div class="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <QrcodeVue :value="pixKey" :size="180" level="M" />
        </div>
        <div class="text-center w-full mt-2">
          <p class="text-[11px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 px-4 py-3 rounded-xl select-all break-all">{{ pixKey }}</p>
        </div>
        <button @click="copyPixKey" class="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 w-full mt-2">
          <Copy class="w-4 h-4" />
          Copiar Chave PIX
        </button>
      </div>
    </BaseModal>
  </teleport>
</template>

<style scoped>
.app-timepicker {
  --dp-border-radius: 12px;
}
</style>

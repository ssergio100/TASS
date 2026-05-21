<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { 
  Download, Upload, Globe, Palette, Cloud, Loader2, LogOut, LogIn, Trash2,
  ShieldCheck, Monitor, Briefcase, Activity, FileJson, Server, Clock, X, Sparkles, Bug, MousePointer2, Layout, Layers, Maximize,
  User, KeyRound, Copy, CheckCircle2
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';
import { googleDriveService } from '../services/googleDriveService';
import { backupService } from '../services/backupService';
import { db } from '../db.js';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import BaseModal from './BaseModal.vue';
import { useTaskStore } from '../stores/taskStore';
import { ptBR } from 'date-fns/locale';
import '@vuepic/vue-datepicker/dist/main.css';
import AppInput from './base/AppInput.vue';
import AppSelect from './base/AppSelect.vue';
import AppRadio from './base/AppRadio.vue';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const emit = defineEmits(['close', 'save', 'export-tasks', 'import-tasks', 'export-system', 'import-system', 'test-wellness', 'open-interface', 'test-modal']);

const props = defineProps({
  initialTab: {
    type: String,
    default: null
  }
});

const activeTab = ref(props.initialTab || 'gitlab');
const isGoogleLoading = ref(false);
const isGoogleAuthenticated = ref(googleDriveService.isAuthenticated());
const googleUser = ref(null);
const googleBackups = ref([]);
const showGoogleRestoreList = ref(false);

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

watch(activeTab, (newVal) => {
  if (settings.keepWindowState) {
    localStorage.setItem('app-last-settings-tab', newVal);
  }
});

const tabs = [
  { id: 'gitlab', label: 'Integração GitLab', icon: Globe, color: 'text-indigo-500', desc: 'Conecte ao GitLab e automatize seu workflow.' },
  { id: 'work', label: 'Jornada de Trabalho', icon: Briefcase, color: 'text-indigo-500', desc: 'Defina seu horário e dias de trabalho.' },
  { id: 'health', label: 'Saúde e Bem-estar', icon: Activity, color: 'text-indigo-500', desc: 'Lembretes inteligentes para manter sua saúde.' },
  { id: 'system', label: 'Sistema e Interface', icon: Monitor, color: 'text-indigo-500', desc: 'Configurações globais de comportamento.' },
  { id: 'security', label: 'Dados e Segurança', icon: ShieldCheck, color: 'text-indigo-500', desc: 'Gerencie backups e o banco de dados local.' },
  { id: 'account', label: 'Minha Conta', icon: User, color: 'text-indigo-500', desc: 'Gerencie sua sessão e dados de acesso.' }
];

const activeTabObj = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);

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
  gitlabUrl: settings.gitlabUrl,
  gitlabIntegrationMode: settings.gitlabIntegrationMode,
  gitlabProjectId: settings.gitlabProjectId,
  gitlabToken: settings.gitlabToken,
  gitlabBaseBranch: settings.gitlabBaseBranch,
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
  contextMenuMode: settings.contextMenuMode
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

const handleSave = async () => {
  settings.gitlabUrl = localSettings.value.gitlabUrl;
  settings.gitlabIntegrationMode = localSettings.value.gitlabIntegrationMode;
  settings.gitlabProjectId = localSettings.value.gitlabProjectId;
  settings.gitlabToken = localSettings.value.gitlabToken;
  settings.gitlabBaseBranch = localSettings.value.gitlabBaseBranch;
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

  await settings.saveAllSettings();
  notificationService.toast('Configurações Salvas!');
  emit('save');
};

const handleImportTasks = (event) => emit('import-tasks', event);
const handleImportSystem = (event) => emit('import-system', event);

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
        emit('close');
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

const authStore = useAuthStore();

const handleLogout = async () => {
  const confirmed = await notificationService.confirm(
    'Sair do TASS?',
    'Tem certeza que deseja sair da sua conta?',
    'Sair',
    'warning'
  );
  if (confirmed) {
    authStore.logout();
    emit('close');
  }
};
</script>

<template>
  <BaseModal 
    :title="activeTabObj.label" 
    :subtitle="activeTabObj.desc"
    :icon="activeTabObj.icon"
    maxWidth="max-w-4xl" 
    customClass="h-[90vh] md:h-[600px]"
    layout="sidebar"
    @close="emit('close')"
  >
    <!-- Sidebar -->
    <template #sidebar>
      <nav class="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-1 md:space-y-1 pb-2 md:pb-0">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all group"
          :class="activeTab === tab.id 
            ? 'bg-app-surface text-indigo-600 dark:text-indigo-400' 
            : 'text-app-sub hover:bg-app-surface'"
        >
          <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : 'text-slate-400'" />
          <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
        </button>

        <div class="hidden md:block w-full h-px border-t border-app-border-light my-2"></div>

        <button 
          @click="emit('open-interface')"
          class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
        >
          <Palette class="w-4 h-4" />
          <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">Ajustes Visuais</span>
        </button>
      </nav>
      
      <div class="hidden md:block p-4 bg-indigo-500/5 rounded-2xl border border-app-border-light mt-auto">
        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
          Confirme as alterações no botão abaixo para persistir no banco de dados.
        </p>
      </div>
    </template>

    <!-- Conteúdo Principal -->
    <transition name="fade-slide" mode="out-in">
                <div v-if="activeTab === 'gitlab'" :key="'gitlab'" class="space-y-8">
                <div class="glass-section p-6 space-y-6">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                      <div class="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                        <Globe class="w-5 h-5" />
                      </div>
                      <div>
                        <h3 class="text-sm font-black text-app-main uppercase tracking-tight">Configuração de Instância</h3>
                        <p class="text-[9px] text-app-muted font-bold uppercase tracking-widest">Modo: {{ localSettings.gitlabIntegrationMode === 'link' ? 'Manual' : 'Automatizado' }}</p>
                      </div>
                    </div>
                    <div class="flex bg-app-surface p-1 rounded-xl border border-app-border-light">
                      <button @click="localSettings.gitlabIntegrationMode = 'link'" class="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all" :class="localSettings.gitlabIntegrationMode === 'link' ? 'bg-indigo-500 text-white shadow-md' : 'text-app-muted hover:text-indigo-500'">Link Mágico</button>
                      <button @click="localSettings.gitlabIntegrationMode = 'api'" class="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all" :class="localSettings.gitlabIntegrationMode === 'api' ? 'bg-indigo-500 text-white shadow-md' : 'text-app-muted hover:text-indigo-500'">API Automática</button>
                    </div>
                  </div>

                  <div class="grid gap-6 pt-4 border-t border-app-border-light">
                    <AppInput v-model="localSettings.gitlabUrl" type="url" label="URL da Instância GitLab" placeholder="https://gitlab.com" />
                    <template v-if="localSettings.gitlabIntegrationMode === 'api'">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AppInput v-model="localSettings.gitlabProjectId" label="ID do Projeto" placeholder="Ex: 1234" />
                        <AppInput v-model="localSettings.gitlabBaseBranch" label="Branch Base" placeholder="develop" />
                      </div>
                      <AppInput v-model="localSettings.gitlabToken" type="password" label="Personal Access Token (PAT)" placeholder="glpat-..." help-text="O token é armazenado apenas localmente no seu navegador." />
                    </template>
                    <div v-else class="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                      <p class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium leading-relaxed">
                        No modo <b>Link Mágico</b>, o TASS apenas gerará URLs diretas para criação de branches. Nenhuma credencial de API é necessária.
                      </p>
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
                    <div class="flex flex-wrap gap-2 justify-center">
                      <button v-for="day in dayNames" :key="day.id" @click="toggleDay(day.id)"
                        class="w-10 h-10 text-xs font-black transition-all border"
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
                    <div class="flex bg-slate-200 dark:bg-white/5 p-1 rounded-xl w-fit">
                      <button @click="localSettings.notesSide = 'left'" class="px-6 py-1.5 text-xs font-bold rounded-lg transition-all" :class="localSettings.notesSide === 'left' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">Lado Esquerdo</button>
                      <button @click="localSettings.notesSide = 'right'" class="px-6 py-1.5 text-xs font-bold rounded-lg transition-all" :class="localSettings.notesSide === 'right' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">Lado Direito</button>
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

                  <div class="glass-section p-4 space-y-4 border-t-2 border-app-border-light">
                    <div class="flex items-center gap-2 mb-2"><Bug class="w-4 h-4 text-indigo-500" /><div><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Modo Desenvolvedor (Debug)</p><p class="text-[10px] text-slate-500">Teste as chamadas de API internas do sistema TASS.</p></div></div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button @click="$emit('test-modal', 'success')" class="py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Success</button>
                      <button @click="$emit('test-modal', 'error')" class="py-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Error</button>
                      <button @click="$emit('test-modal', 'warning')" class="py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Warning</button>
                      <button @click="$emit('test-modal', 'prompt')" class="py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Prompt</button>
                    </div>
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
                  <div class="glass-section p-6 space-y-4 relative overflow-hidden"><div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Server class="w-16 h-16" /></div><div class="flex items-center gap-3 mb-2 relative z-10"><ShieldCheck class="w-5 h-5 text-emerald-500" /><h4 class="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Sistema Completo</h4></div><p class="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4 relative z-10">Exporta <b>absolutamente tudo</b>: tarefas, sprints, notas rápidas e todas as suas configurações de interface e jornada.</p><div class="flex flex-col xl:flex-row gap-3 relative z-10"><button @click="emit('export-system')" class="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"><Download class="w-4 h-4" /> Exportar</button><label class="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"><Upload class="w-4 h-4" /> Restaurar<input type="file" accept=".json" class="hidden" @change="handleImportSystem" /></label></div></div>
                  <div class="glass-section p-6 space-y-4 relative overflow-hidden"><div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><FileJson class="w-16 h-16" /></div><div class="flex items-center gap-3 mb-2 relative z-10"><FileJson class="w-5 h-5 text-indigo-500" /><h4 class="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Apenas Tarefas</h4></div><p class="text-[10px] text-slate-500 leading-relaxed mb-4 relative z-10">Exporta apenas a sua lista de tarefas atual. Ideal para transferências rápidas ou backups frequentes.</p><div class="flex flex-col xl:flex-row gap-3 relative z-10"><button @click="emit('export-tasks')" class="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-white/5 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-app-border-light"><Download class="w-4 h-4" /> Exportar</button><label class="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-app-border-light cursor-pointer text-center"><Upload class="w-4 h-4" /> Importar<input type="file" accept=".json" class="hidden" @change="handleImportTasks" /></label></div></div>
                </div>
                <div class="glass-section p-6 bg-red-500/5 dark:bg-red-500/10 border-red-500/20 space-y-4"><div class="flex items-center gap-3 mb-2"><Activity class="w-5 h-5 text-red-500" /><h4 class="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Zona de Perigo</h4></div><p class="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">Deseja limpar tudo e começar do zero? Esta ação removerá todas as tarefas e sprints do seu banco de dados local.</p><button @click="handleResetSystem" class="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95">Zerar Banco de Dados</button></div>
              </div>

              <div v-else-if="activeTab === 'account'" :key="'account'" class="space-y-6">
                <div class="glass-section p-6">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                        <User class="w-5 h-5" />
                      </div>
                      <div>
                        <h3 class="text-sm font-black text-app-main uppercase tracking-tight">Detalhes do Usuário</h3>
                        <p class="text-xs text-app-muted font-mono mt-0.5">{{ authStore.user?.email }}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      @click="handleLogout" 
                      class="btn btn-secondary px-4 py-2 border-none shadow-none text-xs text-red-400 hover:text-red-500 flex items-center gap-1.5"
                    >
                      <LogOut class="w-3.5 h-3.5" /> Sair da Conta
                    </button>
                  </div>
                </div>
              </div>
      </transition>

    <!-- Footer -->
    <template #footer>
      <button type="button" @click="emit('close')" class="btn btn-secondary px-6 py-2 border-none shadow-none text-xs">Cancelar</button>
      <button type="button" @click="handleSave" class="btn btn-primary px-8 py-2 border-none shadow-none text-xs font-black uppercase tracking-widest">Salvar</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.app-timepicker {
  --dp-border-radius: 12px;
}
</style>

<script setup>
import { ref } from 'vue';
import { AlertTriangle, Cloud, Download, Loader2, LogIn, LogOut, Server, Trash2, Upload } from 'lucide-vue-next';
import AppButton from './base/AppButton.vue';
import AppInput from './base/AppInput.vue';
import { useSettingsStore } from '../stores/settingsStore.js';
import { useTaskStore } from '../stores/taskStore.js';
import { backupService } from '../services/backupService.js';
import { nextcloudService } from '../services/nextcloudService.js';
import { notificationService } from '../services/notificationService.js';

defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
});

const settings = useSettingsStore();
const taskStore = useTaskStore();
const savedConnection = nextcloudService.getConnection();

const credentials = ref({
  serverUrl: savedConnection?.serverUrl || '',
  username: savedConnection?.username || '',
  appPassword: ''
});
const isAuthenticated = ref(nextcloudService.isAuthenticated());
const isLoading = ref(false);
const backups = ref([]);
const showRestoreList = ref(false);

const showError = (title, error) => {
  console.error(`[Nextcloud] ${title}:`, error);
  notificationService.alert(title, error.message || 'Não foi possível concluir a operação.', 'error');
};

const handleConnect = async () => {
  isLoading.value = true;
  try {
    await nextcloudService.connect(credentials.value);
    credentials.value.appPassword = '';
    isAuthenticated.value = true;
    notificationService.toast('Nextcloud conectada com sucesso!', 'success');
  } catch (error) {
    showError('Falha ao conectar à Nextcloud', error);
  } finally {
    isLoading.value = false;
  }
};

const handleDisconnect = () => {
  nextcloudService.disconnect();
  isAuthenticated.value = false;
  backups.value = [];
  showRestoreList.value = false;
  notificationService.toast('Nextcloud desconectada.');
};

const handleBackup = async () => {
  isLoading.value = true;
  try {
    await nextcloudService.uploadBackup(await backupService.getFullBackupData());
    notificationService.toast('Backup enviado à Nextcloud!', 'success');
  } catch (error) {
    showError('Erro no backup da Nextcloud', error);
  } finally {
    isLoading.value = false;
  }
};

const handleLoadBackups = async () => {
  isLoading.value = true;
  try {
    backups.value = await nextcloudService.listBackups();
    showRestoreList.value = true;
  } catch (error) {
    showError('Erro ao listar backups', error);
  } finally {
    isLoading.value = false;
  }
};

const handleRestore = async (file) => {
  const confirmed = await notificationService.confirm(
    'Restaurar Backup?',
    `Deseja restaurar o backup "${file.name}"? Isso substituirá seus dados atuais.`,
    'Sim, Restaurar',
    'warning'
  );
  if (!confirmed) return;

  isLoading.value = true;
  try {
    const data = await nextcloudService.downloadBackup(file.id);
    await backupService.applyBackupData(data, settings, taskStore);
  } catch (error) {
    showError('Erro ao restaurar backup', error);
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (file) => {
  const confirmed = await notificationService.confirm(
    'Excluir Backup?',
    `Tem certeza que deseja remover "${file.name}" permanentemente da Nextcloud?`,
    'Sim, Excluir',
    'error'
  );
  if (!confirmed) return;

  isLoading.value = true;
  try {
    await nextcloudService.deleteBackup(file.id);
    backups.value = backups.value.filter(backup => backup.id !== file.id);
    notificationService.toast('Backup removido da Nextcloud!', 'success');
  } catch (error) {
    showError('Erro ao excluir backup', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <section
    class="space-y-4 relative overflow-hidden"
    :class="embedded ? '' : 'glass-section p-6 border border-app-border'"
  >
    <Cloud class="absolute -top-6 -right-6 w-40 h-40 text-app-muted opacity-[0.03] pointer-events-none" />

    <div class="flex items-center justify-between gap-4 relative z-10">
      <div class="flex items-center gap-3 min-w-0">
        <Server class="w-5 h-5 shrink-0 text-app-sub" />
        <div class="min-w-0">
          <h4 class="text-sm font-black text-app-main uppercase tracking-tight truncate">
            {{ isAuthenticated ? credentials.username : 'Nextcloud' }}
          </h4>
          <p class="text-[9px] font-bold text-app-muted">
            {{ isAuthenticated ? 'Conectado nesta sessão' : 'Nuvem livre via WebDAV' }}
          </p>
        </div>
      </div>
      <Loader2 v-if="isLoading" class="w-4 h-4 shrink-0 text-app-sub animate-spin" />
    </div>

    <p class="text-[10px] text-app-sub leading-relaxed relative z-10">
      Salva backups completos na pasta <strong>“TASS”</strong> da sua própria Nextcloud.
      A senha de aplicativo permanece somente nesta aba e é apagada ao desconectar ou fechar a sessão.
    </p>

    <form v-if="!isAuthenticated" class="space-y-3 relative z-10" @submit.prevent="handleConnect">
      <AppInput v-model="credentials.serverUrl" label="URL da Nextcloud" :icon="Server" type="url" required autocomplete="url" placeholder="https://cloud.exemplo.com" />
      <AppInput v-model="credentials.username" label="Usuário" :icon="Cloud" required autocomplete="username" placeholder="seu usuário da Nextcloud" />
      <AppInput v-model="credentials.appPassword" label="Senha de aplicativo" :icon="LogIn" type="password" required autocomplete="new-password" placeholder="gere em Configurações pessoais › Segurança" />
      <AppButton class="w-full" type="submit" :icon="LogIn" :loading="isLoading">Conectar Nextcloud</AppButton>

      <details class="border border-app-border-light bg-app-surface px-4 py-3 text-[10px] text-app-sub" :style="{ borderRadius: 'var(--app-input-radius)' }">
        <summary class="flex items-center gap-2 font-bold text-app-main cursor-pointer select-none">
          <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
          Requisitos da conexão
        </summary>
        <div class="pt-3 space-y-2 leading-relaxed">
          <p>Use HTTPS e uma senha de aplicativo exclusiva, nunca a senha principal da conta.</p>
          <p>Se TASS e Nextcloud usam domínios diferentes, o administrador precisa liberar CORS para a origem do TASS, os cabeçalhos Authorization, Content-Type e Depth, além dos métodos GET, PUT, DELETE, PROPFIND e MKCOL.</p>
        </div>
      </details>
    </form>

    <div v-else class="space-y-4 relative z-10">
      <div v-if="!showRestoreList" class="flex flex-col sm:flex-row gap-3">
        <AppButton class="flex-1" :icon="Upload" :loading="isLoading" @click="handleBackup">Criar Novo Backup</AppButton>
        <AppButton class="flex-1" variant="secondary" :icon="Download" :disabled="isLoading" @click="handleLoadBackups">Ver Backups</AppButton>
      </div>

      <div v-else class="space-y-3 animate-fadeIn">
        <div class="flex items-center justify-between gap-3">
          <p class="text-[10px] font-black text-app-main uppercase tracking-widest">Escolha um ponto para restaurar</p>
          <AppButton variant="ghost" size="sm" @click="showRestoreList = false">Voltar</AppButton>
        </div>

        <div v-if="backups.length === 0" class="py-8 text-center border-2 border-dashed border-app-border-light px-6" :style="{ borderRadius: 'var(--app-card-radius)' }">
          <Cloud class="w-8 h-8 text-app-muted mx-auto mb-2" />
          <p class="text-[11px] font-bold text-app-muted uppercase tracking-widest">Nenhum backup encontrado</p>
          <p class="text-[9px] text-app-muted mt-1">A pasta TASS foi verificada na sua Nextcloud.</p>
        </div>

        <div v-else class="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          <div v-for="(file, index) in backups" :key="file.id" class="flex items-center gap-3 p-3 bg-app-surface border border-app-border-light transition-all" :style="{ borderRadius: 'var(--app-input-radius)' }">
            <button class="flex-1 min-w-0 text-left cursor-pointer" type="button" @click="handleRestore(file)">
              <span class="block text-[11px] font-bold text-app-main truncate">{{ index === 0 ? 'Último Backup' : file.name }}</span>
              <span class="block text-[9px] text-app-muted">{{ new Date(file.createdTime).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) }}</span>
            </button>
            <button v-tooltip="'Restaurar este backup'" type="button" class="p-2 text-app-sub hover:text-app-main transition-colors" @click="handleRestore(file)"><Download class="w-3.5 h-3.5" /></button>
            <button v-tooltip="'Excluir da Nextcloud'" type="button" class="p-2 text-app-sub hover:text-app-main transition-colors" @click="handleDelete(file)"><Trash2 class="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      <AppButton class="w-full" variant="ghost" size="sm" :icon="LogOut" @click="handleDisconnect">Desconectar conta</AppButton>
    </div>
  </section>
</template>

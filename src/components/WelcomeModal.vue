<script setup>
import { ref } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  Sparkles, Palette, PlusCircle, Calendar, Radio, Globe
} from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';

const emit = defineEmits(['close', 'select-shortcut']);
const settings = useSettingsStore();

const dontShowAgain = ref(false);

const handleAction = async (action) => {
  if (dontShowAgain.value) {
    settings.hideWelcomeModal = true;
    await settings.saveSetting('app-hide-welcome', true);
  }
  emit('select-shortcut', action);
};

const handleClose = async () => {
  if (dontShowAgain.value) {
    settings.hideWelcomeModal = true;
    await settings.saveSetting('app-hide-welcome', true);
  }
  emit('close');
};
</script>

<template>
  <BaseModal
    title="Bem-vindo ao Tass"
    subtitle="Selecione um atalho rápido para configurar seu workspace ou iniciar uma ação"
    :icon="Sparkles"
    icon-bg-color="#7D2AE8"
    maxWidth="max-w-3xl"
    :showClose="true"
    @close="handleClose"
  >
    <div class="space-y-6">

      <!-- Action Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-6 gap-4">
        
        <!-- Papel de Parede e + -->
        <button 
          @click="handleAction('wallpaper')"
          class="flex flex-col items-center justify-center p-5 bg-white/[0.03] dark:bg-white/[0.02] rounded-2xl border border-white/10 dark:border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-center group cursor-pointer sm:col-span-3 md:col-span-2 min-h-[160px] select-none"
        >
          <div class="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 mb-3">
            <Palette class="w-7 h-7" />
          </div>
          <span class="text-xs font-black text-white uppercase tracking-wider">Papel de Parede & +</span>
          <span class="text-[10px] text-app-muted mt-1 font-bold">Personalize o visual e efeitos</span>
        </button>

        <!-- Cadastrar uma tarefa -->
        <button 
          @click="handleAction('task')"
          class="flex flex-col items-center justify-center p-5 bg-white/[0.03] dark:bg-white/[0.02] rounded-2xl border border-white/10 dark:border-white/5 hover:border-emerald-500/40 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-center group cursor-pointer sm:col-span-3 md:col-span-2 min-h-[160px] select-none"
        >
          <div class="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300 mb-3">
            <PlusCircle class="w-7 h-7" />
          </div>
          <span class="text-xs font-black text-white uppercase tracking-wider">Nova Tarefa</span>
          <span class="text-[10px] text-app-muted mt-1 font-bold">Crie uma atividade no Kanban</span>
        </button>

        <!-- Cadastrar uma sprint -->
        <button 
          @click="handleAction('sprint')"
          class="flex flex-col items-center justify-center p-5 bg-white/[0.03] dark:bg-white/[0.02] rounded-2xl border border-white/10 dark:border-white/5 hover:border-amber-500/40 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-center group cursor-pointer sm:col-span-3 md:col-span-2 min-h-[160px] select-none"
        >
          <div class="p-3.5 bg-amber-500/10 rounded-2xl text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300 mb-3">
            <Calendar class="w-7 h-7" />
          </div>
          <span class="text-xs font-black text-white uppercase tracking-wider">Nova Sprint</span>
          <span class="text-[10px] text-app-muted mt-1 font-bold">Inicie um ciclo de entregas</span>
        </button>

        <!-- Ouvir rádio -->
        <button 
          @click="handleAction('radio')"
          class="flex flex-col items-center justify-center p-5 bg-white/[0.03] dark:bg-white/[0.02] rounded-2xl border border-white/10 dark:border-white/5 hover:border-rose-500/40 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-center group cursor-pointer sm:col-span-3 md:col-span-3 min-h-[160px] select-none"
        >
          <div class="p-3.5 bg-rose-500/10 rounded-2xl text-rose-400 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300 mb-3">
            <Radio class="w-7 h-7" />
          </div>
          <span class="text-xs font-black text-white uppercase tracking-wider">Ouvir Rádio</span>
          <span class="text-[10px] text-app-muted mt-1 font-bold">Músicas de foco e flow state</span>
        </button>

        <!-- Integrar com o gitlab -->
        <button 
          @click="handleAction('gitlab')"
          class="flex flex-col items-center justify-center p-5 bg-white/[0.03] dark:bg-white/[0.02] rounded-2xl border border-white/10 dark:border-white/5 hover:border-orange-500/40 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-center group cursor-pointer sm:col-span-6 md:col-span-3 min-h-[160px] select-none"
        >
          <div class="p-3.5 bg-orange-500/10 rounded-2xl text-orange-400 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300 mb-3">
            <Globe class="w-7 h-7" />
          </div>
          <span class="text-xs font-black text-white uppercase tracking-wider">Integrar GitLab</span>
          <span class="text-[10px] text-app-muted mt-1 font-bold">Conecte seus MRs e branches</span>
        </button>

      </div>

      <!-- Footer check and action -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4 mt-2">
        <label class="flex items-center gap-2.5 cursor-pointer group select-none">
          <input 
            type="checkbox" 
            v-model="dontShowAgain" 
            class="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer"
          />
          <span class="text-xs text-app-muted group-hover:text-white transition-colors">
            Não mostrar este guia ao iniciar o sistema
          </span>
        </label>

        <button 
          type="button" 
          @click="handleClose" 
          class="btn btn-primary px-8 py-3 border-none shadow-none text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Entendi
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
</style>

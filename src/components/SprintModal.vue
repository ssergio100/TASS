<script setup>
import { ref } from 'vue';
import { Plus, Trash2, Calendar, Layers } from 'lucide-vue-next';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ptBR } from 'date-fns/locale';
import BaseModal from './BaseModal.vue';
import '@vuepic/vue-datepicker/dist/main.css';

const taskStore = useTaskStore();
const settings = useSettingsStore();

const props = defineProps({
  activeSprintId: [String, Number],
  initialShowAddForm: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'updated', 'select-sprint']);

const newSprintDate = ref(null);
const showAddForm = ref(props.initialShowAddForm);

const addSprint = async () => {
  if (!newSprintDate.value) return;
  
  try {
    const dateToSave = new Date(newSprintDate.value).toISOString();
    
    await db.sprints.add({
      endDate: dateToSave,
      createdAt: Date.now()
    });
    newSprintDate.value = null;
    showAddForm.value = false;
    await taskStore.loadSprints();
    notificationService.toast('Sprint criada!');
    emit('updated');
  } catch (error) {
    console.error("Failed to add sprint:", error);
  }
};

const deleteSprint = async (id) => {
  const confirmed = await notificationService.confirm(
    'Excluir Sprint',
    'Isso não excluirá as tarefas associadas, mas removerá o vínculo. Continuar?',
    'Excluir Sprint',
    'error',
    'btn btn-danger'
  );

  if (confirmed) {
    try {
      await db.sprints.delete(id);
      await taskStore.loadSprints();
      notificationService.toast('Sprint removida!');
      emit('updated');
    } catch (error) {
      console.error("Failed to delete sprint:", error);
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

const isPast = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sprintDate = new Date(dateStr);
  return sprintDate < today;
};
</script>

<template>
  <BaseModal 
    maxWidth="max-w-2xl" 
    @close="emit('close')"
    :icon="Calendar"
    title="Ciclos de Trabalho"
    subtitle="Gestão de Sprints e Prazos"
    layout="standard"
  >
    <!-- Linha Superior: Ações e Filtro Global -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Botão: Nova Sprint -->
        <button 
          @click="showAddForm = !showAddForm"
          class="flex items-center gap-3 p-4 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 transition-all group"
          :style="{ borderRadius: 'var(--app-input-radius)' }"
        >
          <div class="w-10 h-10 bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform" :style="{ borderRadius: 'calc(var(--app-input-radius) * 0.8)' }">
            <Plus class="w-5 h-5" />
          </div>
          <div class="text-left">
            <span class="block text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">Nova Sprint</span>
            <span class="text-[9px] text-slate-500 font-medium">Defina um prazo</span>
          </div>
        </button>

        <!-- Botão: Todas as Tarefas -->
        <button 
          @click="emit('select-sprint', 'all')"
          class="flex items-center gap-3 p-4 border transition-all group relative overflow-hidden"
          :style="{ borderRadius: 'var(--app-input-radius)' }"
          :class="activeSprintId === 'all' 
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/30' 
            : 'bg-white dark:bg-slate-800/40 border-app-border-light text-slate-700 dark:text-slate-300 hover:border-indigo-500/50'"
        >
          <div class="w-10 h-10 flex items-center justify-center transition-all"
            :style="{ borderRadius: 'calc(var(--app-input-radius) * 0.8)' }"
            :class="activeSprintId === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-indigo-500'">
            <Layers class="w-5 h-5" />
          </div>
          <div class="text-left">
            <span class="block text-xs font-black uppercase tracking-tight">Ver Tudo</span>
            <span class="text-[9px] opacity-60 font-medium">Todos os ciclos</span>
          </div>
          <div v-if="activeSprintId === 'all'" class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
        </button>
      </div>

      <!-- Formulário de Cadastro (Ocultável) -->
      <div v-if="showAddForm" class="p-6 bg-slate-50 dark:bg-white/5 border border-app-border-light animate-scaleIn space-y-5" :style="{ borderRadius: 'var(--app-card-radius)' }">
        <div class="flex items-center gap-2">
           <div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
           <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configurar Novo Ciclo</span>
        </div>
        <div class="space-y-4">
          <VueDatePicker 
            v-model="newSprintDate" 
            :dark="settings.theme === 'dark'"
            placeholder="Selecione a data..."
            auto-apply
            :enable-time-picker="false"
            class="app-datepicker"
            input-class-name="app-input px-4 py-3 shadow-sm transition-all w-full"
            teleport="body"
            :format-locale="ptBR"
            :locale="ptBR"
            format="dd/MM/yyyy"
          />
          <div class="flex gap-3">
            <button @click="showAddForm = false" class="flex-1 py-3 text-xs font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all uppercase tracking-widest" :style="{ borderRadius: 'var(--app-input-radius)' }">Cancelar</button>
            <button @click="addSprint" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 uppercase tracking-widest" :disabled="!newSprintDate" :style="{ borderRadius: 'var(--app-input-radius)' }">
              Salvar
            </button>
          </div>
        </div>
      </div>

      <!-- Seção: Listagem em Grid -->
      <section class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Ciclos</h3>
          <span class="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">{{ taskStore.sprints.length }} sprints</span>
        </div>

        <div class="max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
          <div class="grid gap-4" :class="taskStore.sprints.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'">
            <!-- Cards das Sprints -->
            <div 
              v-for="(sprint, index) in taskStore.sprints" 
              :key="sprint.id"
              class="group relative"
            >
              <button 
                @click="emit('select-sprint', sprint.id)"
                class="w-full flex items-center gap-4 p-4 border transition-all"
                :style="{ borderRadius: 'var(--app-input-radius)' }"
                :class="activeSprintId == sprint.id 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/30' 
                  : 'bg-white dark:bg-slate-800/40 border-app-border-light text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.02]'"
              >
                <div class="w-10 h-10 flex items-center justify-center transition-all flex-shrink-0"
                  :style="{ borderRadius: 'calc(var(--app-input-radius) * 0.8)' }"
                  :class="activeSprintId == sprint.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-indigo-500'">
                  <span class="text-xs font-black">#{{ taskStore.sprints.length - index }}</span>
                </div>
                <div class="text-left overflow-hidden">
                  <span class="block text-sm font-black uppercase tracking-tight truncate">Término: {{ formatDate(sprint.endDate) }}</span>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span v-if="!isPast(sprint.endDate)" class="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Em Aberto</span>
                    <span v-else class="text-[8px] font-black bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Finalizada</span>
                  </div>
                </div>
              </button>
              
              <!-- Ação Excluir -->
              <button 
                @click.stop="deleteSprint(sprint.id)" 
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500"
                :class="activeSprintId == sprint.id ? 'text-white/40' : 'text-slate-400 bg-slate-100/50 dark:bg-white/5'"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

  <template #footer>
    <div class="w-full flex justify-center">
      <button @click="emit('close')" class="btn btn-primary px-10">
        Voltar ao Board
      </button>
    </div>
  </template>
</BaseModal>
</template>

<style>
.app-datepicker {
  --dp-border-radius: var(--app-input-radius);
  --dp-font-family: inherit;
}
.dark .app-datepicker {
  --dp-background-color: #0f172a;
  --dp-border-color: rgba(255, 255, 255, 0.1);
}
</style>

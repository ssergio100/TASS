<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useRadioStore } from '../stores/radioStore';
import { useTheme } from '../composables/useTheme';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { 
  PlusCircle, RotateCcw, List, Activity, CheckCircle, 
  Calendar, CloudLightning, Headphones, Sun, Moon, Settings,
  Eye, EyeOff, Filter, ChevronRight, Wrench, Info, Palette, Check
} from 'lucide-vue-next';

const emit = defineEmits(['close']);
const uiStore = useUIStore();
const settings = useSettingsStore();
const taskStore = useTaskStore();
const radioStore = useRadioStore();
const taskStyleStore = useTaskStyleStore();
const { toggleTheme } = useTheme(settings);
const menuRef = ref(null);
const showFilters = ref(false);
const showUtils = ref(false);
const showStyles = ref(false);

const currentPresetId = computed(() => {
  const activeTasks = taskStore.tasks.filter(t => !t.completed && !t.styleLocked);
  if (activeTasks.length === 0) return null;
  const firstStyleId = activeTasks[0].styleId || '';
  const allSame = activeTasks.every(t => (t.styleId || '') === firstStyleId);
  return allSame ? firstStyleId : null;
});

const menuStyle = ref({ top: 'auto', left: 'auto' });

const adjustPosition = () => {
  if (!menuRef.value) return;
  
  let x = uiStore.workspaceContextMenuPosition.x;
  let y = uiStore.workspaceContextMenuPosition.y;
  
  const menuWidth = menuRef.value.offsetWidth;
  const menuHeight = menuRef.value.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (x + menuWidth > windowWidth - 20) x = windowWidth - menuWidth - 20;
  if (y + menuHeight > windowHeight - 20) y = windowHeight - menuHeight - 20;
  
  menuStyle.value = { top: `${y}px`, left: `${x}px` };
};

const submenuClass = computed(() => {
  const x = uiStore.workspaceContextMenuPosition.x;
  const y = uiStore.workspaceContextMenuPosition.y;
  const isRight = x > window.innerWidth / 2;
  const isBottom = y > window.innerHeight / 2;
  
  let classes = '';
  if (isRight) {
    classes += ' right-[calc(100%+0.5rem)]';
  } else {
    classes += ' left-[calc(100%+0.5rem)]';
  }
  
  if (isBottom) {
    classes += ' bottom-[-0.5rem]';
  } else {
    classes += ' -top-2';
  }
  return classes;
});

const handleNewTask = () => {
  uiStore.openTaskModal();
  emit('close');
};

const handleUndo = async () => {
  if (taskStore.lastDeletedTask) {
    await taskStore.restoreTask();
  }
  emit('close');
};

const handleFilter = (filter) => {
  taskStore.statusFilter = filter;
  emit('close');
};

const handleOpenSprints = () => {
  uiStore.showSprints = true;
  emit('close');
};

const handleOpenBreeze = () => {
  uiStore.showSettings = false;
  uiStore.showGitRebuilder = true;
  emit('close');
};

const handleToggleRadio = () => {
  uiStore.showRadio = !uiStore.showRadio;
  emit('close');
};

const handleToggleTheme = () => {
  toggleTheme();
  emit('close');
};

const handleToggleDock = () => {
  uiStore.showGlobalDock = !uiStore.showGlobalDock;
  emit('close');
};

const handleOpenSettings = () => {
  uiStore.openSettings();
  emit('close');
};

const handleOpenAbout = () => {
  uiStore.openSettings('about');
  emit('close');
};

const handleApplyStyleAll = async (styleId, triggerAnimation = false) => {
  const tasksToUpdate = taskStore.tasks.filter(task => !task.styleLocked);
  const taskIds = tasksToUpdate.map(t => t.id);
  if (triggerAnimation && taskIds.length > 0) {
    uiStore.triggerPresetAnimation(taskIds);
  }
  const promises = tasksToUpdate.map(task => 
    taskStore.updateTask(task.id, { styleId: styleId || null })
  );
  await Promise.all(promises);
};

// --- PREVIEW DE PRESETS AO HOVER (Visual apenas) ---
// O hover apenas aplica um preview visual via uiStore.previewGlobalStyleId,
// sem persistir nada no store/banco. O preset só é aplicado de fato no clique.
const handlePreviewStart = (styleId) => {
  uiStore.previewGlobalStyleId = styleId;
};

const handlePreviewEnd = () => {
  uiStore.previewGlobalStyleId = null;
};

const handleApplyAndConfirm = async (styleId) => {
  uiStore.previewGlobalStyleId = null;
  await handleApplyStyleAll(styleId, true);
};

onMounted(() => {
  uiStore.previewGlobalStyleId = null;
  adjustPosition();
  window.addEventListener('click', (e) => {
    if (menuRef.value && !menuRef.value.contains(e.target)) emit('close');
  });
});

onUnmounted(() => {
  uiStore.previewGlobalStyleId = null;
  window.removeEventListener('click', () => {});
});
</script>

<template>
  <div 
    ref="menuRef"
    class="fixed z-[1000] min-w-[200px] pointer-events-none transition-all duration-300 max-w-fit"
    :style="menuStyle"
  >
    <div 
      class="glass-panel !py-2 !px-1.5 flex flex-col shadow-2xl border-indigo-500/30 ring-1 ring-black/10 pointer-events-auto animate-scaleIn"
      @click.stop
      :style="{ 
        backgroundColor: `rgba(var(--app-bg-raw), var(--app-menu-opacity))`,
        borderRadius: 'var(--app-card-radius)'
      }"
    >
      <div class="flex flex-col gap-0.5">
        <button @click="handleNewTask" class="context-menu-item text-emerald-500">
          <PlusCircle class="w-4 h-4" /> 
          <span>Nova Tarefa</span>
        </button>

        <button v-if="taskStore.lastDeletedTask" @click="handleUndo" class="context-menu-item text-amber-500">
          <RotateCcw class="w-4 h-4" /> 
          <span>Desfazer Exclusão</span>
        </button>

        <hr class="border-t border-app-border-light my-1" />

        <div 
          class="relative"
          @mouseenter="showFilters = true"
          @mouseleave="showFilters = false"
        >
          <button class="context-menu-item w-full justify-between">
            <div class="flex items-center gap-3">
              <Filter class="w-4 h-4" />
              <span>Filtros</span>
            </div>
            <ChevronRight class="w-4 h-4 opacity-50" />
          </button>

          <transition 
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div 
              v-show="showFilters" 
              class="absolute glass-panel !py-2 !px-1.5 flex flex-col shadow-2xl border-indigo-500/30 ring-1 ring-black/10 w-max"
              :class="submenuClass"
              :style="{ 
                backgroundColor: `rgba(var(--app-bg-raw), var(--app-menu-opacity))`,
                borderRadius: 'var(--app-card-radius)'
              }"
            >
              <div class="px-3 py-1.5 text-[10px] font-black uppercase text-app-sub tracking-widest border-b border-app-border-light mb-1">Visualização</div>
              <button @click="handleFilter('all')" class="context-menu-item" :class="{ 'text-indigo-500 bg-indigo-500/5': taskStore.statusFilter === 'all' }">
                <List class="w-4 h-4" /> 
                <span>Todas as Tarefas</span>
              </button>
              <button @click="handleFilter('active')" class="context-menu-item" :class="{ 'text-indigo-500 bg-indigo-500/5': taskStore.statusFilter === 'active' }">
                <Activity class="w-4 h-4" /> 
                <span>Somente Ativas</span>
              </button>
              <button @click="handleFilter('completed')" class="context-menu-item" :class="{ 'text-indigo-500 bg-indigo-500/5': taskStore.statusFilter === 'completed' }">
                <CheckCircle class="w-4 h-4" /> 
                <span>Somente Feitas</span>
              </button>
            </div>
          </transition>
        </div>

        <hr class="border-t border-app-border-light my-1" />

        <div 
          class="relative"
          @mouseenter="showStyles = true"
          @mouseleave="showStyles = false"
        >
          <button class="context-menu-item w-full justify-between">
            <div class="flex items-center gap-3">
              <Palette class="w-4 h-4 text-pink-500" />
              <span>Presets</span>
            </div>
            <ChevronRight class="w-4 h-4 opacity-50" />
          </button>

          <transition 
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div 
              v-show="showStyles" 
              class="absolute glass-panel !py-2 !px-1.5 flex flex-col shadow-2xl border-indigo-500/30 ring-1 ring-black/10"
              :class="[submenuClass, taskStyleStore.sortedStyles.length > 24 ? 'w-[580px]' : taskStyleStore.sortedStyles.length > 12 ? 'w-[380px]' : 'w-[200px]']"
              :style="{ 
                backgroundColor: `rgba(var(--app-bg-raw), var(--app-menu-opacity))`,
                borderRadius: 'var(--app-card-radius)'
              }"
            >
              <div class="px-3 py-1.5 text-[10px] font-black uppercase text-app-sub tracking-widest border-b border-app-border-light mb-1">Presets (Global)</div>
              
              <div :class="[taskStyleStore.sortedStyles.length > 12 ? 'grid gap-x-2 gap-y-0.5' : 'flex flex-col gap-0.5', taskStyleStore.sortedStyles.length > 24 ? 'grid-cols-3' : taskStyleStore.sortedStyles.length > 12 ? 'grid-cols-2' : '']">
                <button
                  @click="handleApplyAndConfirm('')"
                  @mouseenter="handlePreviewStart('')"
                  @mouseleave="handlePreviewEnd"
                  class="context-menu-item flex justify-between items-center"
                  :class="currentPresetId === '' ? 'bg-indigo-500/10 text-indigo-500 font-bold' : ''"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0" style="background-color: #e2e8f0;"></div>
                    <span>Padrão Global</span>
                  </div>
                  <Check v-if="currentPresetId === ''" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" />
                </button>

                <hr v-if="taskStyleStore.sortedStyles.length <= 12" class="border-t border-app-border-light my-1 mx-2" />

                <button 
                  v-for="preset in taskStyleStore.sortedStyles" 
                  :key="preset.id"
                  @click="handleApplyAndConfirm(preset.id)"
                  @mouseenter="handlePreviewStart(preset.id)"
                  @mouseleave="handlePreviewEnd"
                  class="context-menu-item flex justify-between items-center"
                  :class="currentPresetId === preset.id ? 'bg-indigo-500/10 text-indigo-500 font-bold' : ''"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0" :style="{ backgroundColor: preset.colors?.bgColor || '#e2e8f0' }"></div>
                    <span class="truncate">{{ preset.name }}</span>
                  </div>
                  <Check v-if="currentPresetId === preset.id" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" />
                </button>
              </div>
              
              <div v-if="taskStyleStore.sortedStyles.length === 0" class="py-3 px-2 text-center">
                <p class="text-[10px] text-slate-400 italic">Nenhum preset.</p>
              </div>
            </div>
          </transition>
        </div>

        <hr class="border-t border-app-border-light my-1" />

        <div 
          class="relative"
          @mouseenter="showUtils = true"
          @mouseleave="showUtils = false"
        >
          <button class="context-menu-item w-full justify-between">
            <div class="flex items-center gap-3">
              <Wrench class="w-4 h-4" />
              <span>Utilitários</span>
            </div>
            <ChevronRight class="w-4 h-4 opacity-50" />
          </button>

          <transition 
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div 
              v-show="showUtils" 
              class="absolute glass-panel !py-2 !px-1.5 flex flex-col shadow-2xl border-indigo-500/30 ring-1 ring-black/10 w-max"
              :class="submenuClass"
              :style="{ 
                backgroundColor: `rgba(var(--app-bg-raw), var(--app-menu-opacity))`,
                borderRadius: 'var(--app-card-radius)'
              }"
            >
              <div class="px-3 py-1.5 text-[10px] font-black uppercase text-app-sub tracking-widest border-b border-app-border-light mb-1">Ações Rapidas</div>
              
              <button @click="handleOpenSprints" class="context-menu-item text-indigo-500">
                <Calendar class="w-4 h-4" /> 
                <span>Sprints</span>
              </button>

              <button @click="handleOpenBreeze" class="context-menu-item text-emerald-500">
                <CloudLightning class="w-4 h-4" /> 
                <span>Breeze (Git Rebuilder)</span>
              </button>

              <button @click="handleToggleRadio" class="context-menu-item text-amber-500 relative">
                <Headphones class="w-4 h-4" /> 
                <span>Rádio Lofi</span>
                <span v-if="radioStore.isPlaying" class="absolute top-3 left-3 w-2 h-2 bg-amber-500 rounded-full animate-ping opacity-75"></span>
              </button>
            </div>
          </transition>
        </div>

        <hr class="border-t border-app-border-light my-1" />

        <button @click="handleToggleTheme" class="context-menu-item">
          <Sun v-if="settings.theme === 'dark'" class="w-4 h-4 text-amber-500" />
          <Moon v-else class="w-4 h-4 text-indigo-500" />
          <span>Alternar Tema</span>
        </button>

        <button @click="handleToggleDock" class="context-menu-item">
          <Eye v-if="!uiStore.showGlobalDock" class="w-4 h-4 text-indigo-500" />
          <EyeOff v-else class="w-4 h-4 text-slate-400" /> 
          <span>{{ uiStore.showGlobalDock ? 'Ocultar Dock' : 'Mostrar Dock' }}</span>
        </button>

        <button @click="handleOpenSettings" class="context-menu-item text-slate-400">
          <Settings class="w-4 h-4" /> 
          <span>Configurações</span>
        </button>

        <button @click="handleOpenAbout" class="context-menu-item text-teal-500">
          <Info class="w-4 h-4" /> 
          <span>Sobre o TASS</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-menu-item {
  @apply w-full px-3 py-2 flex items-center gap-3 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors rounded-[8px] active:scale-[0.98] cursor-pointer overflow-hidden;
}

.context-menu-item span {
  @apply truncate;
}

.animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>

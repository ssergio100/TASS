<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { Play, Square, MoreVertical, ArrowDown, ArrowRight, ArrowUp, AlertOctagon, GitBranch, MessageSquare, Database, ExternalLink } from 'lucide-vue-next';
import { formatMsToHMS } from '../utils/time.js';
import { hexToRgba } from '../utils/colors.js';

// Stores
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { notificationService } from '../services/notificationService';
import { taskActionService } from '../services/taskActionService';
import { gitProviderService } from '../services/gitProvider';
import { useUIStore } from '../stores/uiStore';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const taskStyleStore = useTaskStyleStore();
const uiStore = useUIStore();

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  columnIndex: {
    type: Number,
    default: -1
  }
});

const isMobile = ref(window.innerWidth < 768);
const isAnimatingPreset = computed(() => uiStore.animatingTaskIds.includes(props.task.id));

onMounted(() => {
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
});

const handleWindowResize = () => {
  isMobile.value = window.innerWidth < 768;
};

const activeStyle = computed(() => {
  let customStyles = {};

  // Prioridade 1: Estilo imposto temporariamente pela Coluna (Sobreposição)
  if (props.columnIndex >= 0 && settings.columnStyles && settings.columnStyles[props.columnIndex]) {
    const profileId = settings.columnStyles[props.columnIndex];
    const profile = taskStyleStore.getStyleById(profileId);
    if (profile && profile.styles && Object.keys(profile.styles).length > 0) customStyles = profile.styles;
  }

  // Prioridade 2: Estilo próprio da Tarefa, Preview (single) ou Preview Global
  if (Object.keys(customStyles).length === 0 && effectiveStyleId.value) {
    const profile = taskStyleStore.getStyleById(effectiveStyleId.value);
    if (profile && profile.styles && Object.keys(profile.styles).length > 0) customStyles = profile.styles;
  }
  
  // Mescla o que existir no perfil com o padrão global (settings)
  return {
    cardPadding: customStyles.cardPadding ?? settings.cardPadding,
    taskNumberSize: customStyles.taskNumberSize ?? settings.taskNumberSize,
    taskDescriptionSize: customStyles.taskDescriptionSize ?? settings.taskDescriptionSize,
    taskTimerSize: customStyles.taskTimerSize ?? settings.taskTimerSize,
    taskMinHeight: customStyles.taskMinHeight ?? settings.taskMinHeight,
    taskMaxWidth: props.task._labOverride || isMobile.value ? 0 : (customStyles.taskMaxWidth ?? settings.taskMaxWidth),
    taskVerticalAlign: customStyles.taskVerticalAlign ?? settings.taskVerticalAlign
  };
});

const taskColors = computed(() => {
  // Prioridade 1: Estilo imposto temporariamente pela Coluna (Sobreposição)
  if (props.columnIndex >= 0 && settings.columnStyles && settings.columnStyles[props.columnIndex]) {
    const profileId = settings.columnStyles[props.columnIndex];
    const profile = taskStyleStore.getStyleById(profileId);
    if (profile && profile.colors && profile.colors.color) return profile.colors;
  }

  // Prioridade 2: Estilo próprio da Tarefa, Preview (single) ou Preview Global
  if (effectiveStyleId.value) {
    const profile = taskStyleStore.getStyleById(effectiveStyleId.value);
    if (profile && profile.colors && profile.colors.color) return profile.colors;
  }
  
  // Prioridade 3: Padrão Global
  return {
    color: null,
    bgColor: '',
    textLightColor: '',
    textDarkColor: ''
  };
});

const effectiveStyleId = computed(() => {
  // Preview global do menu de contexto (Presets do Workspace)
  // Nunca altera o estado real da tarefa, apenas a visualização.
  if (uiStore.previewGlobalStyleId !== null && !props.task.styleLocked) {
    return uiStore.previewGlobalStyleId;
  }

  // Preview single-task (StylePickerMenu)
  const isPreviewing = uiStore.previewTaskId === props.task.id && uiStore.showStylePickerMenu;
  if (isPreviewing) return uiStore.previewStyleId;

  return props.task.styleId || '';
});

const emit = defineEmits([
  'toggle-timer',
  'open-time-adjustment'
]);

const formattedTime = computed(() => formatMsToHMS(props.task.totalTimeSpent));

const isSquareLayout = computed(() => {
  return activeStyle.value.taskMinHeight >= 80 || (activeStyle.value.taskMaxWidth > 0 && activeStyle.value.taskMaxWidth <= 280);
});

const currentTextColor = computed(() => {
  // Se não tiver cor definida, cai pro default vazio e o Tailwind reassume
  if (settings.theme === 'dark' && taskColors.value.textDarkColor) return taskColors.value.textDarkColor;
  if (settings.theme !== 'dark' && taskColors.value.textLightColor) return taskColors.value.textLightColor;
  return 'var(--app-text-sub)'; // Cor padrão do texto (text-app-sub)
});

const isCreatingBranch = ref(false);

const handleGitAction = async () => {
  isCreatingBranch.value = true;
  try {
    await gitProviderService.handleGitFlow(props.task, settings);
  } catch (error) {
    console.error("Git Action failed:", error);
    notificationService.toast('Falha na ação remota', 'error');
  } finally {
    isCreatingBranch.value = false;
  }
};

const handleAction = async (field, label, type = 'url') => {
  const currentValue = props.task[field];
  if (currentValue && type === 'url') {
    const finalUrl = currentValue.startsWith('http') ? currentValue : `https://${currentValue}`;
    window.open(finalUrl, '_blank');
  } else {
    await taskActionService.promptQuickUpdate(props.task, taskStore, field, label, type);
  }
};

const handleAdjustTime = (event) => {
  if (event) {
    taskStore.contextMenuPosition = { 
      x: event.clientX, 
      y: event.clientY 
    };
  } else {
    // Fallback centralizado se disparado sem evento direto
    taskStore.contextMenuPosition = { 
      x: window.innerWidth / 2, 
      y: window.innerHeight / 2 
    };
  }
  emit('open-time-adjustment', props.task);
};

const copyTaskContent = async () => {
  try {
    const content = props.task.title;
    
    await navigator.clipboard.writeText(content);
    notificationService.toast('Número copiado!', 'success');
  } catch (err) {
    console.error('Falha ao copiar:', err);
    notificationService.toast('Erro ao copiar', 'error');
  }
};

const priorityConfig = computed(() => {
  switch (props.task.priority) {
    case 'Baixa': return { icon: ArrowDown, class: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    case 'Alta': return { icon: ArrowUp, class: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
    case 'Urgente': return { icon: AlertOctagon, class: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    case 'Normal':
    default: return { icon: ArrowRight, class: 'text-slate-400 dark:text-slate-500 bg-slate-500/5 border-slate-500/10 opacity-50' };
  }
});

const handleSelect = (event) => {
  const isCurrentlySelected = taskStore.selectedTask?.id === props.task.id;
  
  if (isCurrentlySelected) {
    taskStore.selectedTask = null;
  } else {
    // Primeiro limpamos a seleção atual para forçar o fechamento do menu anterior
    taskStore.selectedTask = null;
    
    // Captura a nova posição do mouse imediatamente
    taskStore.contextMenuPosition = { 
      x: event.clientX, 
      y: event.clientY 
    };
    
    // Pequeno delay para garantir que o componente de menu seja remontado na nova posição
    // Pequeno delay para garantir que o componente de menu seja remontado na nova posição
    setTimeout(() => {
      taskStore.selectedTask = props.task;
    }, 10);
  }
};

// =========================================================================
// PROGRESSIVE DISCLOSURE (ResizeObserver)
// =========================================================================
const cardRef = ref(null);
const cardWidth = ref(0);
let resizeObserver = null;

onMounted(() => {
  if (cardRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        cardWidth.value = entry.target.offsetWidth;
      }
    });
    resizeObserver.observe(cardRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

const cardMode = computed(() => {
  if (cardWidth.value === 0) return 'full'; // Fallback inicial (antes do mount)
  if (cardWidth.value < 242) return 'micro';
  if (cardWidth.value < 300) return 'compact';
  return 'full';
});

// Calcula quais ícones cabem no espaço disponível
const visibleIcons = computed(() => {
  // Ícones que a tarefa possui, ordenados por prioridade de sobrevivência
  // Ordem visual da direita para a esquerda: Git (sobrevive mais), Msg, DB, Link (some primeiro)
  const icons = [];
  if (gitProviderService.hasBranch(props.task, settings)) icons.push('git');
  if (props.task.moreInfo) icons.push('msg');
  if (props.task.dbScripts) icons.push('db');
  if (props.task.taskUrl) icons.push('link');

  // Cálculo do espaço: a base consome um espaço mínimo. Ponto de equilíbrio: ~190px.
  // Cada ícone extra considera ~35px de espaço.
  if (cardMode.value === 'micro') return [];

  const availableSpace = cardWidth.value - 190;
  let maxIcons;
  
  if (availableSpace >= 140) maxIcons = 4;
  else if (availableSpace >= 105) maxIcons = 3;
  else if (availableSpace >= 70) maxIcons = 2;
  else if (availableSpace >= 35) maxIcons = 1;
  else maxIcons = 0;

  // Em larguras muito pequenas, podemos não ter espaço nem para 1 ícone
  return icons.slice(0, maxIcons);
});

// =========================================================================
// COMPUTED PROPERTIES SEMÂNTICAS (Evitando Síndrome do Gênio)
// =========================================================================

/**
 * Calcula os estilos dinâmicos do cartão (Cor de fundo, Borda e Sombra)
 * Levando em conta se a tarefa está selecionada, se está rodando ou se tem cor customizada.
 */
const cardDynamicStyles = computed(() => {
  const isSelected = taskStore.selectedTask?.id === props.task.id;
  const isRunning = props.task.isRunning;
  const hasCustomColor = !!taskColors.value.color;
  const customColor = taskColors.value.color;
  const baseBgColor = taskColors.value.bgColor;
  const opacity = settings.normalizedCardOpacity;
  const isGlassActive = opacity < 1.0;

  // 1. Calculando o Background
  let bgColor = hexToRgba(baseBgColor, opacity); // Fundo padrão

  if (isSelected) {
    if (isGlassActive) {
      // Quando o vidro está ativo, a seleção fica translúcida
      bgColor = hasCustomColor ? hexToRgba(customColor, 0.15) : 'rgba(99, 102, 241, 0.15)';
    } else {
      // Quando vidro está desligado, seleção mantém a cor sólida
      bgColor = hexToRgba(baseBgColor, opacity);
    }
  }

  // 2. Calculando a Borda
  let borderColor = '';
  if (isSelected && hasCustomColor) {
    borderColor = customColor;
  } else if (isRunning && hasCustomColor) {
    borderColor = customColor;
  }

  // 3. Calculando a Sombra
  let boxShadow = '';
  if (isSelected && hasCustomColor) {
    boxShadow = `0 0 0 2px ${customColor}80`;
  } else if (isRunning && hasCustomColor) {
    boxShadow = `0 0 15px ${customColor}33`;
  }

  return {
    backgroundColor: bgColor,
    borderColor: borderColor,
    boxShadow: boxShadow,
    minHeight: activeStyle.value.taskMinHeight > 40 ? activeStyle.value.taskMinHeight + 'px' : 'auto',
    minWidth: '164px',
    maxWidth: activeStyle.value.taskMaxWidth > 0 ? activeStyle.value.taskMaxWidth + 'px' : 'none',
    width: activeStyle.value.taskMaxWidth > 0 ? '100%' : 'auto',
    margin: activeStyle.value.taskMaxWidth > 0 ? '0 auto' : '',
    justifyContent: activeStyle.value.taskVerticalAlign === 'center' ? 'center' : 
                    activeStyle.value.taskVerticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
    padding: `${activeStyle.value.cardPadding || 16}px`
  };
});

/**
 * Classes descritivas para o botão de Play/Stop
 */
const timerButtonClasses = computed(() => {
  if (taskColors.value.color) {
    // Se a tarefa tem uma cor customizada, apenas aplicamos o brilho no hover
    return 'hover:brightness-110';
  }
  
  if (props.task.isRunning) {
    // Estado ativo rodando (Vermelho alerta)
    return 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 hover:bg-red-500/20';
  }
  
  // Estado padrão parado (Azul/Índigo calmante)
  return 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20';
});
</script>

<template>
  <div 
    ref="cardRef"
    class="tass-card glass-panel cursor-pointer cursor-grab hover:-translate-y-0.5 group relative hover:z-[100] flex flex-col"
    :class="[
      task.isRunning && !taskColors.color ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : '',
      taskStore.selectedTask?.id === task.id ? `z-[50] ${!taskColors.color ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''}` : '',
      isAnimatingPreset ? 'animate-preset-pulse' : ''
    ]"


    :style="cardDynamicStyles"
    @contextmenu.prevent.stop="handleSelect($event)"
    @click="handleSelect($event)"
    @mouseenter="taskStore.hoveredTask = task"
    @mouseleave="taskStore.hoveredTask = taskStore.hoveredTask?.id === task.id ? null : taskStore.hoveredTask"
  >

    <div 
      :class="[
        task.completed ? 'opacity-50' : '',
        isSquareLayout ? 'flex-col items-start h-full flex-1 w-full gap-3' : 'items-center gap-2 w-full flex-wrap'
      ]" 
      class="flex justify-between transition-opacity"
    >
      <div 
        class="flex flex-1 overflow-hidden transition-all duration-300"
        :class="[
          isSquareLayout ? 'flex-col items-start gap-2 w-full' : 'items-center gap-2',
          cardMode === 'micro' ? 'justify-center min-w-full' : 'min-w-[100px] w-full'
        ]"
      >
        <div class="flex items-center gap-2 shrink-0" :class="{ 'w-full': isSquareLayout }">
          <span 
            class="font-bold px-2 py-1 rounded-lg leading-tight flex-shrink-0 transition-all border flex items-center justify-center min-w-[85px] active:scale-95" 
            :style="{ 
              backgroundColor: taskColors.color ? `${taskColors.color}26` : '', 
              color: taskColors.color ? taskColors.color : '',
              borderColor: taskColors.color ? `${taskColors.color}40` : 'transparent',
              fontSize: activeStyle.taskNumberSize + 'px'
            }"
            :class="[
              !taskColors.color ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500/20' : ''
            ]"
            :data-tip="`Copiar número: ${task.title}`"
            @click.stop="copyTaskContent()"
          >
            {{ task.title }}
          </span>

          <div v-if="task.prodUrl == 1 || task.homologUrl == 1 || task.devUrl == 1" class="flex flex-row-reverse items-center gap-0.5 ml-auto">
            <div v-if="task.prodUrl == 1" class="px-1 py-0.5 rounded-[4px] text-[7px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 leading-none">PRD</div>
            <div v-if="task.homologUrl == 1" class="px-1 py-0.5 rounded-[4px] text-[7px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 leading-none">HML</div>
            <div v-if="task.devUrl == 1" class="px-1 py-0.5 rounded-[4px] text-[7px] font-black bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20 leading-none">DEV</div>
          </div>
        </div>
          <span 
            v-if="task.description && cardMode !== 'micro'" 
            class="text-sm flex-1 min-w-0 py-0.5 leading-tight text-justify" 
            :class="[
              task.completed ? 'line-through opacity-60' : '',
              isSquareLayout ? 'line-clamp-6 mt-1 whitespace-pre-wrap' : 'line-clamp-1'
            ]"
            :style="{ 
              fontSize: activeStyle.taskDescriptionSize + 'px', 
              color: currentTextColor 
            }"
            :data-tip="task.description"
          >
            {{ task.description }}
          </span>
      </div>
      
      <div 
        class="flex items-center shrink-0 flex-row-reverse transition-all duration-300"
        :class="[
          isSquareLayout ? 'w-full justify-between mt-auto pt-3 border-t border-slate-500/10' : 'mt-1 sm:mt-0',
          cardMode === 'micro' ? 'w-full justify-center pt-2 mt-1 border-t border-slate-500/10' : 'ml-auto justify-end'
        ]"
        :style="!isSquareLayout ? { gap: (activeStyle.taskTimerSize * 0.4) + 'px' } : {}"
      >
        <div 
          class="flex items-center flex-row-reverse justify-end"
          :style="{ gap: (activeStyle.taskTimerSize * 0.4) + 'px' }"
        >
          <!-- 1. Play/Stop Task (Timer) -->
          <button 
            v-if="!task.completed"
            class="transition-all flex items-center justify-center border" 
            :class="timerButtonClasses"
            :style="{
              width: (activeStyle.taskTimerSize * 1.8) + 'px',
              height: (activeStyle.taskTimerSize * 1.8) + 'px',
              borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px',
              backgroundColor: taskColors.color ? `${taskColors.color}1A` : '',
              color: taskColors.color ? taskColors.color : '',
              borderColor: taskColors.color ? `${taskColors.color}33` : ''
            }"
            @click.stop="emit('toggle-timer', task)" 
            data-tip="Iniciar/Parar Cronômetro"
          >
            <Square v-if="task.isRunning" :size="activeStyle.taskTimerSize - 1" class="animate-pulse" />
            <Play v-else :size="activeStyle.taskTimerSize - 1" />
          </button>

          <!-- 2. Menu Trigger Icon -->
          <button 
            class="transition-all flex items-center justify-center text-app-muted hover:text-indigo-500 hover:bg-slate-500/10"
            :style="{
              width: (activeStyle.taskTimerSize * 1.8) + 'px',
              height: (activeStyle.taskTimerSize * 1.8) + 'px',
              borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px'
            }"
            @click.stop="handleSelect($event)"
            data-tip="Opções da Tarefa"
          >
            <MoreVertical :size="activeStyle.taskTimerSize" />
          </button>

          <!-- 3. Indicadores -->
          <div class="flex items-center flex-row-reverse" :style="{ gap: (activeStyle.taskTimerSize * 0.4) + 'px' }">
            
            <div v-if="visibleIcons.includes('git')"
              class="transition-all flex items-center justify-center border cursor-pointer hover:brightness-110 active:scale-95" 
              :class="timerButtonClasses"
              :style="{
                width: (activeStyle.taskTimerSize * 1.8) + 'px',
                height: (activeStyle.taskTimerSize * 1.8) + 'px',
                borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px',
                backgroundColor: taskColors.color ? `${taskColors.color}1A` : '',
                color: taskColors.color ? taskColors.color : '',
                borderColor: taskColors.color ? `${taskColors.color}33` : ''
              }"
              @click.stop="handleGitAction"
              data-tip="Possui Branch Remota (Clique p/ abrir ou ver)">
              <GitBranch v-if="!isCreatingBranch" :size="activeStyle.taskTimerSize - 1" />
              <div v-else class="rounded-full border border-purple-500 border-t-transparent animate-spin" :style="{ width: (activeStyle.taskTimerSize - 4) + 'px', height: (activeStyle.taskTimerSize - 4) + 'px' }"></div>
            </div>
            
            <div v-if="visibleIcons.includes('msg')"
              class="transition-all flex items-center justify-center border cursor-pointer hover:brightness-110 active:scale-95" 
              :class="timerButtonClasses"
              :style="{
                width: (activeStyle.taskTimerSize * 1.8) + 'px',
                height: (activeStyle.taskTimerSize * 1.8) + 'px',
                borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px',
                backgroundColor: taskColors.color ? `${taskColors.color}1A` : '',
                color: taskColors.color ? taskColors.color : '',
                borderColor: taskColors.color ? `${taskColors.color}33` : ''
              }"
              @click.stop="handleAction('moreInfo', 'Observações', 'text')"
              data-tip="Observações (Clique p/ ler ou editar)">
              <MessageSquare :size="activeStyle.taskTimerSize - 1" />
            </div>
            
            <div v-if="visibleIcons.includes('db')"
              class="transition-all flex items-center justify-center border cursor-pointer hover:brightness-110 active:scale-95" 
              :class="timerButtonClasses"
              :style="{
                width: (activeStyle.taskTimerSize * 1.8) + 'px',
                height: (activeStyle.taskTimerSize * 1.8) + 'px',
                borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px',
                backgroundColor: taskColors.color ? `${taskColors.color}1A` : '',
                color: taskColors.color ? taskColors.color : '',
                borderColor: taskColors.color ? `${taskColors.color}33` : ''
              }"
              @click.stop="handleAction('dbScripts', 'Scripts SQL', 'text')"
              data-tip="Scripts SQL (Clique p/ ler ou editar)">
              <Database :size="activeStyle.taskTimerSize - 1" />
            </div>

            <div v-if="visibleIcons.includes('link')"
              class="transition-all flex items-center justify-center border cursor-pointer hover:brightness-110 active:scale-95" 
              :class="timerButtonClasses"
              :style="{
                width: (activeStyle.taskTimerSize * 1.8) + 'px',
                height: (activeStyle.taskTimerSize * 1.8) + 'px',
                borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px',
                backgroundColor: taskColors.color ? `${taskColors.color}1A` : '',
                color: taskColors.color ? taskColors.color : '',
                borderColor: taskColors.color ? `${taskColors.color}33` : ''
              }"
              @click.stop="handleAction('taskUrl', 'Link da Tarefa', 'url')"
              data-tip="Link (Clique p/ abrir no navegador)">
              <ExternalLink :size="activeStyle.taskTimerSize - 1" />
            </div>
          </div>
        </div>

        <!-- Contador (Tempo) -->
        <span 
          class="font-bold leading-none cursor-pointer transition-colors hover:opacity-80 whitespace-nowrap"
          :class="[
            task.isRunning ? 'animate-pulse' : ''
          ]"
          :style="{ 
            fontSize: (cardMode === 'micro' ? activeStyle.taskTimerSize - 2 : activeStyle.taskTimerSize) + 'px',
            color: task.isRunning ? (taskColors.color || '#ef4444') : currentTextColor,
            marginRight: (activeStyle.taskTimerSize * 0.2) + 'px'
          }"
          data-tip="Clique para ajustar o tempo"
          @click.stop="handleAdjustTime"
        >
          {{ formattedTime }}
        </span>
      </div>
    </div>

    <!-- Selection Indicator Dot -->
    <div 
      v-if="taskStore.selectedTask?.id === task.id" 
      class="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-bounce border border-white/20"
      :class="!taskColors.color ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] dark:border-indigo-400/50' : 'dark:border-white/20'"
      :style="taskColors.color ? {
        backgroundColor: taskColors.color,
        boxShadow: `0 0 10px ${taskColors.color}80`
      } : {}"
    >
    </div>
  </div>
</template>

<style scoped>
@keyframes presetPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 15px 4px rgba(99, 102, 241, 0.3);
  }
  100% {
    transform: scale(1);
  }
}
.animate-preset-pulse {
  animation: presetPulse 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10;
}
</style>

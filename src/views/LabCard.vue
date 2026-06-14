<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import TaskCard from '../components/TaskCard.vue';
import ColorWheelPicker from '../components/ColorWheelPicker.vue';
import { ArrowLeft, Beaker } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { hexToRgba } from '../utils/colors';

const router = useRouter();
const taskStyleStore = useTaskStyleStore();

const containerWidth = ref(400);
const harmonyRule = ref('analogous');

// Paleta reativa (Adobe Style)
const palette = ref([
  { h: 210, s: 80, l: 50, hex: '#1e88e5', css: 'hsl(210, 80%, 50%)' }
]);

// Cores congeladas aplicadas no card
const appliedTitleHex = ref('#1e88e5');
const appliedBgHex = ref('#121c24');
const appliedTextHex = ref('#1e88e5');

const mockTask = ref({
  id: 'TASK-LAB',
  title: 'LAB-999',
  description: 'Esta é uma tarefa de laboratório sendo testada com a roda de cores interativa HSL. Altere a cor do título e do fundo nas rodas de cores ao lado.',
  status: 'In Progress',
  priority: 'Alta',
  totalTimeSpent: 3661000, // 1h 1m 1s
  isRunning: false,
  completed: false,
  styleId: '_lab_preset', // Vincula a tarefa ao preset dinâmico de laboratório
  branchUrl: 'https://gitlab.com/test/branch',
  githubBranchUrl: 'https://github.com/test/branch',
  moreInfo: 'Informações adicionais para testar o cartão',
  dbScripts: 'SELECT * FROM tass;',
  taskUrl: 'https://github.com',
  devUrl: 1,
  homologUrl: 1,
  prodUrl: 1,
  _labOverride: true
});

// Atualiza as cores do preset temporário no store
const updateLabPreset = () => {
  const preset = taskStyleStore.styles.find(s => s.id === '_lab_preset');
  if (preset) {
    preset.colors.color = appliedTitleHex.value;
    preset.colors.bgColor = appliedBgHex.value;
    preset.colors.textLightColor = appliedTextHex.value;
    preset.colors.textDarkColor = appliedTextHex.value;
  }
};

onMounted(async () => {
  // Carrega os estilos se ainda não foram carregados
  if (taskStyleStore.styles.length === 0) {
    await taskStyleStore.loadStyles();
  }

  // Registra o preset dinâmico fictício do laboratório
  const exists = taskStyleStore.styles.some(s => s.id === '_lab_preset');
  if (!exists) {
    taskStyleStore.styles.push({
      id: '_lab_preset',
      name: 'Lab Preset',
      styles: {
        cardPadding: 16,
        taskNumberSize: 12,
        taskDescriptionSize: 14,
        taskTimerSize: 14,
        taskMinHeight: 100,
        taskMaxWidth: 0,
        taskVerticalAlign: 'center'
      },
      colors: {
        color: '#1e88e5',
        bgColor: '#121c24',
        textLightColor: '#1e88e5',
        textDarkColor: '#1e88e5'
      }
    });
  }
  updateLabPreset();
});

onUnmounted(() => {
  // Limpa o preset dinâmico fictício do laboratório ao sair do componente
  taskStyleStore.styles = taskStyleStore.styles.filter(s => s.id !== '_lab_preset');
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 flex flex-col items-center">
    <!-- Header -->
    <div class="w-full max-w-6xl flex items-center justify-between mb-8">
      <button @click="router.push('/')" class="btn btn-secondary flex items-center gap-2 px-4 py-2 glass-panel border-indigo-500/20 active:scale-95 transition-all text-xs font-bold">
        <ArrowLeft class="w-4 h-4" /> Voltar ao Kanban
      </button>
      <div class="flex items-center gap-3">
        <Beaker class="w-6 h-6 text-indigo-500" />
        <h1 class="text-xl font-black uppercase tracking-tight">Laboratório de Cores</h1>
      </div>
    </div>

    <!-- Container do Laboratório -->
    <div class="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Coluna da Esquerda: Seletores Cromáticos Livres -->
      <div class="lg:col-span-5 flex flex-col gap-6 items-center w-full justify-center">
        
        <!-- Controle de Harmonia -->
        <div class="w-full max-w-[260px]">
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Regra de Harmonia (Adobe Style)</label>
          <select v-model="harmonyRule" class="app-input w-full px-3 py-2 text-xs">
            <option value="analogous">Análoga</option>
            <option value="monochromatic">Monocromática</option>
            <option value="triad">Tríade</option>
            <option value="complementary">Complementar</option>
            <option value="split-complementary">Complementar Dividida</option>
            <option value="square">Quadrado</option>
          </select>
        </div>

        <!-- Roda de Harmonia -->
        <ColorWheelPicker 
          label="Paleta de Cores Gerada"
          v-model="palette"
          :rule="harmonyRule"
        />

        <!-- Blocos de Aplicação da Paleta -->
        <div class="flex flex-col gap-5 w-full max-w-[260px] bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 glass-panel">
          
          <!-- Bloco 1: Título e Ícones -->
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block border-b border-slate-500/10 pb-1">1. Título e Ícones</span>
            <div class="flex gap-2 justify-center">
              <button 
                v-for="(color, idx) in palette" :key="'title-swatch-'+idx"
                class="w-7 h-7 rounded-full border-2 shadow-sm transition-transform hover:scale-110 active:scale-95"
                :class="appliedTitleHex === color.hex ? 'border-indigo-500 scale-110' : 'border-white/20'"
                :style="{ backgroundColor: color.css }"
                :title="'Aplicar ao Título: ' + color.hex"
                @click="appliedTitleHex = color.hex; updateLabPreset()"
              ></button>
            </div>
          </div>

          <!-- Bloco 2: Fundo -->
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block border-b border-slate-500/10 pb-1">2. Fundo do Card</span>
            <div class="flex gap-2 justify-center">
              <button 
                v-for="(color, idx) in palette" :key="'bg-swatch-'+idx"
                class="w-7 h-7 rounded-full border-2 shadow-sm transition-transform hover:scale-110 active:scale-95"
                :class="appliedBgHex === color.hex ? 'border-indigo-500 scale-110' : 'border-white/20'"
                :style="{ backgroundColor: color.css }"
                :title="'Aplicar ao Fundo: ' + color.hex"
                @click="appliedBgHex = color.hex; updateLabPreset()"
              ></button>
            </div>
          </div>

          <!-- Bloco 3: Texto -->
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block border-b border-slate-500/10 pb-1">3. Texto / Descrição</span>
            <div class="flex gap-2 justify-center">
              <button 
                v-for="(color, idx) in palette" :key="'text-swatch-'+idx"
                class="w-7 h-7 rounded-full border-2 shadow-sm transition-transform hover:scale-110 active:scale-95"
                :class="appliedTextHex === color.hex ? 'border-indigo-500 scale-110' : 'border-white/20'"
                :style="{ backgroundColor: color.css }"
                :title="'Aplicar ao Texto: ' + color.hex"
                @click="appliedTextHex = color.hex; updateLabPreset()"
              ></button>
            </div>
          </div>

        </div>
      </div>

      <!-- Coluna da Direita: Arena de Preview do TaskCard -->
      <div class="lg:col-span-7 flex flex-col gap-6 w-full">
        <!-- Controle de Largura -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 glass-panel border-indigo-500/10">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-500">Controle de Largura do Cartão</h3>
            <div class="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg font-black font-mono text-xs">
              {{ containerWidth }}px
            </div>
          </div>
          <input 
            type="range" 
            v-model="containerWidth" 
            min="164" 
            max="600" 
            step="1" 
            class="w-full app-range" 
          />
        </div>

        <!-- Arena de Preview -->
        <div class="relative w-full flex justify-center bg-slate-200 dark:bg-slate-950 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 overflow-hidden min-h-[300px]">
          <!-- Grid de Fundo -->
          <div class="absolute inset-0" style="background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px); background-size: 20px 20px; opacity: 0.2"></div>
          
          <!-- Container Redimensionável -->
          <div 
            class="relative transition-all duration-75 ease-linear border-x-2 border-indigo-500/30 flex flex-col items-stretch justify-center"
            :style="{ width: containerWidth + 'px' }"
          >
            <TaskCard :task="mockTask" />
            
            <!-- Réguas Visuais -->
            <div class="absolute -top-6 left-0 text-[9px] font-black text-indigo-500">0</div>
            <div class="absolute -top-6 right-0 text-[9px] font-black text-indigo-500">{{ containerWidth }}px</div>
          </div>
        </div>

        <!-- Detalhes do JSON de Cores Gerado -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 glass-panel border-indigo-500/10 text-xs">
          <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-500/10 pb-2">Valores Gerados (JSON do Preset)</h3>
          <pre class="bg-slate-900/50 dark:bg-slate-950/50 p-4 rounded-xl font-mono text-[11px] text-indigo-500 dark:text-indigo-400 overflow-x-auto">
{
  "colors": {
    "color": "{{ appliedTitleHex }}",
    "bgColor": "{{ appliedBgHex }}",
    "textLightColor": "{{ appliedTextHex }}",
    "textDarkColor": "{{ appliedTextHex }}"
  }
}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(var(--app-glass-blur));
  background-color: rgba(var(--app-bg-raw), var(--app-card-opacity));
}
</style>

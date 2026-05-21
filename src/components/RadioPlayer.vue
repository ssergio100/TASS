<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, Plus, Trash2, Headphones, Star,
  ChevronDown, ChevronUp, X, Pencil
} from 'lucide-vue-next';
import { useRadioStore } from '../stores/radioStore';
import { useSettingsStore } from '../stores/settingsStore';
import RadioModal from './RadioModal.vue';
import BaseModal from './BaseModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const radioStore = useRadioStore();
const settings = useSettingsStore();

onMounted(() => {
  radioStore.init();
});

const showList = ref(false);
const showAddModal = ref(false);
const radioToEdit = ref(null);

const togglePlay = () => radioStore.toggle();

const openEditModal = (radio) => {
  radioToEdit.value = radio;
  showAddModal.value = true;
};

const handleCloseModal = () => {
  showAddModal.value = false;
  radioToEdit.value = null;
};
</script>

<template>
  <BaseModal
    v-if="isOpen"
    maxWidth="max-w-lg"
    layout="standard"
    smallHeader
    title="Ouvir Rádio"
    :icon="Headphones"
    :closeOnClickOutside="false"
    :isWindow="true"
    @close="emit('close')"
  >
    <!-- Área Superior: Player em Destaque -->
    <div 
      class="bg-amber-500/10 border border-amber-500/20 p-4 flex flex-col gap-6"
      :style="{ borderRadius: 'var(--app-card-radius)' }"
    >
      <div class="flex flex-col md:flex-row items-center gap-4">
        <!-- Informações da Rádio Atual -->
        <div class="flex-1 text-center md:text-left space-y-2 min-w-0">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">
            <template v-if="radioStore.isLoading">
              <span class="animate-pulse">Carregando Stream...</span>
            </template>
            <template v-else-if="radioStore.isPlaying">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Transmissão Ao Vivo
            </template>
            <template v-else>
              Em Pausa
            </template>
          </div>
          
          <h2 class="text-xl font-black text-app-main tracking-tighter truncate">
            {{ radioStore.currentRadio ? radioStore.currentRadio.name : 'Nenhuma rádio selecionada' }}
          </h2>
        </div>

        <!-- Controles de Reprodução Massivos -->
        <div class="flex items-center gap-3 shrink-0">
          <button 
            @click="radioStore.prev" 
            class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:scale-105 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all active:scale-95 border border-slate-100 dark:border-white/5"
            :style="{ borderRadius: 'var(--app-input-radius)' }"
          >
            <SkipBack class="w-4 h-4 fill-current" />
          </button>
          
          <button 
            @click="togglePlay" 
            class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/40 hover:scale-105 transition-all active:scale-95"
            :style="{ borderRadius: 'var(--app-input-radius)' }"
          >
            <Pause v-if="radioStore.isPlaying" class="w-5 h-5 fill-current" />
            <Play v-else class="w-5 h-5 fill-current ml-1" />
          </button>

          <button 
            @click="radioStore.next" 
            class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:scale-105 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all active:scale-95 border border-slate-100 dark:border-white/5"
            :style="{ borderRadius: 'var(--app-input-radius)' }"
          >
            <SkipForward class="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      <!-- Controle de Volume Unificado (Full Width) -->
      <div class="flex items-center gap-4 w-full px-1">
        <button @click="radioStore.setVolume(radioStore.volume === 0 ? 0.5 : 0)" class="text-amber-500/70 hover:text-amber-500 transition-colors">
          <VolumeX v-if="radioStore.volume === 0" class="w-4 h-4" />
          <Volume2 v-else class="w-4 h-4" />
        </button>
        <input 
          type="range" min="0" max="1" step="0.01" 
          :value="radioStore.volume"
          @input="e => radioStore.setVolume(parseFloat(e.target.value))"
          class="flex-1 app-range h-1.5"
        />
        <span class="text-[10px] font-black text-amber-600/60 dark:text-amber-400/60 w-8 text-right tabular-nums">
          {{ Math.round(radioStore.volume * 100) }}%
        </span>
      </div>
    </div>

    <!-- Lista de Rádios (Corpo Principal) -->
    <div class="space-y-3 mt-4">
      <button 
        @click="showList = !showList"
        class="w-full flex items-center justify-between px-2 py-1 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
        :style="{ borderRadius: 'var(--app-input-radius)' }"
      >
        <div class="flex items-center gap-2">
          <ChevronDown v-if="showList" class="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          <ChevronUp v-else class="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          <h3 class="text-xs font-black text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 uppercase tracking-widest transition-colors">Estações Disponíveis</h3>
        </div>
        <span 
          class="text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-0.5 group-hover:bg-amber-500/10 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
          :style="{ borderRadius: 'calc(var(--app-input-radius) * 0.7)' }"
        >
          {{ radioStore.radios.length }} Rádios
        </span>
      </button>

      <div v-show="showList" class="max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
        <div class="grid grid-cols-1 gap-1.5">
          <div 
            v-for="radio in radioStore.radios" :key="radio.id"
            class="flex items-center justify-between p-3 border transition-all group"
            :class="radioStore.currentRadioId === radio.id 
            ? 'border-amber-500 shadow-sm' 
            : 'border-slate-100 dark:border-white/5 hover:bg-app-surface hover:border-slate-200 dark:hover:border-white/10'"
            :style="{ 
              borderRadius: 'var(--app-input-radius)',
              backgroundColor: radioStore.currentRadioId === radio.id 
                ? 'rgba(245, 158, 11, 0.1)' 
                : `rgba(var(--app-bg-raw), var(--app-card-opacity))`
            }"
          >
            <!-- Clicar na área esquerda toca a rádio -->
            <div 
              class="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
              @click="radioStore.changeStation(radio.id)"
            >
              <div 
                class="w-8 h-8 flex items-center justify-center transition-colors shrink-0"
                :class="radioStore.currentRadioId === radio.id ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-amber-500'"
                :style="{ borderRadius: 'calc(var(--app-input-radius) * 0.8)' }"
              >
                <Headphones v-if="radioStore.currentRadioId !== radio.id" class="w-3.5 h-3.5" />
                <!-- Mini equalizador se estiver tocando -->
                <div v-else-if="radioStore.isPlaying" class="flex items-end justify-center gap-[1px] h-3">
                  <span class="w-[3px] h-1.5 bg-white rounded-t-sm animate-[bounce_1s_infinite_0.1s]"></span>
                  <span class="w-[3px] h-3 bg-white rounded-t-sm animate-[bounce_1s_infinite_0.3s]"></span>
                  <span class="w-[3px] h-2 bg-white rounded-t-sm animate-[bounce_1s_infinite_0.5s]"></span>
                </div>
                <Play v-else class="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              
              <div class="min-w-0 pr-2">
                <span class="text-xs font-black text-app-main block truncate">{{ radio.name }}</span>
              </div>
            </div>

            <!-- Ações à direita (Estrelas e Excluir) -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="flex items-center gap-0.5">
                <Star 
                  v-for="i in 5" :key="i"
                  class="w-3.5 h-3.5 cursor-pointer transition-all hover:scale-125"
                  :class="i <= (radio.stars || 0) ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700 hover:text-amber-200'"
                  @click.stop="radioStore.rateRadio(radio.id, i)"
                />
              </div>

              <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  @click.stop="openEditModal(radio)" 
                  class="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all focus:opacity-100"
                  data-tip="Editar Rádio"
                >
                  <Pencil class="w-3 h-3" />
                </button>

                <button 
                  @click.stop="radioStore.deleteRadio(radio.id)" 
                  class="w-6 h-6 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-500/10 transition-all focus:opacity-100"
                  data-tip="Excluir Rádio"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer: Ação de Adicionar -->
      <button 
        v-if="showList"
        @click="showAddModal = true" 
        class="w-full py-4 mt-4 border-2 border-dashed border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-widest hover:bg-amber-500/5 hover:border-amber-500 transition-all flex items-center justify-center gap-2 active:scale-95"
        :style="{ borderRadius: 'var(--app-card-radius)' }"
      >
        <Plus class="w-4 h-4" /> Adicionar Nova Rádio
      </button>
    </div>
  </BaseModal>

  <!-- Modal Secundário para Cadastro -->
  <Teleport to="body">
    <RadioModal 
      v-if="showAddModal" 
      :radioToEdit="radioToEdit"
      @close="handleCloseModal" 
    />
  </Teleport>
</template>

<style scoped>
/* Range Slider Customizado para Âmbar */
.app-range::-webkit-slider-thumb {
  background: #f59e0b; /* amber-500 */
}
.app-range::-moz-range-thumb {
  background: #f59e0b;
}
</style>

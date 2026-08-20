<script setup>
import { ref, useAttrs, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { ChevronDown, Search, X } from 'lucide-vue-next';

defineOptions({
  inheritAttrs: false
});

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => [] 
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  iconColor: {
    type: String,
    default: 'text-indigo-500'
  },
  placeholder: {
    type: String,
    default: 'Selecione uma opção...'
  },
  error: {
    type: String,
    default: ''
  },
  searchable: {
    type: Boolean,
    default: false
  },
  searchPlaceholder: {
    type: String,
    default: 'Buscar...'
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Carregando...'
  },
  emptyMessage: {
    type: String,
    default: 'Nenhuma opção disponível'
  }
});

const emit = defineEmits(['update:modelValue', 'open']);
const attrs = useAttrs();

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref(null);
const dropdownStyle = ref({
  top: '0px',
  left: '0px',
  width: '0px'
});

// Função crucial: Calcula a posição do dropdown no body
const updatePosition = () => {
  if (containerRef.value && isOpen.value) {
    const trigger = containerRef.value.querySelector('.app-select-trigger');
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      dropdownStyle.value = {
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`
      };
    }
  }
};

const toggle = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    emit('open');
    nextTick(() => updatePosition());
  }
};

const selectOption = (option) => {
  emit('update:modelValue', option.value);
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    // Se o clique não foi no trigger nem no dropdown, fecha
    const dropdown = document.querySelector('.app-select-dropdown');
    if (dropdown && dropdown.contains(event.target)) return;
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // Captura scroll em qualquer container pai para manter posição
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});

const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue);
  return option ? option.label : props.modelValue;
});

const filteredOptions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter(o =>
    String(o.label || '').toLowerCase().includes(q) ||
    String(o.value || '').toLowerCase().includes(q)
  );
});
</script>

<template>
  <div class="space-y-1.5 w-full relative" ref="containerRef">
    <!-- LABEL & ÍCONE -->
    <div v-if="label" class="flex items-center gap-2 mb-1">
      <component 
        :is="icon" 
        v-if="icon" 
        class="w-3.5 h-3.5 transition-colors" 
        :class="error ? 'text-red-500' : iconColor" 
      />
      <label 
        class="text-[10px] font-black uppercase tracking-widest ml-1 transition-colors text-slate-500 dark:text-slate-400"
        :class="{ 'text-red-500': error }"
      >
        {{ label }}
      </label>
    </div>

    <!-- TRIGGER (O botão que abre o select) -->
    <div 
      @click="toggle"
      v-bind="attrs"
      class="app-select-trigger app-input px-4 py-3 shadow-sm transition-all cursor-pointer flex items-center justify-between group"
      :class="[
        error ? 'border-red-500/50 ring-1 ring-red-500/20' : '',
        isOpen ? 'ring-2 ring-indigo-500/40 border-indigo-500/50' : '',
        attrs.class
      ]"
    >
      <span 
        class="text-sm transition-colors"
        :class="selectedLabel ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'"
      >
        {{ selectedLabel || placeholder }}
      </span>
      <ChevronDown 
        class="w-4 h-4 text-slate-400 transition-transform duration-300"
        :class="{ 'rotate-180 text-indigo-500': isOpen }"
      />
    </div>

    <!-- DROPDOWN (Teleportado para o body para ignorar filtros de blur/overflow) -->
    <teleport to="body">
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-2"
      >
        <div 
          v-if="isOpen"
          class="app-select-dropdown fixed z-[99999] bg-white dark:bg-slate-900 border border-app-border-light shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/10"
          :style="{ 
            borderRadius: 'var(--app-card-radius)',
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width
          }"
        >
          <div v-if="searchable" class="sticky top-0 z-10 bg-white dark:bg-slate-900 px-3 pt-2 pb-2 border-b border-app-border-light">
            <div class="relative">
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="searchQuery"
                @click.stop
                type="text"
                :placeholder="searchPlaceholder"
                class="w-full app-input pl-9 pr-8 py-2 text-xs rounded-lg"
              />
              <button
                v-if="searchQuery"
                @click.stop="searchQuery = ''"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div v-if="loading" class="px-4 py-3 text-xs text-slate-400 text-center italic flex items-center justify-center gap-2">
            <span class="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></span>
            {{ loadingText }}
          </div>

          <template v-else>
            <div 
              v-for="option in filteredOptions" 
              :key="option.value"
              @click="selectOption(option)"
              class="px-4 py-2.5 text-sm font-medium cursor-pointer transition-all hover:bg-indigo-500/10 flex items-center justify-between"
              :class="modelValue === option.value ? 'text-indigo-500 bg-indigo-500/5 font-black' : 'text-slate-700 dark:text-slate-300'"
            >
              {{ option.label }}
              <div v-if="modelValue === option.value" class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
            </div>
            <div v-if="filteredOptions.length === 0" class="px-4 py-3 text-xs text-slate-400 text-center italic">
              {{ emptyMessage }}
            </div>
          </template>
        </div>
      </transition>
    </teleport>

    <!-- CAIXA DE ERRO -->
    <div 
      v-if="error" 
      class="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-2 border border-red-500/20 mt-1.5 animate-shake text-center"
      :style="{ borderRadius: 'var(--app-input-radius)' }"
    >
      {{ error }}
    </div>
  </div>
</template>

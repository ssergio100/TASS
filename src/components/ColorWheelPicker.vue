<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';

import { generateHarmony } from '../utils/colorHarmonies';

const props = defineProps({
  label: {
    type: String,
    default: 'Seletor de Cor'
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  rule: {
    type: String,
    default: 'analogous'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const hue = ref(props.modelValue?.[0]?.h ?? 210);
const saturation = ref(props.modelValue?.[0]?.s ?? 70);
const lightness = ref(props.modelValue?.[0]?.l ?? 50);

watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.length > 0 && newVal[0]) {
    hue.value = newVal[0].h;
    saturation.value = newVal[0].s;
    lightness.value = newVal[0].l;
  }
}, { deep: true });

watch(() => props.rule, () => {
  emitColor();
});

// Função matemática HSL para conversão para Hex
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const kVal = k(n);
    const color = l - a * Math.max(Math.min(kVal - 3, 9 - kVal, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const palette = computed(() => {
  const points = generateHarmony(hue.value, saturation.value, lightness.value, props.rule);
  return points.map(pt => ({
    h: pt.h,
    s: pt.s,
    l: pt.l,
    hex: hslToHex(pt.h, pt.s, pt.l),
    css: `hsl(${pt.h}, ${pt.s}%, ${pt.l}%)`
  }));
});

const hexColor = computed(() => palette.value[0]?.hex || '#000000');

// Emissão da paleta atualizada
const emitColor = () => {
  emit('update:modelValue', palette.value);
  emit('change', palette.value);
};

// Geometria da Roda de Cores (Diâmetro 150px)
const R_WHEEL = 75;
const R_TRACK = 55;

// Coordenadas cartesianas dos cursores
const paletteCoords = computed(() => {
  return palette.value.map(pt => {
    const angleRad = (pt.h * Math.PI) / 180;
    return {
      x: R_WHEEL + R_TRACK * Math.cos(angleRad),
      y: R_WHEEL + R_TRACK * Math.sin(angleRad),
      color: pt
    };
  });
});

// Arrasto do cursor único
const wheelRef = ref(null);
const isDragging = ref(false);

const handleCoordsUpdate = (clientX, clientY) => {
  if (!wheelRef.value) return;
  const rect = wheelRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  
  let angleRad = Math.atan2(dy, dx);
  let angleDeg = (angleRad * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  
  hue.value = Math.round(angleDeg);
  emitColor();
};

const onMouseDown = (e) => {
  isDragging.value = true;
  handleCoordsUpdate(e.clientX, e.clientY);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (e) => {
  if (isDragging.value) {
    handleCoordsUpdate(e.clientX, e.clientY);
  }
};

const onMouseUp = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
};

const onTouchStart = (e) => {
  isDragging.value = true;
  if (e.touches && e.touches[0]) {
    handleCoordsUpdate(e.touches[0].clientX, e.touches[0].clientY);
  }
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
};

const onTouchMove = (e) => {
  if (isDragging.value && e.touches && e.touches[0]) {
    e.preventDefault();
    handleCoordsUpdate(e.touches[0].clientX, e.touches[0].clientY);
  }
};

const onTouchEnd = () => {
  isDragging.value = false;
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
};

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
});

// Estilos dos degradês reativos nos Sliders
const saturationSliderStyle = computed(() => {
  return {
    background: `linear-gradient(to right, hsl(${hue.value}, 0%, ${lightness.value}%), hsl(${hue.value}, 100%, ${lightness.value}%))`
  };
});

const lightnessSliderStyle = computed(() => {
  return {
    background: `linear-gradient(to right, #000, hsl(${hue.value}, ${saturation.value}%, 50%), #fff)`
  };
});
</script>

<template>
  <div class="color-wheel-picker glass-panel !p-4 flex flex-col items-center select-none w-full max-w-[260px] border-indigo-500/10">
    <!-- Header -->
    <div class="w-full flex items-center justify-between mb-3 border-b border-slate-500/10 pb-2">
      <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{{ label }}</span>
      <span class="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-slate-500/10 text-indigo-500">{{ hexColor.toUpperCase() }}</span>
    </div>

    <!-- Roda Cromática -->
    <div 
      ref="wheelRef"
      class="relative w-[150px] h-[150px] cursor-crosshair touch-none mb-4"
      @mousedown="onMouseDown"
      @touchstart="onTouchStart"
    >
      <!-- Roda com conic-gradient iniciando em 90deg -->
      <div class="absolute inset-0 rounded-full conic-wheel shadow-md"></div>

      <!-- SVG das Linhas de Harmonia e Guias -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r="2" fill="rgba(255, 255, 255, 0.4)" />
        
        <line 
          v-for="(pt, idx) in paletteCoords" :key="'line-'+idx"
          :x1="75" 
          :y1="75" 
          :x2="pt.x" 
          :y2="pt.y" 
          stroke="rgba(255, 255, 255, 0.3)" 
          stroke-dasharray="3,3" 
          stroke-width="1.5" 
        />
      </svg>

      <!-- Cursores -->
      <div 
        v-for="(pt, idx) in paletteCoords" :key="'cursor-'+idx"
        class="absolute rounded-full border border-white shadow-[0_2px_6px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-75"
        :class="idx === 0 ? 'w-[16px] h-[16px] border-2 z-10' : 'w-[10px] h-[10px] border-white/60 z-0 opacity-80'"
        :style="{ 
          left: idx === 0 ? `${pt.x - 8}px` : `${pt.x - 5}px`, 
          top: idx === 0 ? `${pt.y - 8}px` : `${pt.y - 5}px`,
          backgroundColor: pt.color.css
        }"
      ></div>
    </div>

    <!-- Sliders Controles -->
    <div class="w-full flex flex-col gap-3">
      <!-- Saturation Control -->
      <div class="flex flex-col gap-1 w-full">
        <div class="flex justify-between text-[9px] font-bold text-slate-400">
          <span>Saturação</span>
          <span>{{ saturation }}%</span>
        </div>
        <input 
          type="range" 
          v-model="saturation" 
          @input="emitColor"
          min="0" 
          max="100" 
          class="w-full h-2 rounded-lg appearance-none cursor-pointer slider-track-custom"
          :style="saturationSliderStyle"
        />
      </div>

      <!-- Lightness Control -->
      <div class="flex flex-col gap-1 w-full">
        <div class="flex justify-between text-[9px] font-bold text-slate-400">
          <span>Luminosidade</span>
          <span>{{ lightness }}%</span>
        </div>
        <input 
          type="range" 
          v-model="lightness" 
          @input="emitColor"
          min="0" 
          max="100" 
          class="w-full h-2 rounded-lg appearance-none cursor-pointer slider-track-custom"
          :style="lightnessSliderStyle"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.conic-wheel {
  background: conic-gradient(from 90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  -webkit-mask-image: radial-gradient(circle, transparent 40%, black 41%);
  mask-image: radial-gradient(circle, transparent 40%, black 41%);
}

.slider-track-custom {
  outline: none;
  background-size: 100% 100%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.dark .slider-track-custom {
  border-color: rgba(255, 255, 255, 0.1);
}

.slider-track-custom::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 1.5px solid #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.1s;
}

.slider-track-custom::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}
</style>

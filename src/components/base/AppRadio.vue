<script setup>
defineProps({
  modelValue: [String, Number, Boolean],
  value: [String, Number, Boolean],
  label: String,
  name: String,
  ariaLabel: String
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <label class="flex items-center gap-2.5 cursor-pointer group">
    <div class="relative flex items-center justify-center shrink-0">
      <input 
        type="radio" 
        :name="name"
        :aria-label="ariaLabel || label"
        :checked="modelValue === value" 
        @change="emit('update:modelValue', value)"
        class="sr-only peer"
      />
      <div 
        class="w-4 h-4 bg-white dark:bg-white/5 border-2 border-app-border-light rounded-full transition-all peer-checked:border-indigo-600 group-hover:border-indigo-500/50"
      ></div>
      <div 
        class="absolute w-2 h-2 bg-indigo-600 rounded-full scale-0 transition-transform peer-checked:scale-100 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
      ></div>
    </div>
    <span v-if="label" class="text-xs font-bold text-slate-700 dark:text-slate-300 select-none whitespace-nowrap">{{ label }}</span>
  </label>
</template>

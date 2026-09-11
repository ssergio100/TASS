<script setup>
import { computed } from 'vue';
import draggable from 'vuedraggable';
import { GitBranch, GripVertical, Plus, Star, Trash2 } from 'lucide-vue-next';
import AppButton from './base/AppButton.vue';
import AppInput from './base/AppInput.vue';
import AppRadio from './base/AppRadio.vue';
import { createEnvironmentId } from '../utils/gitEnvironments.js';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  baseEnvironmentId: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:modelValue',
  'update:baseEnvironmentId'
]);

const environments = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});

const updateEnvironment = (id, field, value) => {
  const updated = props.modelValue.map(environment => (
    environment.id === id ? { ...environment, [field]: value } : environment
  ));
  emit('update:modelValue', updated);
};

const addEnvironment = () => {
  const id = createEnvironmentId();
  emit('update:modelValue', [
    ...props.modelValue,
    { id, branch: '', alias: '' }
  ]);

  if (!props.baseEnvironmentId) emit('update:baseEnvironmentId', id);
};

const removeEnvironment = (id) => {
  if (props.modelValue.length === 1 || id === props.baseEnvironmentId) return;
  emit('update:modelValue', props.modelValue.filter(environment => environment.id !== id));
};
</script>

<template>
  <section class="space-y-3 pt-4 mt-2 border-t border-app-border-light">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h4 class="text-[10px] font-black uppercase text-app-main tracking-widest flex items-center gap-2">
          <GitBranch class="w-3.5 h-3.5 text-indigo-500" />
          Ambientes e aliases
        </h4>
        <p class="text-[9px] text-app-muted mt-1">Branch, alias e origem padrão das novas branches.</p>
      </div>
      <AppButton data-test="add-environment" variant="outline" size="sm" :icon="Plus" @click="addEnvironment">
        Adicionar ambiente
      </AppButton>
    </div>

    <div
      v-if="error"
      class="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-[var(--app-input-radius)] text-[10px] font-bold"
      role="alert"
    >
      {{ error }}
    </div>

    <div class="border border-app-border-light rounded-[var(--app-card-radius)] overflow-hidden">
      <div class="hidden md:grid grid-cols-[28px_minmax(0,1.4fr)_minmax(0,1fr)_104px_34px] gap-2 items-center px-3 py-2 bg-app-surface text-[8px] font-black uppercase tracking-widest text-app-muted">
        <span></span>
        <span>Branch</span>
        <span>Alias</span>
        <span class="text-center">Base</span>
        <span></span>
      </div>

      <draggable
        v-model="environments"
        item-key="id"
        handle=".environment-drag-handle"
        class="divide-y divide-app-border-light max-h-80 overflow-y-auto custom-scrollbar"
      >
        <template #item="{ element: environment, index }">
          <div
            data-test="environment-row"
            class="grid grid-cols-1 md:grid-cols-[28px_minmax(0,1.4fr)_minmax(0,1fr)_104px_34px] gap-2 md:items-center px-3 py-2 bg-transparent hover:bg-app-surface transition-colors"
          >
            <button
              type="button"
              class="environment-drag-handle hidden md:flex items-center justify-center text-app-muted hover:text-indigo-500 cursor-grab active:cursor-grabbing"
              title="Reordenar ambiente"
            >
              <GripVertical class="w-3.5 h-3.5" />
            </button>

            <div class="min-w-0">
              <span class="md:hidden text-[8px] font-black uppercase tracking-widest text-app-muted">Branch {{ index + 1 }}</span>
              <AppInput
                :model-value="environment.branch"
                size="sm"
                placeholder="integration/client-a"
                class="font-mono"
                @update:model-value="updateEnvironment(environment.id, 'branch', $event)"
              />
            </div>

            <div class="min-w-0">
              <span class="md:hidden text-[8px] font-black uppercase tracking-widest text-app-muted">Alias</span>
              <AppInput
                :model-value="environment.alias"
                size="sm"
                placeholder="Integração Cliente A"
                @update:model-value="updateEnvironment(environment.id, 'alias', $event)"
              />
            </div>

            <div class="flex items-center md:justify-center gap-2 min-h-9">
              <AppRadio
                :model-value="baseEnvironmentId"
                :value="environment.id"
                :name="`${provider}-base-environment`"
                :aria-label="`Usar ${environment.alias || environment.branch || `ambiente ${index + 1}`} como branch base`"
                @update:model-value="$emit('update:baseEnvironmentId', $event)"
              />
              <span v-if="environment.id === baseEnvironmentId" class="text-[8px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                <Star class="w-3 h-3 fill-current" /> Base
              </span>
            </div>

            <button
              data-test="remove-environment"
              type="button"
              class="p-2 rounded-[var(--app-input-radius)] text-app-muted transition-all justify-self-end md:justify-self-center"
              :class="environment.id === baseEnvironmentId || modelValue.length === 1
                ? 'opacity-25 cursor-not-allowed'
                : 'hover:text-red-500 hover:bg-red-500/10'"
              :disabled="environment.id === baseEnvironmentId || modelValue.length === 1"
              :title="environment.id === baseEnvironmentId ? 'Escolha outra base antes de remover' : 'Remover cadastro do ambiente'"
              @click="removeEnvironment(environment.id)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </draggable>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { GitMerge, RefreshCw } from 'lucide-vue-next';
import AppButton from '../base/AppButton.vue';
import AppSelect from '../base/AppSelect.vue';

const props = defineProps({
  selectedBranches: {
    type: Array,
    required: true
  },
  branchesLoading: {
    type: Boolean,
    required: true
  },
  environments: {
    type: Array,
    required: true
  },
  targetEnvironmentId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:targetEnvironmentId',
  'list-all-branches',
  'merge-to-target',
  'bulk-delete'
]);

const environmentOptions = computed(() => props.environments.map(environment => ({
  value: environment.id,
  label: `${environment.alias} — ${environment.branch}`
})));

const selectedEnvironment = computed(() => (
  props.environments.find(environment => environment.id === props.targetEnvironmentId) || null
));

const requestMerge = () => {
  if (!selectedEnvironment.value || props.selectedBranches.length !== 1) return;
  emit('merge-to-target', selectedEnvironment.value);
};
</script>

<template>
  <div class="glass-section !p-3 w-full flex flex-col lg:flex-row lg:items-end justify-between gap-3">
    <AppButton
      variant="secondary"
      size="md"
      :icon="RefreshCw"
      :loading="branchesLoading"
      @click="$emit('list-all-branches')"
    >
      Listar branches
    </AppButton>

    <div class="flex flex-col sm:flex-row sm:items-end gap-2 lg:justify-end flex-1">
      <div v-if="selectedBranches.length === 1" class="w-full sm:w-72">
        <AppSelect
          :model-value="targetEnvironmentId"
          label="Ambiente de destino"
          :options="environmentOptions"
          size="sm"
          searchable
          search-placeholder="Buscar ambiente..."
          @update:model-value="$emit('update:targetEnvironmentId', $event)"
        />
      </div>

      <AppButton
        v-if="selectedBranches.length === 1"
        variant="primary"
        size="md"
        :icon="GitMerge"
        :disabled="!selectedEnvironment"
        @click="requestMerge"
      >
        Mesclar para o ambiente
      </AppButton>

      <AppButton
        v-if="selectedBranches.length >= 1"
        variant="danger"
        size="md"
        @click="$emit('bulk-delete')"
      >
        Excluir ({{ selectedBranches.length }})
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { X, Play, Square, Loader2, Headphones } from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';
import AppInput from './base/AppInput.vue';
import { useRadioStore } from '../stores/radioStore';
import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/notificationService';

const props = defineProps({
  radioToEdit: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const radioStore = useRadioStore();
const settings = useSettingsStore();

const radioName = ref('');
const radioUrl = ref('');
const errors = ref({
  name: '',
  url: '',
  general: ''
});

// Estado do Teste de URL
const isTesting = ref(false);
const isTestPlaying = ref(false);
const testAudio = ref(null);

onMounted(() => {
  if (props.radioToEdit) {
    radioName.value = props.radioToEdit.name;
    radioUrl.value = props.radioToEdit.url;
  }
});

onBeforeUnmount(() => {
  stopTest();
});

const stopTest = () => {
  if (testAudio.value) {
    const audio = testAudio.value;
    testAudio.value = null; // Invalida a referência antes de limpar para que o listener ignore o erro
    audio.pause();
    audio.src = '';
  }
  isTestPlaying.value = false;
  isTesting.value = false;
};

const handleTestUrl = () => {
  if (isTestPlaying.value) {
    stopTest();
    return;
  }

  errors.value.url = '';
  errors.value.general = '';
  
  if (!radioUrl.value.trim()) {
    errors.value.url = 'Insira uma URL para testar.';
    return;
  }

  if (!radioUrl.value.startsWith('http')) {
    errors.value.url = 'URL inválida.';
    return;
  }

  try {
    isTesting.value = true;
    testAudio.value = new Audio(radioUrl.value);
    testAudio.value.volume = radioStore.volume;

    testAudio.value.addEventListener('playing', () => {
      if (!testAudio.value) return;
      isTesting.value = false;
      isTestPlaying.value = true;
    });

    testAudio.value.addEventListener('error', () => {
      // Se testAudio.value for null, significa que paramos o teste intencionalmente
      if (!testAudio.value) return;
      
      isTesting.value = false;
      isTestPlaying.value = false;
      errors.value.url = 'Erro ao carregar URL de rádio.';
      notificationService.toast('URL de rádio inválida ou inacessível.', 'error');
      testAudio.value = null;
    });

    testAudio.value.play().catch(err => {
      console.error('Erro ao testar rádio:', err);
      // Ignora erro de interrupção intencional
      if (!testAudio.value) return;
      
      isTesting.value = false;
      errors.value.url = 'Erro ao iniciar reprodução.';
    });
  } catch (err) {
    isTesting.value = false;
    errors.value.url = 'Erro ao testar URL.';
  }
};

const handleSave = async () => {
  errors.value.name = '';
  errors.value.url = '';
  errors.value.general = '';
  
  let hasError = false;
  if (!radioName.value.trim()) {
    errors.value.name = 'Obrigatório';
    hasError = true;
  }
  if (!radioUrl.value.trim()) {
    errors.value.url = 'Obrigatório';
    hasError = true;
  }
  
  if (hasError) {
    errors.value.general = 'Preencha o nome e a URL da rádio.';
    return;
  }
  
  if (!radioUrl.value.startsWith('http')) {
    errors.value.url = 'A URL deve começar com http:// ou https://';
    errors.value.general = 'A URL deve começar com http:// ou https://';
    return;
  }

  stopTest();

  if (props.radioToEdit) {
    await radioStore.updateRadio(props.radioToEdit.id, {
      name: radioName.value,
      url: radioUrl.value
    });
  } else {
    await radioStore.addRadio({
      name: radioName.value,
      url: radioUrl.value
    });
  }
  
  emit('close');
};
</script>

<template>
  <BaseModal 
    maxWidth="max-w-md" 
    layout="standard"
    smallHeader
    :title="radioToEdit ? 'Editar Rádio' : 'Adicionar Rádio'"
    subtitle="Streaming de Áudio"
    :icon="Headphones"
    iconBgColor="#f59e0b"
    @close="emit('close')"
  >
    <!-- Corpo do Formulário -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between px-1">
        <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Nome da Rádio
        </label>
      </div>
      <AppInput 
        v-model="radioName" 
        placeholder="Ex: Jazz Lounge" 
        :error="errors.name"
        @update:modelValue="errors.name = ''; errors.general = ''"
      />
    </div>
    
    <div class="space-y-1.5">
      <div class="flex items-center justify-between px-1">
        <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          URL de Streaming (.mp3, .aac...)
        </label>
        
        <!-- Botão de Teste -->
        <button 
          @click="handleTestUrl"
          type="button"
          class="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 z-10"
          :class="[
            isTestPlaying 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
              : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400 dark:hover:text-white'
          ]"
          :disabled="isTesting"
        >
          <template v-if="isTesting">
            <Loader2 class="w-3 h-3 animate-spin" />
            <span>Conectando...</span>
          </template>
          <template v-else-if="isTestPlaying">
            <Square class="w-3 h-3 fill-current" />
            <span>Parar Teste</span>
          </template>
          <template v-else>
            <Play class="w-3 h-3 fill-current" />
            <span>Testar Link</span>
          </template>
        </button>
      </div>

      <AppInput 
        v-model="radioUrl" 
        type="url" 
        placeholder="https://..." 
        :error="errors.url"
        @update:modelValue="errors.url = ''; errors.general = ''"
      />
    </div>

    <div 
      v-if="errors.general" 
      class="text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake p-2 border border-red-500/20"
      :style="{ borderRadius: 'var(--app-input-radius)' }"
    >
      {{ errors.general }}
    </div>

    <!-- Footer Compacto -->
    <div class="flex justify-end items-center gap-2 pt-2">
      <button 
        @click="emit('close')" 
        class="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        Cancelar
      </button>
      <button 
        @click="handleSave" 
        class="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all active:scale-95"
        :style="{ borderRadius: 'var(--app-input-radius)' }"
      >
        {{ radioToEdit ? 'Atualizar' : 'Salvar Rádio' }}
      </button>
    </div>
  </BaseModal>
</template>

<style scoped>
</style>

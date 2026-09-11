<script setup>
/**
 * =========================================================================
 * COMPONENTE: AppInput
 * =========================================================================
 * Propósito: Padronizar o estilo e o comportamento de campos de texto,
 * URL, senhas e números no TASS, evitando repetição excessiva de HTML.
 * 
 * Este componente já inclui:
 * - Label padronizado (estilo Premium, fonte pequena, tracking-widest)
 * - Suporte a ícones nativos do LucideVue
 * - Tratamento automático de estado de ERRO (borda vermelha + mensagem com animação)
 * - Repasse automático de atributos (placeholders, type, maxlength, etc)
 * 
 * USO EXEMPLO:
 * <AppInput 
 *   v-model="tarefa.titulo"
 *   label="Título da Tarefa"
 *   :icon="TypeIcon"
 *   icon-color="text-indigo-500"
 *   :error="errors.titulo"
 *   placeholder="Digite aqui..."
 * />
 * =========================================================================
 */
defineOptions({
  // Importante: Impede que as classes e atributos passados pelo pai
  // (ex: class="font-mono", placeholder="...") sejam aplicados na div wrapper.
  inheritAttrs: false
});

defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function], // Componente Lucide
    default: null
  },
  iconColor: {
    type: String,
    default: 'text-indigo-500' // Cor padrão do ícone se não houver erro
  },
  error: {
    type: String,
    default: '' // Se preenchido, ativa o estado de erro (Shake, borda vermelha)
  },
  type: {
    type: String,
    default: 'text' // text, url, password, number, etc.
  },
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md'].includes(value)
  },
  labelColor: {
    type: String,
    default: 'text-slate-500 dark:text-slate-400' // Cor do texto do label
  }
});

const emit = defineEmits(['update:modelValue']);

// O $attrs no template nos permite pegar tudo que sobrou (classes, placeholders, disabled)
// e jogar explicitamente dentro do elemento <input>.
</script>

<template>
  <div class="space-y-1.5 w-full">
    <!-- LABEL & ÍCONE -->
    <div v-if="label" class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-2">
        <!-- Ícone injetado dinamicamente -->
        <component 
          :is="icon" 
          v-if="icon" 
          class="w-3.5 h-3.5 transition-colors" 
          :class="error ? 'text-red-500' : iconColor" 
        />
        <!-- Rótulo -->
        <label 
          class="text-[10px] font-black uppercase tracking-widest ml-1 transition-colors"
          :class="error ? 'text-red-500' : labelColor"
        >
          {{ label }}
        </label>
      </div>
      <!-- Slot para elementos à direita do label (ex: dots de status) -->
      <slot name="label-right"></slot>
    </div>

    <!-- CAMPO DE INPUT -->
    <!-- 
      A classe 'app-input' (definida em style.css) cuida das cores de fundo, 
      foco global (ring) e bordas, mas aqui nós injetamos o estado de erro 
      e repassamos os atributos e classes locais ($attrs.class).
    -->
    <input 
      :type="type"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      v-bind="$attrs"
      class="app-input shadow-sm transition-all"
      :class="[
        size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-3',
        error ? 'border-red-500/50 ring-1 ring-red-500/20' : '',
        $attrs.class // Permite que o pai injete classes (ex: font-mono)
      ]"
    />

    <!-- CAIXA DE ERRO -->
    <!-- Aparece apenas se a prop 'error' tiver algum texto -->
    <div 
      v-if="error" 
      class="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-2 border border-red-500/20 mt-1.5 animate-shake text-center"
      :style="{ borderRadius: 'var(--app-input-radius)' }"
    >
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos do componente podem vir aqui, se necessário */
</style>

<script setup>
import { 
  AlertTriangle, CheckCircle, Info, XCircle, X, Copy 
} from 'lucide-vue-next';
import { ref, watch, nextTick } from 'vue';
import { useModalStore } from '../stores/modalStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useClipboard } from '@vueuse/core';

const modalStore = useModalStore();
const { copy, copied } = useClipboard();

const handleCopy = () => {
  if (modalStore.promptValue) {
    copy(modalStore.promptValue);
  }
};
const settings = useSettingsStore();
const inputRef = ref(null);

const icons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle
};

const iconColors = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  error: 'text-rose-500',
  success: 'text-emerald-500'
};

const iconBgColors = {
  info: 'bg-blue-500/10',
  warning: 'bg-amber-500/10',
  error: 'bg-rose-500/10',
  success: 'bg-emerald-500/10'
};

const primaryButtonClasses = {
  info: 'bg-indigo-600 hover:bg-indigo-500',
  warning: 'bg-amber-600 hover:bg-amber-500',
  error: 'bg-red-600 hover:bg-red-500',
  success: 'bg-emerald-600 hover:bg-emerald-500'
};

// Auto-focus logic
watch(() => modalStore.isOpen, (newVal) => {
  if (newVal && modalStore.isPrompt) {
    nextTick(() => {
      if (inputRef.value) inputRef.value.focus();
    });
  }
});
</script>

<template>
  <!-- Backdrop e Blur (Entrada Imediata) -->
  <transition
    appear
    enter-active-class="ease-out duration-75"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="modalStore.isOpen"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[10000]"
      @click="modalStore.handleCancel"
    ></div>
  </transition>

  <!-- Modal Content (Entrada Suave) -->
  <transition
    appear
    enter-active-class="ease-out duration-300"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <div 
      v-if="modalStore.isOpen" 
      class="fixed inset-0 z-[10001] flex min-h-full items-center justify-center p-4 text-center sm:p-0 pointer-events-none" 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        class="relative transform overflow-hidden rounded-xl bg-app-solid text-center shadow-2xl transition-all sm:my-8 sm:w-full border border-white/5 pointer-events-auto"
        :class="modalStore.promptType === 'textarea' ? 'sm:max-w-3xl' : 'sm:max-w-lg'"
        @click.stop
      >
        <!-- Content Area (Matches Example Proportions) -->
            <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="flex flex-col items-center">
                <!-- Center Icon -->
                <div 
                  class="flex size-12 shrink-0 items-center justify-center rounded-full mb-4"
                  :class="iconBgColors[modalStore.type]"
                >
                  <component :is="icons[modalStore.type]" class="size-6" :class="iconColors[modalStore.type]" aria-hidden="true" />
                </div>

                <!-- Center Text Content -->
                <div class="w-full">
                  <h3 class="text-base font-semibold text-slate-900 dark:text-white" id="modal-title">
                    {{ modalStore.title }}
                  </h3>
                  <div v-if="modalStore.message" class="mt-2">
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      {{ modalStore.message }}
                    </p>
                  </div>

                  <!-- Centered Prompt Input -->
                  <div v-if="modalStore.isPrompt" class="mt-4">
                    <textarea
                      v-if="modalStore.promptType === 'textarea'"
                      ref="inputRef"
                      v-model="modalStore.promptValue"
                      :placeholder="modalStore.promptPlaceholder"
                      class="app-input px-4 py-3 shadow-sm transition-all text-left min-h-[120px] resize-y placeholder:text-slate-500"
                      @keydown.enter.ctrl="modalStore.handleConfirm"
                    ></textarea>
                    <input
                      v-else
                      ref="inputRef"
                      type="text"
                      v-model="modalStore.promptValue"
                      :placeholder="modalStore.promptPlaceholder"
                      class="app-input px-4 py-3 shadow-sm transition-all text-center placeholder:text-slate-500"
                      @keydown.enter="modalStore.handleConfirm"
                      @keydown.esc="modalStore.handleCancel"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Area (Matches Example Exactly) -->
            <div class="bg-app-surface px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
              <button 
                type="button" 
                class="inline-flex w-full justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 sm:w-auto"
                :class="primaryButtonClasses[modalStore.type]"
                @click="modalStore.handleConfirm"
              >
                {{ modalStore.confirmText }}
              </button>

              <button 
                v-if="modalStore.denyText"
                type="button" 
                class="mt-3 sm:mt-0 inline-flex w-full justify-center rounded-xl px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/5 transition-all active:scale-95 sm:w-auto border border-rose-500/10"
                @click="modalStore.isPrompt ? modalStore.clearPrompt() : modalStore.handleDeny()"
              >
                {{ modalStore.denyText }}
              </button>
              
              <button 
                v-if="modalStore.cancelText"
                type="button" 
                class="mt-3 sm:mt-0 inline-flex w-full justify-center rounded-xl bg-white dark:bg-white/5 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 sm:w-auto border border-app-border-light"
                @click="modalStore.handleCancel"
              >
                {{ modalStore.cancelText }}
              </button>

              <button 
                v-if="modalStore.isPrompt && modalStore.promptType === 'textarea'"
                type="button" 
                class="mt-3 sm:mt-0 sm:mr-auto inline-flex w-full justify-center items-center rounded-xl bg-white dark:bg-white/5 px-3 py-2 text-sm font-semibold text-blue-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 sm:w-auto border border-app-border-light"
                @click="handleCopy"
              >
                <component :is="copied ? CheckCircle : Copy" class="size-4 mr-2" />
                {{ copied ? 'Copiado!' : 'Copiar' }}
              </button>
            </div>
          </div>
    </div>
  </transition>
</template>

<style scoped>
/* Transição suave para o fundo */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

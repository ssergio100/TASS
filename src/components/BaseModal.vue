<script setup>
import { X } from 'lucide-vue-next';
import { useModalDrag } from '../composables/useModalDrag';
import { useSettingsStore } from '../stores/settingsStore';

const settings = useSettingsStore();

/**
 * Props para o BaseModal
 * @property {string} title - Título principal do modal
 * @property {string} subtitle - Subtítulo (opcional)
 * @property {Object|Function} icon - Ícone Lucide (opcional)
 * @property {string} layout - 'standard' (com header/footer padrão) ou 'custom' (total liberdade)
 * @property {boolean} showClose - Exibe o botão X no canto superior
 * @property {boolean} closeOnClickOutside - Fecha ao clicar na área vazia do fundo
 * @property {boolean} isWindow - MODO JANELA: Remove o bloqueio de cliques no fundo e o escurecimento, permitindo interagir com o resto do app.
 * @property {string} maxWidth - Classe Tailwind de largura máxima (ex: max-w-lg)
 * @property {string} customClass - Classes CSS adicionais para a section
 * @property {boolean} animate - Ativa animação de entrada (scaleIn)
 * @property {boolean} hideHeader - Esconde o header completamente
 * @property {string} okText - Texto do botão de ação primária (ativa footer padrão)
 * @property {string} cancelText - Texto do botão de ação secundária (ativa footer padrão)
 * @property {boolean} okLoading - Estado de carregamento do botão primário
 */
const props = defineProps({
  title: String,
  subtitle: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  iconBgColor: { type: String, default: '' },
  layout: { type: String, default: 'standard', validator: v => ['standard', 'custom', 'sidebar'].includes(v) },
  showClose: { type: Boolean, default: true },
  closeOnClickOutside: { type: Boolean, default: true },
  isWindow: { type: Boolean, default: false },
  maxWidth: { type: String, default: 'max-w-2xl' },
  customClass: { type: String, default: '' },
  animate: { type: Boolean, default: true },
  hideHeader: { type: Boolean, default: false },
  smallHeader: { type: Boolean, default: false },
  // Centralização de Botões
  okText: { type: String, default: '' },
  cancelText: { type: String, default: '' },
  okLoading: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'ok', 'cancel']);

const handleOutsideClick = () => {
  if (props.closeOnClickOutside) {
    emit('close');
  }
};

const { position, onMouseDown } = useModalDrag();
</script>

<template>
  <div 
    class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-transparent" 
    :class="{ 'pointer-events-none': isWindow }"
    @click.self="handleOutsideClick"
  >
    <section 
      class="glass-panel !p-0 w-full flex flex-col shadow-2xl border-indigo-500/10 overflow-hidden pointer-events-auto"
      :class="[maxWidth, customClass, { 'animate-scaleIn': animate }]"
      :style="{ 
        '--modal-x': `${position.x}px`,
        '--modal-y': `${position.y}px`,
        transform: `translate(var(--modal-x), var(--modal-y))`,
        backgroundColor: settings.opacityTargets.modals ? 'transparent' : 'rgba(var(--app-bg-raw), 1)',
        backdropFilter: settings.opacityTargets.modals ? 'blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))' : 'none',
        WebkitBackdropFilter: settings.opacityTargets.modals ? 'blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))' : 'none'
      }"
    >
      <!-- ============================================== -->
      <!-- MODO: CUSTOM (Sem estrutura injetada, total liberdade) -->
      <!-- ============================================== -->
      <template v-if="layout === 'custom' || hideHeader">
        <slot :onMouseDown="onMouseDown"></slot>
      </template>

      <!-- ============================================== -->
      <!-- MODO: SIDEBAR (Layout de duas colunas com Abas) -->
      <!-- ============================================== -->
      <template v-else-if="layout === 'sidebar'">
        <!-- Header -->
        <header 
          class="tass-layout-header modal-header-footer-tint"
          :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-header-opacity))` }"
          @mousedown="onMouseDown"
        >
          <slot name="header" :onMouseDown="onMouseDown">
            <div class="flex items-center gap-3">
              <div 
                v-if="icon" 
                class="p-2 rounded-xl text-white shadow-lg" 
                :style="{ 
                  backgroundColor: iconBgColor || '#6366f1', 
                  boxShadow: iconBgColor ? `0 4px 12px -2px ${iconBgColor}44` : '0 4px 12px -2px rgba(99, 102, 241, 0.3)' 
                }"
              >
                <component :is="icon" class="w-4 h-4" />
              </div>
              <div v-else class="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
              
              <div>
                <h2 class="text-sm font-black text-app-main uppercase tracking-tighter leading-none">
                  {{ title }}
                </h2>
                <p v-if="subtitle" class="text-[9px] text-app-muted font-bold uppercase tracking-widest mt-1">
                  {{ subtitle }}
                </p>
              </div>
            </div>
          </slot>
          
          <button v-if="showClose" type="button" @click="emit('close')" class="icon-btn -mr-2">
            <X class="w-5 h-5" />
          </button>
        </header>

        <div class="flex flex-col md:flex-row flex-1 overflow-hidden relative">
          <!-- Sidebar -->
          <aside 
            class="tass-layout-sidebar"
            :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-sidebar-opacity))` }"
          >
            <slot name="sidebar"></slot>
          </aside>

          <!-- Conteúdo Central -->
          <main 
            class="tass-layout-main overflow-y-auto custom-scrollbar"
            :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-body-opacity))` }"
          >
            <div class="tass-layout-content">
              <slot :onMouseDown="onMouseDown"></slot>
            </div>
          </main>
        </div>
      </template>

      <!-- ============================================== -->
      <!-- MODO: STANDARD (Padrão Cursorrules) -->
      <!-- ============================================== -->
      <template v-else>
        <!-- Header -->
        <header 
          class="flex items-center justify-between border-b border-app-border-light cursor-grab active:cursor-grabbing select-none modal-header-footer-tint"
          :class="smallHeader ? 'px-6 py-4' : 'p-6 pb-4'"
          :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-header-opacity))` }"
          @mousedown="onMouseDown"
        >
          <slot name="header" :onMouseDown="onMouseDown">
            <div class="flex items-center gap-3">
              <div 
                v-if="icon" 
                class="text-white shadow-lg"
                :class="smallHeader ? 'p-2 rounded-xl' : 'p-2.5 rounded-2xl'"
                :style="{ 
                  backgroundColor: iconBgColor || '#6366f1', 
                  boxShadow: iconBgColor ? `0 4px 12px -2px ${iconBgColor}44` : '0 4px 12px -2px rgba(99, 102, 241, 0.3)' 
                }"
              >
                <component :is="icon" :class="smallHeader ? 'w-4 h-4' : 'w-5 h-5'" />
              </div>
              <div v-else class="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
              
              <div>
                <h2 :class="[
                  smallHeader 
                    ? 'text-sm font-black text-app-main uppercase tracking-tighter leading-none' 
                    : (icon ? 'text-2xl font-black text-app-main tracking-tighter leading-none' : 'text-sm font-black text-app-main uppercase tracking-tighter')
                ]">
                  {{ title }}
                </h2>
                <span 
                  v-if="subtitle" 
                  :class="smallHeader ? 'text-[9px] text-app-muted font-bold uppercase tracking-widest mt-1 block' : 'text-[10px] font-bold text-slate-400 uppercase tracking-widest'"
                >
                  {{ subtitle }}
                </span>
              </div>
            </div>
          </slot>
          
          <button v-if="showClose" @click="emit('close')" class="icon-btn">
            <X class="w-5 h-5" />
          </button>
        </header>

        <!-- Content Area -->
        <main 
          class="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar"
          :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-body-opacity))` }"
        >
          <slot :onMouseDown="onMouseDown"></slot>
        </main>
      </template>

      <!-- Footer Area (Global: Disponível em todos os layouts se props existirem) -->
      <footer 
        v-if="$slots.footer || okText || cancelText" 
        :class="layout === 'sidebar' ? 'tass-layout-footer modal-header-footer-tint' : 'py-4 px-6 border-t border-app-border-light flex justify-end items-center gap-3 mt-auto modal-header-footer-tint'"
        :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-header-opacity))` }"
      >
        <slot name="footer">
          <button v-if="cancelText" type="button" @click="emit('cancel')" class="btn btn-secondary px-6 border-none shadow-none py-2 text-xs">{{ cancelText }}</button>
          <button v-if="okText" type="submit" @click="emit('ok')" class="btn btn-primary px-6 border-none shadow-none py-2 text-xs" :disabled="okLoading">
            <span v-if="okLoading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ okText }}
          </button>
        </slot>
      </footer>
    </section>
  </div>
</template>

<style scoped>
</style>

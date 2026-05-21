<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';
import { ShieldAlert } from 'lucide-vue-next';

const emit = defineEmits(['auth-success']);

const authStore = useAuthStore();
const loading = ref(false);
const errors = ref({
  general: ''
});

const clearErrors = () => {
  errors.value.general = '';
};

const CLIENT_ID = '852004924790-groj6mfjrak697vv3ntmeeajk4ineuv3.apps.googleusercontent.com';
let tokenClient = null;

const loadGoogleGsi = () => {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.accounts) {
      resolve();
      return;
    }
    if (document.getElementById('google-gsi-client')) {
      const checkInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar o SDK do Google.'));
    document.head.appendChild(script);
  });
};

onMounted(async () => {
  try {
    await loadGoogleGsi();
    if (typeof google !== 'undefined' && google.accounts) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'openid email profile',
        callback: async (response) => {
          if (response.error) {
            console.error('Google Auth Error:', response.error);
            errors.value.general = 'Autenticação com o Google cancelada ou malsucedida.';
            return;
          }
          if (response.access_token) {
            loading.value = true;
            try {
              await authStore.loginWithGoogle(response.access_token);
              notificationService.toast('Login com o Google realizado com sucesso!', 'success');
              emit('auth-success');
            } catch (err) {
              errors.value.general = err.message || 'Falha ao logar com o Google.';
            } finally {
              loading.value = false;
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('Erro ao carregar Google GSI:', err);
  }
});

const loginWithGoogleCustom = () => {
  clearErrors();
  if (!tokenClient) {
    errors.value.general = 'O serviço do Google ainda está carregando ou falhou ao iniciar. Tente novamente.';
    return;
  }
  tokenClient.requestAccessToken({ prompt: 'consent' });
};
</script>

<template>
  <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <!-- Glowing background elements -->
    <div class="absolute w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] top-1/4 left-1/4 pointer-events-none animate-pulse"></div>
    <div class="absolute w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] bottom-1/4 right-1/4 pointer-events-none animate-pulse" style="animation-delay: 2s"></div>

    <div 
      class="glass-panel w-full max-w-md p-8 border border-white/10 flex flex-col relative overflow-hidden shadow-2xl animate-scaleIn"
      :style="{ borderRadius: 'var(--app-card-radius, 24px)' }"
    >
      <!-- HEADER / BRANDING -->
      <div class="flex flex-col items-center mb-6">
        <div class="flex items-center gap-2 select-none">
          <h1 
            class="text-4xl bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] bg-clip-text text-transparent pr-2"
            style="font-family: 'Satisfy', cursive;"
          >
            Tass
          </h1>
          <div class="w-1 h-8 bg-gradient-to-b from-[#00C4CC] to-[#7D2AE8] rounded-full shadow-[0_0_10px_rgba(0,196,204,0.3)]"></div>
        </div>
        <p class="text-[10px] text-app-muted font-black uppercase tracking-[0.2em] mt-3">
          Área de Acesso
        </p>
      </div>

      <!-- DESCRIPTION & CONTEXT -->
      <div class="text-center mb-8 space-y-2">
        <h2 class="text-sm font-bold text-white/95 uppercase tracking-wide">
          Gerenciador de Tarefas Inteligente
        </h2>
        <p class="text-xs text-app-muted leading-relaxed max-w-[280px] mx-auto">
          Faça login de forma rápida e segura usando sua conta Google para sincronizar suas sprints, rádios e tarefas.
        </p>
      </div>

      <!-- GENERAL ERROR BANNER -->
      <div 
        v-if="errors.general" 
        class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold flex items-start gap-3 mb-6 animate-shake"
      >
        <ShieldAlert class="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">Erro:</span> {{ errors.general }}
        </div>
      </div>

      <!-- GOOGLE LOGIN BUTTON -->
      <div class="space-y-4">
        <button 
          type="button" 
          @click="loginWithGoogleCustom"
          class="w-full py-4 px-4 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] relative"
          :disabled="loading"
          :style="{ borderRadius: 'var(--app-input-radius, 12px)' }"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {{ loading ? 'Conectando...' : 'Entrar com o Google' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scaleIn {
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

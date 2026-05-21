import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore';
import { notificationService } from '../services/notificationService';

export const useRadioStore = defineStore('radio', () => {
  const radios = ref([]);
  const currentRadioId = ref(null);
  const isPlaying = ref(false);
  const volume = ref(0.5);
  const isLoading = ref(false);

  // Singleton do elemento de Áudio nativo
  let audio = new Audio();
  audio.volume = volume.value;

  // Listeners do Áudio
  audio.addEventListener('playing', () => {
    isPlaying.value = true;
    isLoading.value = false;
  });

  audio.addEventListener('pause', () => {
    isPlaying.value = false;
  });

  audio.addEventListener('waiting', () => {
    isLoading.value = true;
  });

  audio.addEventListener('error', (e) => {
    isLoading.value = false;
    isPlaying.value = false;
    notificationService.toast('Erro ao carregar stream de áudio.', 'error');
  });

  const currentRadio = computed(() => radios.value.find(r => r.id === currentRadioId.value) || radios.value[0] || null);

  const init = async () => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      radios.value = [];
      return;
    }
    
    try {
      let savedRadios = await authStore.request('/api/radios');
      // Garante que todas as rádios tenham a propriedade stars (migração)
      savedRadios = savedRadios.map(r => ({ ...r, stars: r.stars || 0 }));
      
      // Ordena decrescente por estrelas
      savedRadios.sort((a, b) => b.stars - a.stars);
      
      radios.value = savedRadios;
      if (radios.value.length > 0 && !currentRadioId.value) {
        currentRadioId.value = radios.value[0].id;
      }

      // Recupera volume salvo e última estação, se desejar
      const savedVol = localStorage.getItem('app-radio-volume');
      if (savedVol) {
        setVolume(parseFloat(savedVol));
      }
    } catch (err) {
      console.error('Erro ao inicializar radioStore:', err);
      notificationService.toast('Erro ao carregar rádios.', 'error');
    }
  };

  const updateMediaMetadata = () => {
    if ('mediaSession' in navigator && currentRadio.value) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentRadio.value.name,
        artist: 'TASS Web Radio',
        album: 'Ao Vivo'
      });
    }
  };

  const setupMediaSessionActions = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
    }
  };

  const play = async () => {
    if (!currentRadio.value) return;
    
    // Se a URL mudou ou o audio não tem src, defina o src
    if (audio.src !== currentRadio.value.url) {
      audio.src = currentRadio.value.url;
    }
    
    try {
      isLoading.value = true;
      await audio.play();
      updateMediaMetadata();
      setupMediaSessionActions();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Reprodução interrompida: usuário trocou de rádio rápido demais (comportamento esperado).');
      } else {
        console.error('Playback failed', error);
        notificationService.toast('Não foi possível iniciar o áudio.', 'error');
        isLoading.value = false;
      }
    }
  };

  const pause = () => {
    audio.pause();
  };

  const toggle = () => {
    if (isPlaying.value) pause();
    else play();
  };

  const setVolume = (val) => {
    volume.value = val;
    audio.volume = val;
    localStorage.setItem('app-radio-volume', val.toString());
  };

  const changeStation = (id) => {
    const radio = radios.value.find(r => r.id === id);
    if (radio) {
      currentRadioId.value = id;
      
      if (isPlaying.value) {
        play(); // Toca a nova URL imediatamente
      } else {
        audio.src = radio.url; // Apenas prepara o source
      }
    }
  };

  const next = () => {
    if (radios.value.length === 0) return;
    const currentIndex = radios.value.findIndex(r => r.id === currentRadioId.value);
    const nextIdx = (currentIndex + 1) % radios.value.length;
    changeStation(radios.value[nextIdx].id);
  };

  const prev = () => {
    if (radios.value.length === 0) return;
    const currentIndex = radios.value.findIndex(r => r.id === currentRadioId.value);
    const prevIdx = (currentIndex - 1 + radios.value.length) % radios.value.length;
    changeStation(radios.value[prevIdx].id);
  };

  const rateRadio = async (id, stars) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
      await authStore.request(`/api/radios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ stars })
      });
      const radio = radios.value.find(r => r.id === id);
      if (radio) {
        radio.stars = stars;
        // Reordena a lista reativamente
        radios.value.sort((a, b) => b.stars - a.stars);
      }
    } catch (err) {
      console.error('Failed to rate radio', err);
    }
  };

  const addRadio = async (radio) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
      const newRadio = await authStore.request('/api/radios', {
        method: 'POST',
        body: JSON.stringify({ ...radio, stars: 0 })
      });
      radios.value.push(newRadio);
      radios.value.sort((a, b) => b.stars - a.stars);
      notificationService.toast('Rádio adicionada com sucesso!', 'success');
    } catch (err) {
      console.error('Failed to add radio', err);
      notificationService.toast('Erro ao adicionar rádio.', 'error');
    }
  };

  const updateRadio = async (id, data) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
      await authStore.request(`/api/radios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const index = radios.value.findIndex(r => r.id === id);
      if (index !== -1) {
        radios.value[index] = { ...radios.value[index], ...data };
        // Se for a rádio atual e estiver tocando, atualiza o metadata
        if (currentRadioId.value === id) {
          updateMediaMetadata();
        }
      }
      notificationService.toast('Rádio atualizada!', 'success');
    } catch (err) {
      console.error('Failed to update radio', err);
      notificationService.toast('Erro ao atualizar rádio.', 'error');
    }
  };

  const deleteRadio = async (id) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
      await authStore.request(`/api/radios/${id}`, {
        method: 'DELETE'
      });
      radios.value = radios.value.filter(r => r.id !== id);
      
      // Se apagou a rádio que estava tocando, pausa e foca na primeira.
      if (currentRadioId.value === id) {
         pause();
         if (radios.value.length > 0) {
           currentRadioId.value = radios.value[0].id;
           audio.src = radios.value[0].url;
         } else {
           currentRadioId.value = null;
         }
      }
      notificationService.toast('Rádio excluída.', 'success');
    } catch (err) {
      console.error('Failed to delete radio', err);
      notificationService.toast('Erro ao excluir rádio.', 'error');
    }
  };

  return {
    radios,
    currentRadio,
    currentRadioId,
    isPlaying,
    isLoading,
    volume,
    init,
    play,
    pause,
    toggle,
    setVolume,
    changeStation,
    next,
    prev,
    addRadio,
    updateRadio,
    deleteRadio,
    rateRadio
  };
});

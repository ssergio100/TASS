import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './authStore';

export const useNoteStore = defineStore('note', () => {
  const note = ref('');
  const isLoaded = ref(false);

  const loadNote = async () => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      isLoaded.value = true;
      return;
    }
    try {
      const notes = await authStore.request('/api/notes');
      if (notes && notes.length > 0) {
        note.value = notes[0].content;
      } else {
        note.value = '';
      }
      isLoaded.value = true;
    } catch (error) {
      console.error("Failed to load note from server:", error);
    }
  };

  const saveNote = async (content) => {
    const authStore = useAuthStore();
    note.value = content;
    if (!authStore.isAuthenticated) return;
    try {
      await authStore.request('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ content, updatedAt: Date.now() })
      });
    } catch (error) {
      console.error("Failed to save note to server:", error);
    }
  };

  return {
    note,
    isLoaded,
    loadNote,
    saveNote
  };
});

<script setup>
import { ref } from 'vue';
import { 
  RefreshCw, Terminal, GitBranch, AlertTriangle, 
  Trash2, Settings, Info, CloudLightning, Lock
} from 'lucide-vue-next';

import AppInput from '../components/base/AppInput.vue';
import AppAvatar from '../components/base/AppAvatar.vue';
import AppBadge from '../components/base/AppBadge.vue';
import AppButton from '../components/base/AppButton.vue';
import AppProgressBar from '../components/base/AppProgressBar.vue';
import AppRadio from '../components/base/AppRadio.vue';
import AppSelect from '../components/base/AppSelect.vue';
import AppSkeleton from '../components/base/AppSkeleton.vue';
import AppSwitch from '../components/base/AppSwitch.vue';
import AppTextarea from '../components/base/AppTextarea.vue';
import AppTimePicker from '../components/base/AppTimePicker.vue';
import AppGlassCard from '../components/base/AppGlassCard.vue';
import AppColorPalette from '../components/AppColorPalette.vue';
import GitEnvironmentEditor from '../components/GitEnvironmentEditor.vue';
// --- ESTADOS DE TESTE PARA A GALERIA DE COMPONENTES BASE ---
const testSwitchVal = ref(false);
const testSwitch2Val = ref(true);
const testInputVal = ref('Texto de teste reativo');
const testTextareaVal = ref('Exemplo de conteúdo para o componente base AppTextarea.');
const testSelectVal = ref('op2');
const testRadioVal = ref('rad1');
const testProgressVal = ref(45);
const testTimeVal = ref({ hours: 14, minutes: 30 });
const testBtnLoading = ref(false);
const testBtnDisabled = ref(false);
const demoBaseEnvironmentId = ref('demo-environment-1');
const demoEnvironments = ref([
  { id: 'demo-environment-1', branch: 'stable', alias: 'Produção' },
  { id: 'demo-environment-2', branch: 'integration', alias: 'Integração' }
]);

const selectOptions = [
  { value: 'op1', label: 'Opção 1 - Breeze' },
  { value: 'op2', label: 'Opção 2 - GitLab Integration' },
  { value: 'op3', label: 'Opção 3 - Automatizado' }
];

const incrementProgress = () => {
  if (testProgressVal.value < 100) testProgressVal.value += 5;
};

const decrementProgress = () => {
  if (testProgressVal.value > 0) testProgressVal.value -= 5;
};
</script>

<template>
  <div class="w-full max-w-7xl mx-auto py-12 px-6 space-y-12 animate-fadeIn">
    <header class="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-app-border-light pb-8">
      <div>
        <h1 class="text-4xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Component Suite
        </h1>
        <p class="text-app-muted mt-2 font-medium">Laboratório oficial de componentes base e Design System do TASS.</p>
      </div>
      <div class="flex items-center gap-3 bg-indigo-500/10 px-4 py-2 border border-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
        <Settings class="w-5 h-5" />
        <span class="text-xs font-black uppercase tracking-widest">Painel Interativo</span>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- Card 1: Entradas de Dados (Inputs) -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Entradas de Dados</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Componentes AppInput e AppTextarea</p>
        </div>
        
        <div class="space-y-4 flex-1">
          <AppInput 
            v-model="testInputVal" 
            label="Campo de Texto Base" 
            :icon="Settings" 
            placeholder="Digite alguma coisa..." 
          />

          <AppInput
            v-model="testInputVal"
            label="Entrada compacta"
            size="sm"
            placeholder="Variante para listas densas"
          />
          
          <AppTextarea 
            v-model="testTextareaVal" 
            label="Campo de Texto Longo" 
            :icon="Info" 
            placeholder="Escreva um texto longo..." 
            :rows="3"
          />
          
          <!-- Estado em Tempo Real -->
          <div class="p-3 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-app-border-light space-y-2">
            <span class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Model Value (Reativo)</span>
            <p class="text-xs font-mono text-indigo-650 dark:text-indigo-400 truncate"><strong>Input:</strong> "{{ testInputVal }}"</p>
            <p class="text-xs font-mono text-indigo-650 dark:text-indigo-400 truncate"><strong>Textarea:</strong> "{{ testTextareaVal }}"</p>
          </div>
        </div>
      </div>

      <!-- Card 2: Seletores e Controles -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Seletores e Controles</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Componentes AppSelect, AppRadio e AppSwitch</p>
        </div>
        
        <div class="space-y-5 flex-1">
          <AppSelect 
            v-model="testSelectVal" 
            label="Seletor Dinâmico" 
            :options="selectOptions" 
            placeholder="Selecione uma opção..."
          />

          <AppSelect
            v-model="testSelectVal"
            label="Seletor compacto"
            size="sm"
            :options="selectOptions"
          />
          
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Opções Únicas (Radio)</label>
            <div class="flex gap-4">
              <AppRadio v-model="testRadioVal" value="rad1" label="Opção Alpha" name="test-radios" />
              <AppRadio v-model="testRadioVal" value="rad2" label="Opção Beta" name="test-radios" />
            </div>
          </div>
          
          <div class="space-y-3 pt-1">
            <AppSwitch 
              v-model="testSwitchVal" 
              label="Interruptor Principal" 
              description="Ativa ou desativa a simulação reativa."
            />
            <AppSwitch 
              v-model="testSwitch2Val" 
              label="Interruptor Secundário" 
              description="Iniciado por padrão como ativo."
            />
          </div>

          <!-- Estado em Tempo Real -->
          <div class="p-3 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-app-border-light space-y-1">
            <span class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Model Value (Reativo)</span>
            <p class="text-xs font-mono text-indigo-650 dark:text-indigo-400"><strong>Select:</strong> "{{ testSelectVal }}"</p>
            <p class="text-xs font-mono text-indigo-650 dark:text-indigo-400"><strong>Radio:</strong> "{{ testRadioVal }}"</p>
            <p class="text-xs font-mono text-indigo-650 dark:text-indigo-400"><strong>Switches:</strong> [{{ testSwitchVal }}, {{ testSwitch2Val }}]</p>
          </div>
        </div>
      </div>

      <!-- Card 3: Badges e Status -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Badges e Status</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Componentes AppBadge</p>
        </div>
        
        <div class="space-y-4 flex-1">
          <div class="space-y-2.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Variantes cromáticas (tamanho MD)</label>
            <div class="flex flex-wrap gap-2">
              <AppBadge label="Indigo" variant="indigo" />
              <AppBadge label="Emerald" variant="emerald" />
              <AppBadge label="Amber" variant="amber" />
              <AppBadge label="Red" variant="red" />
              <AppBadge label="Slate" variant="slate" />
              <AppBadge label="Purple" variant="purple" />
            </div>
          </div>

          <div class="space-y-2.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Indicadores com Dot Pulsante</label>
            <div class="flex flex-wrap gap-2">
              <AppBadge label="Ativo" variant="emerald" dot />
              <AppBadge label="Pendente" variant="amber" dot />
              <AppBadge label="Erro" variant="red" dot />
              <AppBadge label="Indeterminado" variant="slate" dot />
            </div>
          </div>

          <div class="space-y-2.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Tamanhos disponíveis</label>
            <div class="flex items-center gap-2">
              <AppBadge label="Size XS" size="xs" variant="indigo" />
              <AppBadge label="Size SM" size="sm" variant="indigo" />
              <AppBadge label="Size MD" size="md" variant="indigo" />
            </div>
          </div>
        </div>
      </div>

      <!-- Card 4: Progresso, Skeletons e TimePicker -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Visualização e Tempo</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Componentes AppProgressBar, AppSkeleton e AppTimePicker</p>
        </div>
        
        <div class="space-y-4 flex-1">
          <!-- Barra de Progresso Reativa -->
          <div class="space-y-3">
            <AppProgressBar :progress="testProgressVal" showLabel variant="indigo">Progresso de Teste</AppProgressBar>
            <div class="flex gap-2">
              <button @click="decrementProgress" class="btn-secondary py-1.5 px-3 text-[10px] flex-1">-5%</button>
              <button @click="incrementProgress" class="btn-secondary py-1.5 px-3 text-[10px] flex-1">+5%</button>
            </div>
          </div>

          <!-- Time Picker -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Seletor de Hora (AppTimePicker)</label>
            <AppTimePicker v-model="testTimeVal" />
            <p class="text-[10px] font-mono text-indigo-650 dark:text-indigo-400 text-center mt-1">
              Hora selecionada: {{ testTimeVal ? `${String(testTimeVal.hours).padStart(2, '0')}:${String(testTimeVal.minutes).padStart(2, '0')}` : '00:00' }}
            </p>
          </div>

          <!-- Skeletons (Carregamento) -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Animação Shimmer (AppSkeleton)</label>
            <div class="flex items-center gap-3">
              <AppSkeleton circle width="w-10" height="h-10" />
              <div class="flex-1 space-y-1.5">
                <AppSkeleton width="w-2/3" height="h-3" />
                <AppSkeleton width="w-full" height="h-2.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 5: Avatares -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Avatares</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Componentes AppAvatar</p>
        </div>
        
        <div class="space-y-4 flex-1">
          <div class="space-y-2.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Tamanhos (com iniciais)</label>
            <div class="flex items-end gap-3">
              <div class="flex flex-col items-center gap-1">
                <AppAvatar name="Sergio Ramos" size="sm" />
                <span class="text-[8px] font-mono text-slate-400 dark:text-slate-500">sm</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <AppAvatar name="Sergio Ramos" size="md" />
                <span class="text-[8px] font-mono text-slate-400 dark:text-slate-500">md</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <AppAvatar name="Sergio Ramos" size="lg" />
                <span class="text-[8px] font-mono text-slate-400 dark:text-slate-500">lg</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <AppAvatar name="Sergio Ramos" size="xl" />
                <span class="text-[8px] font-mono text-slate-400 dark:text-slate-500">xl</span>
              </div>
            </div>
          </div>

          <div class="space-y-2.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Com imagem (hover zoom)</label>
            <div class="flex items-center gap-3">
              <AppAvatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" name="Jane Doe" size="lg" />
              <AppAvatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" name="John Doe" size="lg" />
            </div>
          </div>
        </div>
      </div>

      <!-- Card 6: Componente Base AppButton -->
      <div class="app-card-panel flex flex-col gap-4 text-left lg:col-span-2 shadow-lg">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-app-border-light pb-3">
          <div>
            <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Componente AppButton</h3>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Nosso componente base unificado para botões premium</p>
          </div>
          <!-- Controles de Teste do Componente -->
          <div class="flex items-center gap-4 bg-slate-100/50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-app-border-light shrink-0">
            <AppSwitch v-model="testBtnLoading" label="Loading" />
            <div class="w-px h-6 bg-app-border-light"></div>
            <AppSwitch v-model="testBtnDisabled" label="Disabled" />
          </div>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Primary</label>
            <AppButton variant="primary" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="Settings" class="w-full">
              Primary
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Secondary</label>
            <AppButton variant="secondary" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="Info" class="w-full">
              Secondary
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Gradient</label>
            <AppButton variant="gradient" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="CloudLightning" class="w-full">
              Gradient
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Outline</label>
            <AppButton variant="outline" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="Lock" class="w-full">
              Outline
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Glass</label>
            <AppButton variant="glass" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="Terminal" class="w-full">
              Glass
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Ghost</label>
            <AppButton variant="ghost" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="RefreshCw" class="w-full">
              Ghost
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Danger</label>
            <AppButton variant="danger" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="Trash2" class="w-full">
              Danger
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Success</label>
            <AppButton variant="success" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="GitBranch" class="w-full">
              Success
            </AppButton>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Variant: Warning</label>
            <AppButton variant="warning" :loading="testBtnLoading" :disabled="testBtnDisabled" :icon="AlertTriangle" class="w-full">
              Warning
            </AppButton>
          </div>
        </div>

        <!-- Tamanhos do AppButton -->
        <div class="border-t border-app-border-light pt-3 mt-2">
          <label class="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2">Escalas Geométricas (Tamanhos)</label>
          <div class="flex flex-wrap items-center gap-3">
            <AppButton variant="gradient" size="sm" :loading="testBtnLoading" :disabled="testBtnDisabled">Size SM</AppButton>
            <AppButton variant="gradient" size="md" :loading="testBtnLoading" :disabled="testBtnDisabled">Size MD</AppButton>
            <AppButton variant="gradient" size="lg" :loading="testBtnLoading" :disabled="testBtnDisabled">Size LG</AppButton>
            <AppButton variant="gradient" size="xl" :loading="testBtnLoading" :disabled="testBtnDisabled">Size XL</AppButton>
          </div>
        </div>
      </div>

      <!-- Card 7: Botões CSS Globais (Design System) -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Botões Globais (CSS)</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Classes utilitárias prontas do style.css</p>
        </div>
        
        <div class="space-y-3.5 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar flex-1">
          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-primary</label>
            <button class="btn btn-primary w-full py-2 text-[10px]">Confirmar Ação</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-secondary</label>
            <button class="btn-secondary w-full py-2 text-[10px]">Cancelar Operação</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-gradient</label>
            <button class="btn-gradient btn w-full py-2 text-[10px]">Enviar Arquivos</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-outline</label>
            <button class="btn-outline btn w-full py-2 text-[10px]">Visualizar Código</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-glass</label>
            <button class="btn-glass btn w-full py-2 text-[10px]">Configurar Painel</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-danger</label>
            <button class="btn-danger btn w-full py-2 text-[10px]">Excluir Tudo</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-success</label>
            <button class="btn-success btn w-full py-2 text-[10px]">Salvar Cadastro</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-warning</label>
            <button class="btn-warning btn w-full py-2 text-[10px]">Atenção Crítica</button>
          </div>

          <div class="space-y-1">
            <label class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">btn-ghost</label>
            <button class="btn-ghost btn w-full py-2 text-[10px]">Voltar Menu</button>
          </div>
        </div>
      </div>

      <!-- Card 8: Efeito Glass Card Personalizado -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg lg:col-span-1">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Glass Card (Uiverse)</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Teste do componente AppGlassCard com efeito de transparência</p>
        </div>
        
        <div class="flex-1 flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden relative border border-slate-700 min-h-[220px]">
          <!-- Um background colorido/gradiente atrás pra ver o vidro (blur) em ação -->
          <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-60"></div>
          
          <!-- Componente Base importado -->
          <AppGlassCard text="Github" :rotation="-15" />
        </div>
      </div>

      <!-- Card 9: Paleta de Cores (Uiverse) -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg lg:col-span-1">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Color Palette (Uiverse)</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Componente interativo de paleta de cores</p>
        </div>
        
        <div class="flex-1 flex items-center justify-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 min-h-[250px]">
          <AppColorPalette />
        </div>
      </div>

      <!-- Card 10: Editor dinâmico de ambientes Git -->
      <div class="app-card-panel flex flex-col gap-4 text-left shadow-lg lg:col-span-2">
        <div>
          <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Editor de Ambientes Git</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Componente de domínio usado na Integração Remota</p>
        </div>
        <GitEnvironmentEditor
          v-model="demoEnvironments"
          v-model:base-environment-id="demoBaseEnvironmentId"
          provider="demo"
        />
      </div>

    </div>
  </div>
</template>

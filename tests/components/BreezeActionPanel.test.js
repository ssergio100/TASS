import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ActionPanel from '../../src/components/breeze/ActionPanel.vue';
import AppSelect from '../../src/components/base/AppSelect.vue';

const environments = [
  { id: 'base', branch: 'stable', alias: 'Produção' },
  { id: 'target', branch: 'quality', alias: 'Qualidade' },
  { id: 'client', branch: 'client-a', alias: 'Cliente A' },
  { id: 'extra', branch: 'integration', alias: 'Integração' }
];

describe('Breeze ActionPanel', () => {
  it('oferece todos os ambientes cadastrados como destino do merge', async () => {
    const wrapper = mount(ActionPanel, {
      props: {
        selectedBranches: ['feature/task-1'],
        branchesLoading: false,
        environments,
        targetEnvironmentId: 'base'
      }
    });

    expect(wrapper.getComponent(AppSelect).props('options')).toHaveLength(4);
    await wrapper.getComponent(AppSelect).vm.$emit('update:modelValue', 'client');
    expect(wrapper.emitted('update:targetEnvironmentId')[0]).toEqual(['client']);

    await wrapper.setProps({ targetEnvironmentId: 'client' });
    const mergeButton = wrapper.findAll('button').find(button => button.text().includes('Mesclar para o ambiente'));
    await mergeButton.trigger('click');
    expect(wrapper.emitted('merge-to-target')[0]).toEqual([environments[2]]);
  });
});

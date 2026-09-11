import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import GitEnvironmentEditor from '../../src/components/GitEnvironmentEditor.vue';

const environments = [
  { id: 'base', branch: 'stable', alias: 'Produção' },
  { id: 'target', branch: 'quality', alias: 'Qualidade' }
];

describe('GitEnvironmentEditor', () => {
  it('adiciona ambientes sem impor um limite fixo', async () => {
    const wrapper = mount(GitEnvironmentEditor, {
      props: {
        modelValue: environments,
        baseEnvironmentId: 'base',
        provider: 'gitlab'
      }
    });

    await wrapper.get('[data-test="add-environment"]').trigger('click');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toHaveLength(3);
  });

  it('impede remover a branch base e permite remover outro cadastro', async () => {
    const wrapper = mount(GitEnvironmentEditor, {
      props: {
        modelValue: environments,
        baseEnvironmentId: 'base',
        provider: 'github'
      }
    });

    const removeButtons = wrapper.findAll('[data-test="remove-environment"]');
    expect(removeButtons[0].attributes('disabled')).toBeDefined();
    expect(removeButtons[1].attributes('disabled')).toBeUndefined();

    await removeButtons[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([environments[0]]);
  });
});

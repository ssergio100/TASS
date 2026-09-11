import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppInput from '../../../src/components/base/AppInput.vue';

describe('AppInput.vue', () => {
  it('deve emitir o valor atualizado no evento input', async () => {
    const wrapper = mount(AppInput, {
      props: { modelValue: '', label: 'Nome' }
    });

    const input = wrapper.find('input');
    await input.setValue('Novo Valor');

    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['Novo Valor']);
  });

  it('deve exibir mensagem de erro e aplicar classes de erro', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'Nome', error: 'Campo obrigatório' }
    });

    expect(wrapper.text()).toContain('Campo obrigatório');
    const input = wrapper.find('input');
    expect(input.classes()).toContain('border-red-500/50');
  });

  it('deve repassar atributos nativos para o elemento input', () => {
    const wrapper = mount(AppInput, {
      attrs: { placeholder: 'Digite aqui', maxlength: '50' }
    });

    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Digite aqui');
    expect(input.attributes('maxlength')).toBe('50');
  });

  it('oferece uma variante compacta para editores densos', () => {
    const wrapper = mount(AppInput, {
      props: { size: 'sm' }
    });

    expect(wrapper.get('input').classes()).toEqual(expect.arrayContaining(['px-3', 'py-2', 'text-xs']));
  });
});

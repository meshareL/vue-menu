import { describe, it, afterEach, expect } from 'vitest';
import { ref, shallowReadonly } from 'vue';
import { enableAutoUnmount, shallowMount, flushPromises } from '@vue/test-utils';
import Divider from '../src/component/divider';
import { menuContextKey } from '../src/component/internal/key';

enableAutoUnmount(afterEach);

describe('Divider component', () => {
    it('create component', () => {
        const instance = shallowMount(Divider);

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('role')).toBe('separator');
        expect(instance.attributes()).toHaveProperty('aria-orientation');
    });

    it('prop orientation', async () => {
        const instance = shallowMount(Divider, { props: { orientation: 'horizontal' } });

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('role')).toBe('separator');
        expect(instance.attributes('aria-orientation')).toBe('horizontal');

        await instance.setProps({ orientation: 'vertical' });
        expect(instance.attributes('aria-orientation')).toBe('vertical');
    });

    it('determine orientation through menu', async () => {
        const orientation = ref('horizontal');
        const instance = shallowMount(Divider, {
            global: { provide: { [menuContextKey as symbol]: { orientation: shallowReadonly(orientation) } } }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('role')).toBe('separator');
        expect(instance.attributes('aria-orientation')).toBe('vertical');

        orientation.value = 'vertical';
        await flushPromises();
        expect(instance.attributes('aria-orientation')).toBe('horizontal');
    });

    it('prop orientation parameter is preferred', () => {
        const orientation = ref('horizontal');
        const instance = shallowMount(Divider, {
            props: { orientation: 'horizontal' },
            global: { provide: { [menuContextKey as symbol]: { orientation: shallowReadonly(orientation) } } }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('role')).toBe('separator');
        expect(instance.attributes('aria-orientation')).toBe('horizontal');
    });
});

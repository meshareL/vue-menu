import { describe, afterEach, it, expect, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, mount } from '@vue/test-utils';
import { h as createElement } from 'vue';
import Anchor from '../src/component/anchor';
import { menuContextKey } from '../src/component/internal/key';
import classes from '../src/css/menuitem.module.scss';

enableAutoUnmount(afterEach);

describe('Anchor component', () => {
    it('create component', () => {
        const instance = shallowMount(Anchor);
        expect(instance.exists()).toBe(true);
        expect(instance.classes(classes.anchor)).toBe(true);
        expect(instance.attributes('type')).toBe('button');
        expect(instance.attributes('role')).toBe('menuitem');
    });

    it('slot', () => {
        const instance = mount(Anchor, {
            slots: {
                default: () => 'default',
                leading: () => createElement('span'),
                description: () => 'description'
            }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.get(`.${classes.label}`).text()).toBe('default');
        expect(instance.find(`.${classes.leading}`).exists()).toBe(true);
        expect(instance.get(`.${classes.description}`).text()).toBe('description');
    });

    it('close all submenu when mouse enter', async () => {
        const menuContext = { closeAllSubmenu: vitest.fn() };
        const instance = shallowMount(Anchor, {
            global: { provide: { [menuContextKey as symbol]: menuContext } }
        });

        expect(instance.exists()).toBe(true);

        await instance.trigger('mouseenter');
        expect(menuContext.closeAllSubmenu).toBeCalled();
    });
});

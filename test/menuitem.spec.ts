import { describe, it, beforeAll, afterAll, afterEach, vitest, expect } from 'vitest';
import { enableAutoUnmount, shallowMount, config, mount, flushPromises } from '@vue/test-utils';
import { h as createElement } from 'vue';
import { dispatchCommandKey, menuContextKey, menuItemManageKey } from '../src/component/internal/key';
import type { MenuContext } from '../src/component/internal/key';
import Menuitem from '../src/component/menuitem';
import classes from '../src/css/menuitem.module.scss';

enableAutoUnmount(afterEach);

describe('Menuitem component', () => {
    const defaultGlobalProvide = config.global.provide,
          dispatchCommand = vitest.fn(),
          menuContext = {
              uncheckSameGroupRadio: vitest.fn<MenuContext['uncheckSameGroupRadio']>(),
              closeAllSubmenu: vitest.fn<MenuContext['closeAllSubmenu']>()
          };

    beforeAll(() => config.global.provide = {
        [dispatchCommandKey as symbol]: dispatchCommand,
        [menuContextKey as symbol]: menuContext
    });

    afterAll(() => config.global.provide = defaultGlobalProvide);

    it('create component', () => {
        const instance = shallowMount(Menuitem);
        expect(instance.exists()).toBe(true);
        expect(instance.classes(classes.menuitem)).toBe(true);
        expect(instance.attributes('role')).toBe('menuitem');
        expect(instance.attributes('tabindex')).toBe('-1');
        expect(instance.attributes('aria-disabled')).toBe('false');
        expect(instance.attributes()).not.toHaveProperty('aria-checked');
    });

    describe('slot', () => {
        it('leading slot', () => {
            const instance = mount(Menuitem, {
                slots: {
                    default: () => 'label',
                    leading: () => createElement('svg')
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.find(`.${classes.leading}`).exists()).toBe(true);
            expect(instance.find(`.${classes.trailing}`).exists()).toBe(false);
            expect(instance.text()).toBe('label');
            expect(instance.find(`.${classes.description}`).exists()).toBe(false);
        });

        it('trailing slot', () => {
            const instance = mount(Menuitem, {
                slots: {
                    default: () => 'label',
                    trailing: () => 'trailing'
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.find(`.${classes.leading}`).exists()).toBe(false);
            expect(instance.get(`.${classes.label}`).text()).toBe('label');
            expect(instance.get(`.${classes.trailing}`).text()).toBe('trailing');
            expect(instance.find(`.${classes.description}`).exists()).toBe(false);
        });

        it('leading + trailing slot', () => {
            const instance = mount(Menuitem, {
                slots: {
                    default: () => 'label',
                    leading: () => createElement('svg'),
                    trailing: () => 'trailing'
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.find(`.${classes.leading}`).exists()).toBe(true);
            expect(instance.get(`.${classes.label}`).text()).toBe('label');
            expect(instance.get(`.${classes.trailing}`).text()).toBe('trailing');
            expect(instance.find(`.${classes.description}`).exists()).toBe(false);
        });

        it('description slot', () => {
            const instance = mount(Menuitem, {
                slots: {
                    default: () => 'label',
                    description: () => 'description'
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.find(`.${classes.leading}`).exists()).toBe(false);
            expect(instance.get(`.${classes.label}`).text()).toBe('label');
            expect(instance.find(`.${classes.trailing}`).exists()).toBe(false);
            expect(instance.get(`.${classes.description}`).text()).toBe('description');
        });

        it('leading + description slot', () => {
            const instance = mount(Menuitem, {
                slots: {
                    default: () => 'label',
                    leading: () => createElement('svg'),
                    description: () => 'description'
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.find(`.${classes.leading}`).exists()).toBe(true);
            expect(instance.get(`.${classes.label}`).text()).toBe('label');
            expect(instance.find(`.${classes.trailing}`).exists()).toBe(false);
            expect(instance.get(`.${classes.description}`).text()).toBe('description');
        });

        it('trailing + description slot', () => {
            const instance = mount(Menuitem, {
                slots: {
                    default: () => 'label',
                    trailing: () => 'trailing',
                    description: () => 'description'
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.find(`.${classes.leading}`).exists()).toBe(false);
            expect(instance.get(`.${classes.label}`).text()).toBe('label');
            expect(instance.get(`.${classes.trailing}`).text()).toBe('trailing');
            expect(instance.get(`.${classes.description}`).text()).toBe('description');
        });

        it('leading + trailing + description slot', () => {
            const instance = mount(Menuitem, {
                slots: {
                    default: () => 'label',
                    leading: () => createElement('svg'),
                    trailing: () => 'trailing',
                    description: () => 'description'
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.find(`.${classes.leading}`).exists()).toBe(true);
            expect(instance.get(`.${classes.trailing}`).text()).toBe('trailing');
            expect(instance.get(`.${classes.label}`).text()).toBe('label');
            expect(instance.get(`.${classes.description}`).text()).toBe('description');
        });

        it('type is not command, not render leading slot', async () => {
            const instance = mount(Menuitem, {
                props: { type: 'radio' },
                slots: {
                    default: () => 'label',
                    leading: () => 'leading'
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.get(`.${classes.leading}`).text()).not.toBe('leading');

            await instance.setProps({ type: 'checkbox' });
            expect(instance.get(`.${classes.leading}`).text()).not.toBe('leading');
        });
    });

    it('prop type', async () => {
        const instance = shallowMount(Menuitem, { props: { type: 'command' } });
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('role')).toBe('menuitem');
        expect(instance.attributes()).not.toHaveProperty('aria-checked');

        await instance.setProps({ type: 'radio' });
        expect(instance.attributes('role')).toBe('menuitemradio');
        expect(instance.attributes('aria-checked')).toBe('false');

        await instance.setProps({ type: 'checkbox' });
        expect(instance.attributes('role')).toBe('menuitemcheckbox');
        expect(instance.attributes('aria-checked')).toBe('false');
    });

    it('type is radio, checked', () => {
        let instance = shallowMount(Menuitem, { props: { type: 'radio', defaultChecked: true } });
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('aria-checked')).toBe('true');

        instance = shallowMount(Menuitem, { props: { type: 'radio', defaultChecked: false } });
        expect(instance.attributes('aria-checked')).toBe('false');
    });

    it('type is checkbox, checked', () => {
        let instance = shallowMount(Menuitem, { props: { type: 'checkbox', defaultChecked: true } });
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('aria-checked')).toBe('true');

        instance = shallowMount(Menuitem, { props: { type: 'checkbox', defaultChecked: false } });
        expect(instance.attributes('aria-checked')).toBe('false');
    });

    it('click fires the command event and bubble', async () => {
        const command = 1,
              instance = shallowMount(Menuitem, { props: { command } });

        expect(instance.exists()).toBe(true);

        await instance.trigger('click');
        expect(instance.emitted('command')).toEqual([ [ command ] ]);
        expect(dispatchCommand).toBeCalled();
    });

    describe('menuitem checked state sync v-model', () => {
        it('radio', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'radio',
                name: 'radio',
                value: '1',
                modelValue: '1'
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.setProps({ modelValue: '2' });
            expect(instance.attributes('aria-checked')).toBe('false');
        });

        it('checkbox boolean', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'checkbox',
                name: 'checkbox',
                value: '1',
                modelValue: true
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.setProps({ modelValue: false });
            expect(instance.attributes('aria-checked')).toBe('false');
        });

        it('checkbox array', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'checkbox',
                name: 'checkbox',
                value: '1',
                modelValue: [ '1' ]
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.setProps({ modelValue: [ '2' ] });
            expect(instance.attributes('aria-checked')).toBe('false');

            await instance.setProps({ modelValue: [ '1', '2' ] });
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.setProps({ modelValue: [ '2', '3' ] });
            expect(instance.attributes('aria-checked')).toBe('false');
        });

        it('checkbox set', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'checkbox',
                name: 'checkbox',
                value: '1',
                modelValue: new Set([ '1' ])
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.setProps({ modelValue: new Set([ '2' ]) });
            expect(instance.attributes('aria-checked')).toBe('false');

            await instance.setProps({ modelValue: new Set([ '1', '2' ]) });
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.setProps({ modelValue: new Set([ '2', '3' ]) });
            expect(instance.attributes('aria-checked')).toBe('false');
        });
    });

    describe('v-model', () => {
        it('radio', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'radio',
                name: 'radio',
                value: '1',
                modelValue: '2',
                'onUpdate:modelValue': value => { instance.setProps({ modelValue: value }); }
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.props('modelValue')).toBe('2');

            await instance.trigger('click');
            expect(menuContext.uncheckSameGroupRadio).not.toBeCalled();
            expect(instance.props('modelValue')).toBe('1');
        });

        it('checkbox boolean', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'checkbox',
                name: 'checkbox',
                value: '1',
                modelValue: false,
                'onUpdate:modelValue': value => { instance.setProps({ modelValue: value }); }
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.props('modelValue')).toBe(false);

            await instance.trigger('click');
            expect(instance.props('modelValue')).toBe(true);
        });

        it('checkbox array', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'checkbox',
                name: 'checkbox',
                value: '1',
                modelValue: [ '2' ],
                'onUpdate:modelValue': value => { instance.setProps({ modelValue: value }); }
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.props('modelValue')).toEqual([ '2' ]);

            await instance.trigger('click');
            expect(instance.props('modelValue')).toHaveLength(2);
            expect(instance.props('modelValue')).toEqual(expect.arrayContaining([ '1', '2' ]));

            await instance.trigger('click');
            expect(instance.props('modelValue')).toHaveLength(1);
            expect(instance.props('modelValue')).toEqual(expect.arrayContaining([ '2' ]));
        });

        it('checkbox set', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'checkbox',
                name: 'checkbox',
                value: '1',
                modelValue: new Set([ '2' ]),
                'onUpdate:modelValue': value => { instance.setProps({ modelValue: value }); }
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.props('modelValue')).toEqual(new Set([ '2' ]));

            await instance.trigger('click');
            expect(instance.props('modelValue')).toHaveLength(2);
            expect(instance.props('modelValue')).toEqual(new Set([ '1', '2' ]));

            await instance.trigger('click');
            expect(instance.props('modelValue')).toHaveLength(1);
            expect(instance.props('modelValue')).toEqual(new Set([ '2' ]));
        });
    });

    describe('no v-model', () => {
        it('radio', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'radio',
                name: 'radio',
                value: '1',
                defaultChecked: false
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-checked')).toBe('false');

            await instance.trigger('click');
            expect(menuContext.uncheckSameGroupRadio).toBeCalledWith('radio');
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.trigger('click');
            expect(menuContext.uncheckSameGroupRadio).toBeCalledWith('radio');
            expect(instance.attributes('aria-checked')).toBe('true');
        });

        it('checkbox', async () => {
            const instance = shallowMount(Menuitem, { props: {
                type: 'checkbox',
                name: 'checkbox',
                value: '1',
                defaultChecked: false
            } });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-checked')).toBe('false');

            await instance.trigger('click');
            expect(instance.attributes('aria-checked')).toBe('true');

            await instance.trigger('click');
            expect(instance.attributes('aria-checked')).toBe('false');
        });
    });

    it('menuitem mouse enter, close other submenus', async () => {
        const instance = shallowMount(Menuitem);

        expect(instance.exists()).toBe(true);

        await instance.trigger('mouseenter');
        expect(menuContext.closeAllSubmenu).toBeCalled();
    });

    it('radio uncheck', async () => {
        const name = 'Radio';
        const menuItemManage = { addData: vitest.fn(), removeData: vitest.fn() };
        const instance = shallowMount(Menuitem, {
            props: { type: 'radio', name, value: '1', defaultChecked: true },
            global: { provide: { [menuItemManageKey as symbol]: menuItemManage } }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('aria-checked')).toBe('true');

        menuItemManage.addData.mock.calls.at(0)?.at(0)?.uncheckRadio('xxx');
        expect(instance.attributes('aria-checked')).toBe('true');

        menuItemManage.addData.mock.calls.at(0)?.at(0)?.uncheckRadio(name);
        await flushPromises();
        expect(instance.attributes('aria-checked')).toBe('false');
    });

    it('tabindex', async () => {
        const menuItemManage = { addData: vitest.fn(), removeData: vitest.fn() };
        const instance = shallowMount(Menuitem, {
            global: { provide: { [menuItemManageKey as symbol]: menuItemManage } }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('tabindex')).toBe('-1');

        await menuItemManage.addData.mock.calls.at(0)?.at(0)?.focus();
        await flushPromises();
        expect(instance.attributes('tabindex')).toBe('0');

        await menuItemManage.addData.mock.calls.at(0)?.at(0)?.blur();
        await flushPromises();
        expect(instance.attributes('tabindex')).toBe('-1');
    });
});

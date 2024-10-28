import { describe, it, beforeEach, afterEach, expect, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, mount, flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { h as createElement, defineComponent, Fragment, inject, ref } from 'vue';
import Menubar from '../src/component/menubar';
import { menubarItemManageKey, dispatchCommandKey, menubarContextKey } from '../src/component/internal/key';
import type { MenubarItemData } from '../src/component/internal/key';
import { useDataCollect, AttrPositionInSet } from '../src/component/internal/util';

enableAutoUnmount(afterEach);

describe('VueMenubar component', () => {
    it('create component', () => {
        const instance = shallowMount(Menubar);

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('role')).toBe('menubar');
        expect(instance.attributes('aria-orientation')).toBe('horizontal');
    });

    it('add order to child elements', async () => {
        const Context = defineComponent(() => () => createElement('div'), { name: 'VueMenuContext' }),
              SetupComponent = defineComponent(() => () => createElement('div'), { name: 'Setup' }),
              FunctionalComponent = () => createElement('div');

        const instance = mount(Menubar, {
            slots: { default: () => [
                createElement(Fragment, [
                    createElement('div', { role: 'menuitem' }),
                    createElement(Context),
                    createElement(SetupComponent),
                    createElement(FunctionalComponent),
                    createElement(Context)
                ]),
                createElement('div', { role: 'menuitem' }),
                createElement(Context),
                createElement(SetupComponent),
                createElement(FunctionalComponent),
                createElement(Context)
            ] }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.find('[role="menubar"]').findAll('div').map(child => child.attributes(AttrPositionInSet)))
            .toEqual([
                '1',
                '2',
                undefined,
                undefined,
                '3',
                '4',
                '5',
                undefined,
                undefined,
                '6'
            ]);
    });

    it('menubar emit command event', async () => {
        const Button = () => {
            const dispatchCommand = inject(dispatchCommandKey, null);
            return createElement('button', { onClick: () => dispatchCommand?.(1) });
        };

        const instance = mount(Menubar, { slots: { default: () => createElement(Button) } });
        expect(instance.exists()).toBe(true);

        const button = instance.get('button');
        await button.trigger('click');

        expect(instance.emitted('command')).toEqual([ [ 1 ] ]);
    });

    describe('focus management', () => {
        const Context = defineComponent(props => {
            useDataCollect(menubarItemManageKey).supply({
                id: props.id,
                focus: props.focus,
                blur: props.blur,
                closeMenu: props.closeMenu
            });
            return () => createElement('div');
        }, {
            name: 'VueMenuContext',
            props: [ 'id', 'focus', 'blur', 'closeMenu' ]
        });

        let instance: VueWrapper;
        let contextDataset: MenubarItemData[] = [];

        beforeEach(() => {
            let count = 1;
            const generateContextData = () => {
                const data = {
                    id: String(count++),
                    focus: vitest.fn(),
                    blur: vitest.fn(),
                    closeMenu: vitest.fn()
                };

                contextDataset.push(data);
                return data;
            };

            instance = mount(Menubar, {
                slots: { default: () => [
                    createElement(Context, { ...generateContextData() }),
                    createElement(Context, { ...generateContextData() }),
                    createElement(Context, { ...generateContextData() }),
                    createElement(Context, { ...generateContextData() })
                ] }
            });

            expect(instance.exists()).toBe(true);
        });

        afterEach(() => contextDataset = []);

        it('the blur method is called when the element loses focus', async () => {
            await instance.trigger('keydown', { key: 'Home' });
            await instance.trigger('keydown', { key: 'ArrowRight' });
            expect(contextDataset.at(0)?.blur).toBeCalled();
        });

        it('focus first item on Home', async () => {
            await instance.trigger('keydown', { key: 'Home' });
            expect(contextDataset.at(0)?.focus).toBeCalled();
        });

        it('focus last item on End', async () => {
            await instance.trigger('keydown', { key: 'End' });
            expect(contextDataset.at(-1)?.focus).toBeCalled();
        });

        it('focus next item on arrow right', async () => {
            await instance.trigger('keydown', { key: 'Home' });
            await instance.trigger('keydown', { key: 'ArrowRight' });
            expect(contextDataset.at(1)?.focus).toBeCalled();
        });

        it('from the last to the first on arrow right', async () => {
            await instance.trigger('keydown', { key: 'End' });
            await instance.trigger('keydown', { key: 'ArrowRight' });
            expect(contextDataset.at(0)?.focus).toBeCalled();
        });

        it('focus previous item on arrow left', async () => {
            await instance.trigger('keydown', { key: 'End' });
            await instance.trigger('keydown', { key: 'ArrowLeft' });
            expect(contextDataset.at(-2)?.focus).toBeCalled();
        });

        it('from the first to the last on arrow left', async () => {
            await instance.trigger('keydown', { key: 'Home' });
            await instance.trigger('keydown', { key: 'ArrowLeft' });
            expect(contextDataset.at(-1)?.focus).toBeCalled();
        });

        it('user provided menuitem elements', async () => {
            const instance = mount(Menubar, {
                slots: { default: () => [
                    createElement('button', { role: 'menuitem' }),
                    createElement('button', { role: 'menuitem' })
                ] }
            });

            const menuitemList = instance.findAll('button');
            expect(instance.exists()).toBe(true);
            expect(menuitemList.map(menuitem => menuitem.attributes('tabindex'))).toEqual([ '0', '-1' ]);

            const firstButtonFocus = vitest.spyOn(menuitemList.at(0)!.element, 'focus'),
                  lastButtonFocus = vitest.spyOn(menuitemList.at(1)!.element, 'focus');

            await instance.trigger('keydown', { key: 'End' });
            await flushPromises();
            expect(menuitemList.map(menuitem => menuitem.attributes('tabindex'))).toEqual([ '-1', '0' ]);
            expect(firstButtonFocus).not.toBeCalled();
            expect(lastButtonFocus).toBeCalled();

            await instance.trigger('keydown', { key: 'ArrowLeft' });
            await flushPromises();
            expect(menuitemList.map(menuitem => menuitem.attributes('tabindex'))).toEqual([ '0', '-1' ]);
            expect(firstButtonFocus).toBeCalled();
            expect(lastButtonFocus).toBeCalledTimes(1);
        });
    });

    it('hover or focus on the user provided menuitem elements, closing open menus', async () => {
        const Context = defineComponent(() => {
            const menubarContext = inject(menubarContextKey, null);

            const status = ref(false);
            useDataCollect(menubarItemManageKey).supply({
                id: '2',
                focus: async () => {
                    status.value = true;
                    menubarContext?.menuHavaBeenOpened();
                },
                blur: async () => { status.value = false; },
                closeMenu: () => { status.value = false; }
            }, 2);
            return () => createElement('p', status.value);
        }, { name: 'VueMenuContext' });

        const instance = mount(Menubar, {
            slots: { default: () => [
                createElement('button', { role: 'menuitem' }),
                createElement(Context)
            ] }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.get('p').text()).toBe('false');

        await instance.trigger('keydown', { key: 'End' });
        await flushPromises();
        expect(instance.get('p').text()).toBe('true');

        await instance.get('button').trigger('mouseenter');
        await flushPromises();
        expect(instance.get('p').text()).toBe('false');

        await instance.trigger('keydown', { key: 'End' });
        await instance.get('button').trigger('focusin');
        await flushPromises();
        expect(instance.get('p').text()).toBe('false');
    });

    it('click outside close all menu', async () => {
        const closeMenuFunctionList = [ vitest.fn(), vitest.fn() ];
        const Context = defineComponent(props => {
            const menubarContext = inject(menubarContextKey, null);
            useDataCollect(menubarItemManageKey).supply({
                id: String(props.id),
                focus: vitest.fn(),
                blur: vitest.fn(),
                closeMenu: closeMenuFunctionList.at(props.id)!
            }, props.id);
            return () => createElement('div', { onClick: () => menubarContext?.menuHavaBeenOpened() });
        }, { name: 'VueMenuContext', props: [ 'id' ] });

        const instance = mount(Menubar, {
            slots: { default: () => [
                createElement(Context, { id: 0 }),
                createElement(Context, { id: 1 })
            ] },
            attachTo: document.body
        });

        expect(instance.exists()).toBe(true);
        closeMenuFunctionList.forEach(fun => expect(fun).not.toBeCalled());

        await instance.getComponent(Context).trigger('click');

        document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flushPromises();
        closeMenuFunctionList.forEach(fun => expect(fun).toBeCalled());
    });
});

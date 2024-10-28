import { describe, it, beforeEach, afterEach, expect, vitest, beforeAll, afterAll } from 'vitest';
import { enableAutoUnmount, mount, flushPromises, config } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { h as createElement, inject, ref, defineComponent, Fragment, shallowRef } from 'vue';
import Menu from '../src/component/menu';
import {
    containerContextKey,
    dispatchCommandKey,
    menuItemManageKey
} from '../src/component/internal/key';
import type { MenuItemData } from '../src/component/internal/key';
import { useDataCollect, AttrPositionInSet } from '../src/component/internal/util';

enableAutoUnmount(afterEach);

describe('Menu component', () => {
    const Menuitem = defineComponent(props => {
        useDataCollect(menuItemManageKey).supply({ ...props });
        return () => createElement('button');
    }, {
        name: 'VueMenuItem',
        props: [ 'id', 'focus', 'blur', 'closeSubmenu', 'uncheckRadio' ]
    });

    function renderMenuItem(count: number) {
        const dataset: MenuItemData[] = [];
        const rendered = [];

        for (let i = 0; i < count; i++) {
            const data = {
                id: String(i + 1),
                focus: vitest.fn(),
                blur: vitest.fn(),
                closeSubmenu: vitest.fn(),
                uncheckRadio: vitest.fn()
            };

            dataset.push(data);
            rendered.push(createElement(Menuitem, data));
        }

        return { dataset, rendered };
    }

    const defaultGlobalProvide = config.global.provide,
          dispatchCommand = vitest.fn(),
          containerContext = {
              status: ref(false),
              relatedEvent: shallowRef<Event | null>(null),
              toggle: vitest.fn()
          };

    beforeAll(() => config.global.provide = {
        [dispatchCommandKey as symbol]: dispatchCommand,
        [containerContextKey as symbol]: containerContext
    });

    afterAll(() => config.global.provide = defaultGlobalProvide);

    afterEach(() => containerContext.status.value = false);

    it('create component', () => {
        const instance = mount(Menu);
        expect(instance.exists()).toBe(true);

        const menu = instance.find('[role="menu"]');
        expect(menu.exists()).toBe(true);
    });

    it('add order to child elements', () => {
        const Context = defineComponent(() => () => createElement('div'), { name: 'VueMenuContext' }),
              Menuitem = defineComponent(() => () => createElement('div'), { name: 'VueMenuItem' }),
              SetupComponent = defineComponent(() => () => createElement('div'), { name: 'Setup' }),
              FunctionalComponent = () => createElement('div');

        const instance = mount(Menu, {
            slots: { default: () => [
                createElement(Fragment, [
                    createElement(Context),
                    createElement(Menuitem),
                    createElement(SetupComponent),
                    createElement(FunctionalComponent),
                    createElement(Menuitem)
                ]),
                createElement(Context),
                createElement(Menuitem),
                createElement(SetupComponent),
                createElement(FunctionalComponent),
                createElement(Menuitem)
            ] }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.find('[role=menu]').findAll('div').map(child => child.attributes(AttrPositionInSet)))
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

    describe('focus management', () => {
        let instance: VueWrapper;
        let menuItemDataset: MenuItemData[] = [];

        beforeEach(() => {
            const { dataset, rendered } = renderMenuItem(4);

            menuItemDataset = dataset;

            instance = mount(Menu, { slots: { default: () => rendered } });
            expect(instance.exists()).toBe(true);
        });

        afterEach(() => menuItemDataset = []);

        it('focus first menuitem on Home', async () => {
            await instance.get('[role="menu"]').trigger('keydown', { key: 'Home' });
            expect(menuItemDataset.at(0)?.focus).toBeCalled();
        });

        it('focus last menuitem on End', async () => {
            await instance.get('[role="menu"]').trigger('keydown', { key: 'End' });
            expect(menuItemDataset.at(-1)?.focus).toBeCalled();
        });

        it('focus next menuitem on arrow down', async () => {
            await instance.get('[role="menu"]').trigger('keydown', { key: 'Home' });
            await instance.get('[role="menu"]').trigger('keydown', { key: 'ArrowDown' });
            expect(menuItemDataset.at(1)?.focus).toBeCalled();
        });

        it('from the last to the first on arrow down', async () => {
            await instance.get('[role="menu"]').trigger('keydown', { key: 'End' });
            await instance.get('[role="menu"]').trigger('keydown', { key: 'ArrowDown' });
            expect(menuItemDataset.at(0)?.focus).toBeCalled();
        });

        it('focus previous menuitem on arrow up', async () => {
            await instance.get('[role="menu"]').trigger('keydown', { key: 'End' });
            await instance.get('[role="menu"]').trigger('keydown', { key: 'ArrowUp' });
            expect(menuItemDataset.at(-2)?.focus).toBeCalled();
        });

        it('from the first to the last on arrow up', async () => {
            await instance.get('[role="menu"]').trigger('keydown', { key: 'Home' });
            await instance.get('[role="menu"]').trigger('keydown', { key: 'ArrowUp' });
            expect(menuItemDataset.at(-1)?.focus).toBeCalled();
        });
    });

    describe('watch container context', () => {
        it.for([
            [ 'ArrowUp', [ 0, 1 ] ],
            [ ' ', [ 1, 0 ] ],
            [ 'Enter', [ 1, 0 ] ],
            [ 'ArrowDown', [ 1, 0 ] ],
            [ 'ArrowRight', [ 1, 0 ] ]
        ])('status is true, relatedEvent key: %s', async ([ key, calledTimes ]) => {
            const { dataset, rendered } = renderMenuItem(2);
            const instance = mount(Menu, { slots: { default: () => rendered } });

            containerContext.status.value = true;
            containerContext.relatedEvent.value = new KeyboardEvent('keydown', { key: key as string });

            await flushPromises();
            expect(instance.exists()).toBe(true);
            dataset.forEach((data, index) => expect(data.focus).toBeCalledTimes(calledTimes?.at(index) as number));
        });

        it('status is false', async () => {
            containerContext.status.value = true;

            const { dataset, rendered } = renderMenuItem(2);
            const instance = mount(Menu, { slots: { default: () => rendered } });

            containerContext.status.value = false;

            await flushPromises();
            expect(instance.exists()).toBe(true);
            dataset.forEach(data => expect(data.blur).toBeCalled());
        });
    });

    it('emit command event and bubble', async () => {
        const command = 1,
              component = () => {
                  const dispatchCommand = inject(dispatchCommandKey, null);
                  return createElement('button', { onClick: () => dispatchCommand?.(command) });
              },
              instance = mount(Menu, { slots: { default: () => createElement(component) } });

        expect(instance.exists()).toBe(true);

        await instance.get('button').trigger('click');
        expect(instance.emitted('command')).toEqual([ [ command ] ]);
        expect(dispatchCommand).toBeCalledWith(command);
        expect(containerContext.toggle).toBeCalledWith(false);
    });
});

import { afterEach, describe, expect, it, vitest } from 'vitest';
import { enableAutoUnmount, mount, shallowMount, flushPromises } from '@vue/test-utils';
import type { InjectionKey } from 'vue';
import { defineComponent, h as createElement, ref } from 'vue';
import {
    Role,
    useDataCollect,
    useEventIgnore,
    useFocusManagement
} from '../src/component/internal/util';
import type { DataManager } from '../src/component/internal/util';

enableAutoUnmount(afterEach);

describe('util', () => {
    describe('useDataCollect', () => {
        const itemManageKey = Symbol() as InjectionKey<DataManager<{ id: number }>>;

        const Container = defineComponent({
            name: 'Container',
            setup(_, { expose, slots }) {
                const { demand } = useDataCollect(itemManageKey);
                expose({ dataset: demand().dataset });
                return () => createElement('div', slots['default']?.());
            }
        });

        const Item = defineComponent({
            name: 'Item',
            props: [ 'id', 'order' ],
            setup(props) {
                const { supply } = useDataCollect(itemManageKey);
                if (props.order) {
                    supply({ id: props.id }, props.order);
                } else {
                    supply({ id: props.id });
                }
                return () => createElement('span');
            }
        });

        it('no data', () => {
            const instance = shallowMount(Container);
            expect(instance.exists()).toBe(true);
            // @ts-expect-error vm.dataset
            expect(instance.vm['dataset']()).toHaveLength(0);
        });

        it('unordered data', () => {
            const instance = mount(Container, {
                slots: {
                    default: () => [
                        createElement(Item, { id: 2 }),
                        createElement(Item, { id: 1 })
                    ]
                }
            });

            expect(instance.exists()).toBe(true);
            // @ts-expect-error vm.dataset
            expect(instance.vm.dataset()).toEqual([ { id: 2 }, { id: 1 } ]);
        });

        it('ordered data', () => {
            const instance = mount(Container, {
                slots: {
                    default: () => [
                        createElement(Item, { id: 2, order: 2 }),
                        createElement(Item, { id: 1, order: 1 })
                    ]
                }
            });

            expect(instance.exists()).toBe(true);
            // @ts-expect-error vm.dataset
            expect(instance.vm.dataset()).toEqual([ { id: 1 }, { id: 2 } ]);
        });
    });

    it('useFocusManagement', async () => {
        const button = document.createElement('button');
        vitest.spyOn(button, 'focus');

        const buttonRef = ref(button),
              tabindex = ref(-1);

        const { focus, blur } = useFocusManagement(buttonRef, tabindex);

        expect(button.focus).not.toBeCalled();
        expect(tabindex.value).toBe(-1);

        await focus();
        expect(button.focus).toBeCalled();
        expect(tabindex.value).toBe(0);

        await blur();
        expect(tabindex.value).toBe(-1);
    });

    it('useEventIgnore', async () => {
        const Parent = defineComponent((props, { slots }) => {
            const { isCanProcessEvent } = useEventIgnore(Role.CONTEXT);
            const result = ref(true);
            const onMouseenter = (event: Event) => result.value = isCanProcessEvent(event);
            return () => createElement('div', { onMouseenter }, [
                createElement('p', result.value),
                slots['default']?.()
            ]);
        });
        const Child = defineComponent(() => {
            const { parentIgnoreEvent } = useEventIgnore(Role.CONTEXT);
            const onMouseenter = (event: Event) => parentIgnoreEvent(event, Role.CONTEXT);
            return () => createElement('button', { onMouseenter });
        });

        const instance = mount(Parent, {
            slots: { default: () => createElement(Child) },
            attachTo: document.body
        });
        expect(instance.exists()).toBe(true);
        expect(instance.get('p').text()).toBe('true');

        instance.get('button').element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await flushPromises();
        expect(instance.get('p').text()).toBe('false');
    });
});

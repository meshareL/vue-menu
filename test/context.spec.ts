import { describe, it, afterEach, expect, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, mount, flushPromises } from '@vue/test-utils';
import { h as createElement, ref } from 'vue';
import Context from '../src/component/context';
import {
    containerContextKey,
    menubarContextKey,
    menubarItemManageKey,
    eventIgnoreKey
} from '../src/component/internal/key';
import { Role } from '../src/component/internal/util';
import classes from '../src/css/context.module.scss';

enableAutoUnmount(afterEach);

describe('Context component', () => {
    it('create component', () => {
        const instance = shallowMount(Context);
        expect(instance.exists()).toBe(true);
    });

    it('create submenu context', () => {
        const instance = mount(Context, { slots: { default: () => createElement(Context) } });
        expect(instance.exists()).toBe(true);

        const context = instance.findAllComponents(Context).at(0);
        expect(context?.exists()).toBe(true);
        expect(context?.classes(classes.submenuContext)).toBe(true);
    });

    describe('slot trigger prop', () => {
        it('alone', () => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps }) => createElement('button', triggerProps) }
            });

            expect(instance.exists()).toBe(true);

            const button = instance.get('button');
            expect(button.attributes()).not.toHaveProperty('tabindex');
            expect(button.attributes('role')).toBe('button');
            expect(button.attributes('aria-haspopup')).toBe('menu');
            expect(button.attributes()).toHaveProperty('aria-expanded');
            expect(button.attributes()).toHaveProperty('aria-controls');
        });

        it('submenu trigger', () => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps }) => createElement('button', triggerProps) },
                global: { provide: { [containerContextKey as symbol]: { } } }
            });

            expect(instance.exists()).toBe(true);

            const button = instance.get('button');
            expect(button.attributes('tabindex')).toBe('-1');
            expect(button.attributes()).not.toHaveProperty('role');
            expect(button.attributes('aria-haspopup')).toBe('menu');
            expect(button.attributes()).toHaveProperty('aria-expanded');
            expect(button.attributes()).toHaveProperty('aria-controls');
        });

        it('menubar trigger', () => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps }) => createElement('button', triggerProps) },
                global: { provide: { [menubarContextKey as symbol]: { } } }
            });

            expect(instance.exists()).toBe(true);

            const button = instance.get('button');
            expect(button.attributes('tabindex')).toBe('-1');
            expect(button.attributes('role')).toBe('menuitem');
            expect(button.attributes('aria-haspopup')).toBe('menu');
            expect(button.attributes()).toHaveProperty('aria-expanded');
            expect(button.attributes()).toHaveProperty('aria-controls');
        });
    });

    it('escape close menu', async () => {
        const instance = mount(Context, {
            slots: { default: ({ triggerProps, triggerRef, status }) => [
                createElement('button', { ...triggerProps, ref: triggerRef }),
                createElement('p', status)
            ] }
        });
        expect(instance.exists()).toBe(true);

        const button = instance.get('button'),
              text = instance.get('p');
        expect(button.attributes('aria-expanded')).toBe('false');
        expect(text.text()).toBe('false');

        await button.trigger('click');
        expect(button.attributes('aria-expanded')).toBe('true');
        expect(text.text()).toBe('true');

        await instance.trigger('keydown', { key: 'Escape' });
        expect(instance.emitted('toggle')?.at(1)).toEqual([ false ]);
        expect(button.attributes('aria-expanded')).toBe('false');
        expect(text.text()).toBe('false');
    });

    it('tab lose focus close menu', async () => {
        const instance = mount(Context, {
            slots: { default: ({ triggerProps, triggerRef, status }) => [
                createElement('button', { ...triggerProps, ref: triggerRef }),
                createElement('p', status)
            ] }
        });

        expect(instance.exists()).toBe(true);

        const text = instance.get('p');
        expect(text.text()).toBe('false');

        await instance.get('button').trigger('click');
        expect(text.text()).toBe('true');

        await instance.trigger('keydown', { key: 'Tab' });
        expect(text.text()).toBe('false');
    });

    it('click outside close menu', async () => {
        const instance = mount(Context, {
            slots: { default: ({ menuRef, triggerProps, triggerRef, status }) => [
                createElement('button', { ...triggerProps, ref: triggerRef }),
                createElement('p', { ref: menuRef }, status)
            ] },
            attachTo: document.body
        });
        expect(instance.exists()).toBe(true);

        const button = instance.get('button'),
              p = instance.get('p');
        expect(button.attributes('aria-expanded')).toBe('false');
        expect(p.text()).toBe('false');

        await button.trigger('click');
        expect(button.attributes('aria-expanded')).toBe('true');
        expect(p.text()).toBe('true');

        document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flushPromises();
        expect(instance.emitted('toggle')?.at(1)).toEqual([ false ]);
        expect(button.attributes('aria-expanded')).toBe('false');
        expect(p.text()).toBe('false');
    });

    describe('menu trigger', () => {
        it('click open menu', async () => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps, status }) => [
                    createElement('button', triggerProps),
                    createElement('p', status)
                ] }
            });

            expect(instance.exists()).toBe(true);

            const button = instance.get('button');
            const text = instance.get('p');

            expect(button.attributes('aria-expanded')).toBe('false');
            expect(text.text()).toBe('false');
            expect(instance.emitted()).not.toHaveProperty('toggle');

            await button.trigger('click');
            expect(button.attributes('aria-expanded')).toBe('true');
            expect(text.text()).toBe('true');
            expect(instance.emitted('toggle')?.at(0)).toEqual([ true ]);

            await button.trigger('click');
            expect(button.attributes('aria-expanded')).toBe('false');
            expect(text.text()).toBe('false');
            expect(instance.emitted('toggle')?.at(1)).toEqual([ false ]);
        });

        it.for([
            [ ' ', 'Space' ],
            [ 'Enter', 'Enter' ],
            [ 'ArrowUp', 'ArrowUp' ],
            [ 'ArrowDown', 'ArrowDown' ]
        ])('keyboard open menu, key: %s -> %s', async ([ key ]) => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps, status }) => [
                    createElement('button', triggerProps),
                    createElement('p', status)
                ] }
            });

            expect(instance.exists()).toBe(true);

            const button = instance.get('button');
            expect(button.attributes('aria-expanded')).toBe('false');
            expect(instance.get('p').text()).toBe('false');
            expect(instance.emitted()).not.toHaveProperty('toggle');

            await button.trigger('keydown', { key: key! });
            expect(button.attributes('aria-expanded')).toBe('true');
            expect(instance.get('p').text()).toBe('true');
            expect(instance.emitted('toggle')).toEqual([ [ true ] ]);
        });

        // eslint-disable-next-line
        it("no 'Space', 'Enter', 'ArrowUp', 'ArrowDown', not open menu", async () => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps, status }) => [
                    createElement('button', triggerProps),
                    createElement('p', status)
                ] }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.get('p').text()).toBe('false');
            expect(instance.emitted()).not.toHaveProperty('toggle');

            await instance.get('button').trigger('keydown', { key: 'ArrowLeft' });
            expect(instance.get('p').text()).toBe('false');
            expect(instance.emitted()).not.toHaveProperty('toggle');
        });
    });

    describe('submenu trigger', () => {
        it('mouseenter open menu', async () => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps, status }) => [
                    createElement('button', triggerProps),
                    createElement('p', status)
                ] },
                global: { provide: { [containerContextKey as symbol]: { } } }
            });

            expect(instance.exists()).toBe(true);

            const trigger = instance.get('button');
            const text = instance.get('p');

            expect(text.text()).toBe('false');

            await trigger.trigger('mouseenter');
            expect(text.text()).toBe('true');
        });

        it.for([
            [ ' ', 'Space' ],
            [ 'Enter', 'Enter' ],
            [ 'ArrowRight', 'ArrowRight' ]
        ])('keyboard open menu, key: %s -> %s', async ([ key ]) => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps, status }) => [
                    createElement('button', triggerProps),
                    createElement('p', status)
                ] },
                global: { provide: { [containerContextKey as symbol]: { } } }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.emitted()).not.toHaveProperty('toggle');
            expect(instance.get('p').text()).toBe('false');

            await instance.get('button').trigger('keydown', { key: key! });
            expect(instance.emitted('toggle')?.at(0)?.at(0)).toBe(true);
            expect(instance.get('p').text()).toBe('true');
        });

        // todo: trigger tabindex
        // eslint-disable-next-line
        it("no 'Space', 'Enter', 'ArrowRight', not open menu", async () => {
            const instance = mount(Context, {
                slots: { default: ({ triggerProps, status }) => [
                    createElement('button', triggerProps),
                    createElement('p', status)
                ] },
                global: { provide: { [containerContextKey as symbol]: { } } }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.emitted()).not.toHaveProperty('toggle');
            expect(instance.get('p').text()).toBe('false');

            await instance.get('button').trigger('keydown', { key: 'ArrowLeft' });
            expect(instance.emitted()).not.toHaveProperty('toggle');
            expect(instance.get('p').text()).toBe('false');
        });
    });

    describe('in menubar', () => {
        describe('focus management', () => {
            it('any menu opened, open menu after focusing and close menu after blurring', async () => {
                const menubarItemManage = { addData: vitest.fn(), removeData: vitest.fn() };
                const instance = mount(Context, {
                    slots: { default: ({ triggerRef, status }) => [
                        createElement('button', { ref: triggerRef }),
                        createElement('p', status)
                    ] },
                    global: { provide: {
                        [menubarContextKey as symbol]: { isAnyMenuOpened: ref(true) },
                        [menubarItemManageKey as symbol]: menubarItemManage
                    } }
                });

                expect(instance.exists()).toBe(true);
                expect(instance.find('p').text()).toBe('false');

                await menubarItemManage.addData.mock.calls.at(0)?.at(0)?.focus();
                expect(instance.find('p').text()).toBe('true');

                await menubarItemManage.addData.mock.calls.at(0)?.at(0)?.blur();
                expect(instance.find('p').text()).toBe('false');
            });

            it('no opened menu, not open after focus', async () => {
                const menubarItemManage = { addData: vitest.fn(), removeData: vitest.fn() };
                const instance = mount(Context, {
                    slots: { default: ({ triggerProps, triggerRef, status }) => [
                        createElement('button', { ...triggerProps, ref: triggerRef }),
                        createElement('p', status)
                    ] },
                    global: { provide: {
                        [menubarContextKey as symbol]: { isAnyMenuOpened: ref(false) },
                        [menubarItemManageKey as symbol]: menubarItemManage
                    } }
                });

                expect(instance.exists()).toBe(true);
                expect(instance.get('p').text()).toBe('false');

                await menubarItemManage.addData.mock.calls.at(0)?.at(0)?.focus();
                expect(instance.get('p').text()).toBe('false');
            });

            it('after Escape close the menu, focus trigger', async () => {
                const instance = mount(Context, { slots: {
                    default: ({ triggerProps, triggerRef }) => createElement(
                        'button',
                        { ...triggerProps, ref: triggerRef }
                    ) } });

                expect(instance.exists()).toBe(true);

                const button = instance.get('button');
                const focus = vitest.spyOn(button.element, 'focus');

                await button.trigger('click');
                expect(focus).not.toBeCalled();

                await instance.trigger('keydown', { key: 'Escape' });
                expect(focus).toBeCalled();
            });
        });

        describe('trigger hover', () => {
            it('any menu opened, hover to open menu', async () => {
                const closeAllMenu = vitest.fn();
                const instance = mount(Context, {
                    slots: { default: ({ triggerProps, triggerRef, status }) => [
                        createElement('button', { ...triggerProps, ref: triggerRef }),
                        createElement('p', status)
                    ] },
                    global: { provide: {
                        [menubarContextKey as symbol]: { isAnyMenuOpened: ref(true), closeAllMenu }
                    } }
                });

                expect(instance.exists()).toBe(true);

                const button = instance.get('button'),
                      text = instance.get('p');
                expect(text.text()).toBe('false');
                expect(instance.emitted()).not.toHaveProperty('toggle');
                expect(closeAllMenu).not.toBeCalled();

                await button.trigger('mouseenter');
                expect(text.text()).toBe('true');
                expect(instance.emitted('toggle')?.at(0)).toEqual([ true ]);
                expect(closeAllMenu).toBeCalled();
            });

            it('no opened menu, not open after hover', async () => {
                const instance = mount(Context, {
                    slots: { default: ({ triggerProps, triggerRef, status }) => [
                        createElement('button', { ...triggerProps, ref: triggerRef }),
                        createElement('p', status)
                    ] },
                    global: { provide: {
                        [menubarContextKey as symbol]: { isAnyMenuOpened: ref(false) }
                    } }
                });

                expect(instance.exists()).toBe(true);
                expect(instance.get('p').text()).toBe('false');

                await instance.get('button').trigger('mouseenter');
                expect(instance.get('p').text()).toBe('false');
            });
        });

        describe('menu trigger', () => {
            it.for([
                [ ' ', 'Space' ],
                [ 'Enter', 'Enter' ],
                [ 'ArrowUp', 'ArrowUp' ],
                [ 'ArrowDown', 'ArrowDown' ]
            ])('no opened menu, keyboard open menu, key: %s -> %s', async ([ key ]) => {
                const menuHavaBeenOpened = vitest.fn();
                const instance = mount(Context, {
                    slots: { default: ({ triggerProps, status }) => [
                        createElement('button', triggerProps),
                        createElement('p', status)
                    ] },
                    global: { provide: {
                        [menubarContextKey as symbol]: { isAnyMenuOpened: ref(false), menuHavaBeenOpened }
                    } }
                });

                expect(instance.exists()).toBe(true);

                const button = instance.get('button');
                expect(button.attributes('aria-expanded')).toBe('false');
                expect(instance.get('p').text()).toBe('false');
                expect(instance.emitted()).not.toHaveProperty('toggle');
                expect(menuHavaBeenOpened).not.toBeCalled();

                await button.trigger('keydown', { key: key! });
                expect(button.attributes('aria-expanded')).toBe('true');
                expect(instance.get('p').text()).toBe('true');
                expect(instance.emitted('toggle')).toEqual([ [ true ] ]);
                expect(menuHavaBeenOpened).toBeCalled();
            });

            it.for([
                [ ' ', 'Space' ],
                [ 'Enter', 'Enter' ],
                [ 'ArrowRight', 'ArrowRight' ]
            ])('submenu, keyboard open menu, key: %s -> %s', async ([ key ]) => {
                const ignoreEvent = vitest.fn();
                const instance = mount(Context, {
                    slots: { default: ({ triggerProps, status }) => [
                        createElement('button', triggerProps),
                        createElement('p', status)
                    ] },
                    global: { provide: {
                        [menubarContextKey as symbol]: { },
                        [containerContextKey as symbol]: { },
                        [eventIgnoreKey as symbol]: ignoreEvent
                    } }
                });

                expect(instance.exists()).toBe(true);
                expect(instance.emitted()).not.toHaveProperty('toggle');
                expect(instance.get('p').text()).toBe('false');

                await instance.get('button').trigger('keydown', { key: key! });
                expect(instance.emitted('toggle')?.at(0)?.at(0)).toBe(true);
                expect(instance.get('p').text()).toBe('true');
                expect(ignoreEvent.mock.calls.at(0)?.includes(Role.MENUBAR));
            });

            // eslint-disable-next-line
            it("no 'Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowRight', not open menu", async () => {
                const instance = mount(Context, {
                    slots: { default: ({ triggerProps, status }) => [
                        createElement('button', triggerProps),
                        createElement('p', status)
                    ] },
                    global: { provide: {
                        [menubarContextKey as symbol]: { },
                        [containerContextKey as symbol]: { }
                    } }
                });

                expect(instance.exists()).toBe(true);
                expect(instance.emitted()).not.toHaveProperty('toggle');
                expect(instance.get('p').text()).toBe('false');

                await instance.get('button').trigger('keydown', { key: 'ArrowLeft' });
                expect(instance.emitted()).not.toHaveProperty('toggle');
                expect(instance.get('p').text()).toBe('false');
            });
        });
    });
});

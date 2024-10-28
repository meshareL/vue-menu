import {
    cloneVNode,
    defineComponent,
    Fragment,
    h as createElement,
    nextTick,
    provide,
    ref,
    shallowReadonly,
    onMounted,
    onBeforeUnmount
} from 'vue';
import type { HTMLAttributes, PropType, PublicProps, Ref, VNode, SlotsType } from 'vue';
import { dispatchCommandKey, menubarContextKey, menubarItemManageKey } from './internal/key';
import type { Command, MenubarItemData } from './internal/key';
import { generateId, Role, useDataCollect, useEventIgnore, AttrPositionInSet } from './internal/util';
import type { DataManager } from './internal/util';
import classes from '../css/context.module.scss';

type Prop = {
    /** @default vertical */
    orientation?: 'horizontal' | 'vertical';
};

type MenuitemEventHandler = {
    mouseenter: (event: MouseEvent) => void;
    focusin: (event: FocusEvent) => void;
};

function markChildOrder(children: VNode[],
                        menuitemRefs: Ref<Array<{ order: number; element: HTMLElement }>>,
                        dataManager: DataManager<MenubarItemData>,
                        menuitemEventHandler: MenuitemEventHandler) {
    let order = 1;

    function createData(currentOrder: number): MenubarItemData {
        async function focus(): Promise<void> {
            await nextTick();
            const menuitem = menuitemRefs.value.find(value => value.order === currentOrder)?.element;
            if (!(menuitem instanceof HTMLElement)) {
                return Promise.reject();
            }

            menuitem.tabIndex = 0;
            return menuitem.focus();
        }

        async function blur(): Promise<void> {
            await nextTick();
            const menuitem = menuitemRefs.value.find(value => value.order === currentOrder)?.element;
            if (!(menuitem instanceof HTMLElement)) {
                return Promise.reject();
            }

            menuitem.tabIndex = -1;
        }

        return { id: generateId(), focus, blur, closeMenu: () => { /* Don't do anything */ } };
    }

    function make(nodes: VNode[]) {
        return nodes.map(node => {
            if (node.type === Fragment) {
                const cloned = cloneVNode(node);
                cloned.children = cloned.children && make(cloned.children as VNode[]);
                return cloned;
            }

            if (typeof node.type === 'object'
                && 'name' in node.type
                && node.type.name === 'VueMenuContext') {
                return cloneVNode(node, { [AttrPositionInSet]: order++ });
            }

            if (node.props?.['role'] === 'menuitem') {
                const currentOrder = order++;
                const data: Record<string, unknown> = {
                    ref: (el: HTMLElement) => menuitemRefs.value.push({ order: currentOrder, element: el }),
                    onVnodeMounted: () => dataManager.addData(createData(currentOrder), currentOrder),
                    onVnodeUnmounted: () => dataManager.removeData(currentOrder),
                    [AttrPositionInSet]: currentOrder,
                    tabindex: currentOrder === 1 ? 0 : -1,
                    onMouseenter: menuitemEventHandler.mouseenter,
                    onFocusin: menuitemEventHandler.focusin
                };

                return cloneVNode(node, data, true);
            }

            return node;
        });
    }

    return make(children);
}

const component = defineComponent((props, { slots, emit }) => {
    const menuitemRefs = ref<Array<{ order: number; element: HTMLElement }>>([]);

    // 菜单栏默认只能通过鼠标点击或键盘打开对应菜单
    // 但当已经打开菜单栏中的某一项后, 可以通过鼠标悬停打开菜单栏中的其他菜单
    const isAnyMenuOpened = ref(false);
    const menubarRef = ref<HTMLDivElement | null>(null);
    const {
        dataset: getItemDataset,
        addData: addItemData,
        removeData: removeItemData
    } = useDataCollect(menubarItemManageKey).demand();

    function clickOutside(event: MouseEvent): void {
        if (!isAnyMenuOpened.value
            || menubarRef.value === null
            || !(event.target instanceof Node)
            || menubarRef.value.contains(event.target)) {
            return;
        }

        isAnyMenuOpened.value = false;
        getItemDataset().forEach(item => item.closeMenu());
    }

    onMounted(() => document.addEventListener('click', clickOutside));
    onBeforeUnmount(() => document.removeEventListener('click', clickOutside));

    const { isCanProcessEvent } = useEventIgnore(Role.MENUBAR);

    let activeDescendant: string | null = null;

    async function onKeyboardNavigation(event: KeyboardEvent): Promise<void> {
        if (!isCanProcessEvent(event)) return;

        let index = -1;
        const itemDataset = getItemDataset();
        const lastIndex = itemDataset.length - 1;

        switch (event.key) {
            case 'Home':
                index = 0;
                break;
            case 'End':
                index = lastIndex;
                break;
            case 'ArrowLeft': {
                let currentIndex = itemDataset.findIndex(value => value.id === activeDescendant);
                currentIndex = currentIndex === -1 ? 0 : currentIndex;
                index = currentIndex <= 0 ? lastIndex : currentIndex - 1;
                break;
            }
            case 'ArrowRight': {
                let currentIndex = itemDataset.findIndex(value => value.id === activeDescendant);
                currentIndex = currentIndex === -1 ? 0 : currentIndex;
                index = currentIndex >= lastIndex ? 0 : currentIndex + 1;
                break;
            }
        }

        if (index === -1) return;

        const first = itemDataset[0],
              current = itemDataset.find(value => value.id === activeDescendant),
              next = itemDataset[index];

        if (next === undefined) return;

        !event.defaultPrevented && event.preventDefault();

        await first?.blur();
        await current?.blur();
        await next.focus();
        activeDescendant = next.id;
    }

    function onKeydown(event: KeyboardEvent): void {
        if (!isCanProcessEvent(event)) return;

        if (event.key === 'Tab' || event.key === 'Escape') {
            isAnyMenuOpened.value = false;
            getItemDataset().forEach(value => value.closeMenu());
        }
    }

    function onMenuitemIsNoticed(event: MouseEvent | FocusEvent): void {
        if (!isAnyMenuOpened.value) return;

        !event.defaultPrevented && event.preventDefault();
        getItemDataset().forEach(value => value.closeMenu());
    }

    function dispatchCommand(command?: Command): void {
        emit('command', command);
    }

    provide(dispatchCommandKey, dispatchCommand);
    provide(menubarContextKey, shallowReadonly({
        isAnyMenuOpened,
        menuHavaBeenOpened: () => isAnyMenuOpened.value = true,
        closeAllMenu: () => getItemDataset().forEach(value => value.closeMenu())
    }));

    return () => {
        const data: Record<string, unknown> = {
            ref: menubarRef,
            class: classes.menubar,
            role: 'menubar',
            'aria-orientation': props.orientation,
            onKeydown: [ onKeyboardNavigation, onKeydown ]
        };

        return createElement(
            'div',
            data,
            markChildOrder(
                slots.default?.() ?? [],
                menuitemRefs,
                { addData: addItemData, removeData: removeItemData },
                { mouseenter: onMenuitemIsNoticed, focusin: onMenuitemIsNoticed }
            )
        );
    };
}, {
    name: 'VueMenuMenubar',
    inheritAttrs: true,
    props: {
        orientation: {
            type: String as PropType<'horizontal' | 'vertical'>,
            required: false,
            default: 'horizontal',
            validator: (value: string) => [ 'horizontal', 'vertical' ].includes(value)
        }
    },
    emits: { command: null as never as (command?: Command) => void },
    slots: Object as SlotsType<{ default?: Record<string, unknown> }>
});

export default component as never as new() => {
    $props:
        PublicProps
        & HTMLAttributes
        & Prop
        & { onCommand?: (command?: Command) => void };

    $slots: { default?: () => VNode[] };
};
export type { Prop };

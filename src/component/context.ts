import {
    defineComponent,
    h as createElement,
    inject,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    shallowReadonly,
    toRef,
    watch,
    shallowRef
} from 'vue';
import type {
    ComponentPublicInstance,
    HTMLAttributes,
    PropType,
    PublicProps,
    VNode,
    SlotsType
} from 'vue';
import { flip, offset, shift, useFloating } from '@floating-ui/vue';
import type { Placement } from '@floating-ui/vue';
import {
    containerContextKey,
    menuRequiredDataKey,
    menubarContextKey,
    menubarItemManageKey,
    menuItemManageKey
} from './internal/key';
import {
    generateId,
    getPositionInSet,
    Role,
    useDataCollect,
    useEventIgnore,
    useFocusManagement
} from './internal/util';
import classes from '../css/context.module.scss';

type Prop = {
    /** @default false */
    defaultOpen?: boolean;
    /**
     * 指定菜单显示的位置
     *
     * 如果是子菜单则值为 `right-start`, 否则为 `bottom-start`
     *
     * @default bottom-start | right-start
     * @see Placement
     */
    placement?: Placement;
};

type DefaultSlotProp = {
    status: boolean;
    toggle: (value?: boolean, relatedEvent?: Event) => void;
    menuRef: (element: ComponentPublicInstance | Element | null) => void;
    triggerRef: (element: ComponentPublicInstance | Element | null) => void;
    triggerProps: Record<string, unknown>;
};

const component = defineComponent((props, { slots, emit }) => {
    // top most context
    const menubarContext = inject(menubarContextKey, null),
          parentContainerContext = inject(containerContextKey, null);

    const selfId = generateId(),
          menuId = generateId(),
          isOpen = ref(props.defaultOpen),
          relatedEvent = shallowRef<Event | null>(null);

    function toggle(value: boolean = !isOpen.value, toggleRelatedEvent?: Event): void {
        if (isOpen.value === value) return;

        isOpen.value = value;
        relatedEvent.value = toggleRelatedEvent ?? null;

        emit('toggle', value);
    }

    const contextRef = ref<HTMLDivElement | null>(null);

    function clickOutside(event: MouseEvent): void {
        if (isOpen.value === false
            || contextRef.value === null
            || !(event.target instanceof Node)) {
            return;
        }

        if (contextRef.value.contains(event.target)) return;

        toggle(false, event);
    }

    onMounted(() => {
        if (menubarContext || parentContainerContext) return;
        document.addEventListener('click', clickOutside);
    });

    onBeforeUnmount(() => document.removeEventListener('click', clickOutside));

    const triggerRef = ref<ComponentPublicInstance | Element | null>(null);
    const floatingRef = ref<ComponentPublicInstance | HTMLElement | null>(null);

    const { floatingStyles, update } = useFloating(triggerRef, floatingRef, {
        open: isOpen,
        strategy: 'fixed',
        transform: false,
        placement: toRef(props, 'placement'),
        middleware: [ offset(parentContainerContext ? 13 : 10), flip(), shift({ padding: 5 }) ]
    });

    // 菜单栏打开后, 强制重新计算元素位置, 保证元素可以正常定位
    watch(isOpen, value => value && update());

    // 如果是菜单栏的第一个菜单项, 则将 tabindex 设置为 0, 防止 Tab 焦点无法进入菜单项
    const triggerTabIndex = ref(menubarContext && getPositionInSet() === 1 ? 0 : -1);

    const { isCanProcessEvent, parentIgnoreEvent } = useEventIgnore(Role.CONTEXT);
    const {
        focus: triggerFocus,
        blur: triggerBlur
    } = useFocusManagement(triggerRef, triggerTabIndex);

    async function onContextKeyboard(event: KeyboardEvent): Promise<void> {
        if (!isOpen.value || !isCanProcessEvent(event)) return;

        if ((parentContainerContext && event.key === 'ArrowLeft')
            || event.key === 'Escape') {
            !event.defaultPrevented && event.preventDefault();
            toggle(false, event);

            parentContainerContext && parentIgnoreEvent(event, Role.MENUBAR, Role.CONTEXT);
            return await triggerFocus();
        }

        if (event.key === 'Tab') {
            toggle(false, event);
            return await triggerBlur();
        }
    }

    async function onTriggerKeyboard(event: KeyboardEvent): Promise<void> {
        if (menubarContext) {
            if (![ ' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowRight' ].includes(event.key)) {
                return;
            }

            if (parentContainerContext) {
                if (isOpen.value || ![ ' ', 'Enter', 'ArrowRight' ].includes(event.key)) return;

                toggle(true, event);
                parentIgnoreEvent(event, Role.MENUBAR, Role.CONTEXT);
            } else {
                if (event.key === 'ArrowRight') return;

                if (menubarContext.isAnyMenuOpened.value) {
                    relatedEvent.value = event;
                } else {
                    toggle(true, event);
                    menubarContext.menuHavaBeenOpened();
                }
            }

            !event.defaultPrevented && event.preventDefault();
            return;
        }

        if (isOpen.value) return;

        if (parentContainerContext) {
            if (![ ' ', 'Enter', 'ArrowRight' ].includes(event.key)) return;

            !event.defaultPrevented && event.preventDefault();
            toggle(true, event);
            parentIgnoreEvent(event, Role.CONTEXT);
            return;
        }

        if (![ ' ', 'Enter', 'ArrowUp', 'ArrowDown' ].includes(event.key)) return;

        !event.defaultPrevented && event.preventDefault();
        // https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/#keyboardinteraction
        toggle(true, event);
        // await triggerBlur();
    }

    function onTriggerMouseEnter(event: MouseEvent): void {
        // 如果是子菜单的 trigger, 则不需要判断是否是菜单栏子组件, 可以直接处理该事件
        if (parentContainerContext) {
            toggle(true, event);
            parentIgnoreEvent(event, Role.CONTEXT);
            return;
        }

        if (!menubarContext || !menubarContext.isAnyMenuOpened.value) return;

        menubarContext.closeAllMenu();
        toggle(true, event);
        parentIgnoreEvent(event, Role.MENUBAR);
    }

    function onTriggerClick(event: MouseEvent): void {
        if (parentContainerContext) return;

        !event.defaultPrevented && event.preventDefault();
        toggle(!isOpen.value, event);
        isOpen.value && menubarContext?.menuHavaBeenOpened();
    }

    // submenu ----------------------------------------------
    useDataCollect(menuItemManageKey).supply(
        {
            id: selfId,
            focus: triggerFocus,
            blur: triggerBlur,
            uncheckRadio: () => { /* Don't do anything */ },
            closeSubmenu: () => parentContainerContext && toggle(false)
        },
        getPositionInSet()
    );

    // menubar ---------------------------------------------
    async function inMenubarTriggerFocusManagement(focus: boolean): Promise<void> {
        if (focus) {
            await triggerFocus();
        } else {
            await triggerBlur();
        }

        if (parentContainerContext
            || !menubarContext
            || !menubarContext.isAnyMenuOpened.value) {
            return;
        }

        toggle(focus);
    }

    !parentContainerContext && useDataCollect(menubarItemManageKey).supply({
        id: selfId,
        focus: () => inMenubarTriggerFocusManagement(true),
        blur: () => inMenubarTriggerFocusManagement(false),
        closeMenu: () => toggle(false)
    }, getPositionInSet());

    provide(menuRequiredDataKey, { id: menuId, style: floatingStyles });
    provide(containerContextKey, shallowReadonly({
        parent: parentContainerContext,
        status: shallowReadonly(isOpen),
        relatedEvent: shallowReadonly(relatedEvent),
        toggle
    }));

    return () => {
        const triggerProps: Record<string, unknown> = {
            tabindex: (parentContainerContext || menubarContext) ? triggerTabIndex.value : null,
            role: parentContainerContext ? null : menubarContext ? 'menuitem' : 'button',
            'aria-haspopup': 'menu',
            'aria-expanded': String(isOpen.value),
            'aria-controls': menuId,
            onClick: onTriggerClick,
            onKeydown: onTriggerKeyboard,
            onMouseenter: onTriggerMouseEnter
        };
        const slotData: DefaultSlotProp = {
            status: isOpen.value,
            toggle,
            // https://github.com/vuejs/core/blob/main/packages/runtime-core/src/vnode.ts#L869
            menuRef: (element: ComponentPublicInstance | Element | null) => {
                if (element instanceof HTMLElement || (element !== null && '$el' in element)) {
                    floatingRef.value = element;
                } else {
                    floatingRef.value = null;
                }
            },
            triggerRef: (element: ComponentPublicInstance | Element | null) => triggerRef.value = element,
            triggerProps
        };
        const data: Record<string, unknown> = {
            ref: contextRef,
            class: { [classes.submenuContext]: parentContainerContext },
            onKeydown: onContextKeyboard
        };

        return createElement('div', data, slots.default?.(slotData));
    };
}, {
    name: 'VueMenuContext',
    inheritAttrs: true,
    props: {
        defaultOpen: {
            type: Boolean,
            required: false,
            default: false
        },
        placement: {
            type: String as PropType<Placement>,
            required: false,
            default: () => inject(containerContextKey, null) ? 'right-start' : 'bottom-start'
        }
    },
    emits: { toggle: null as never as (value: boolean) => void },
    slots: Object as SlotsType<{ default?: DefaultSlotProp }>
});

export default component as never as new() => {
    $props: PublicProps & HTMLAttributes & Prop;
    $slots: { default?: (props: DefaultSlotProp) => VNode[] };
};
export type { Prop };

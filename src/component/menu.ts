import {
    cloneVNode,
    defineComponent,
    Fragment,
    h as createElement,
    inject,
    provide,
    shallowReadonly,
    toRef,
    Transition,
    vShow,
    watch,
    withDirectives
} from 'vue';
import type { HTMLAttributes, PropType, PublicProps, VNode, SlotsType } from 'vue';
import {
    containerContextKey,
    dispatchCommandKey,
    menuRequiredDataKey,
    menuContextKey,
    menuItemManageKey
} from './internal/key';
import type { Command } from './internal/key';
import { Role, useDataCollect, useEventIgnore, AttrPositionInSet } from './internal/util';
import classes from '../css/menu.module.scss';

type Prop = {
    /** @default vertical */
    orientation?: 'horizontal' | 'vertical';
};

function markChildOrder(nodes: VNode[]): VNode[] {
    let childOrder = 1;

    function make(_nodes: VNode[]): VNode[] {
        return _nodes.map(node => {
            // v-for
            if (node.type === Fragment) {
                const cloned = cloneVNode(node);
                cloned.children = cloned.children && make(cloned.children as VNode[]);
                return cloned;
            }

            if (typeof node.type === 'object'
                && 'name' in node.type
                && [ 'VueMenuContext', 'VueMenuItem' ].includes(node.type.name)) {
                return cloneVNode(node, { [AttrPositionInSet]: childOrder++ });
            }

            return node;
        });
    }

    return make(nodes);
}

const component = defineComponent((props: { orientation: 'horizontal' | 'vertical' }, { slots, emit }) => {
    const menuRequiredData = inject(menuRequiredDataKey, null),
          containerContext = inject(containerContextKey, null);

    const parentDispatchCommand = inject(dispatchCommandKey, null);

    function dispatchCommand(command?: Command): void {
        emit('command', command);
        parentDispatchCommand?.(command);
        containerContext?.toggle(false);
    }

    const parentMenuContext = inject(menuContextKey, null);

    let activeDescendant: string | null = null;
    const { dataset: getMenuitemDataset } = useDataCollect(menuItemManageKey).demand();
    const { isCanProcessEvent, parentIgnoreEvent } = useEventIgnore(Role.MENU);

    /**
     * @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/#keyboardinteraction
     * @see https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#keyboardnavigationinsidecomponents
     */
    async function onMenuKeyboardNavigation(event: KeyboardEvent): Promise<void> {
        if (!isCanProcessEvent(event)) return;

        let index = -1;
        const menuitemDataset = getMenuitemDataset();
        const lastIndex = menuitemDataset.length - 1;
        switch (event.key) {
            case 'Home':
                index = 0;
                break;
            case 'End':
                index = lastIndex;
                break;
            case 'ArrowUp': {
                let currentIndex = menuitemDataset.findIndex(value => value.id === activeDescendant);
                currentIndex = currentIndex === -1 ? lastIndex : currentIndex;
                index = currentIndex <= 0 ? lastIndex : currentIndex - 1;
                break;
            }
            case 'ArrowDown': {
                let currentIndex = menuitemDataset.findIndex(value => value.id === activeDescendant);
                currentIndex = currentIndex === -1 ? 0 : currentIndex;
                index = currentIndex >= lastIndex ? 0 : currentIndex + 1;
                break;
            }
        }

        if (index === -1) return;

        const current = menuitemDataset.find(value => value.id === activeDescendant),
              next = menuitemDataset[index];
        if (next === undefined) return;

        !event.defaultPrevented && event.preventDefault();
        parentIgnoreEvent(event, Role.MENU);

        await current?.blur();
        await next.focus();
        activeDescendant = next.id;
    }

    watch(() => containerContext?.status.value, async status => {
        if (status) return;

        for (const menuitem of getMenuitemDataset()) {
            await menuitem.blur();
            menuitem.closeSubmenu();
        }

        activeDescendant = null;
    }, { immediate: true });

    watch(() => containerContext?.relatedEvent.value, async event => {
        if (!containerContext?.status.value
            || event?.type !== 'keydown') {
            return;
        }

        const menuitemDataset = getMenuitemDataset();
        const current = menuitemDataset.find(value => value.id === activeDescendant);

        switch ((event as KeyboardEvent).key) {
            case 'ArrowUp': {
                const next = menuitemDataset[menuitemDataset.length - 1];
                await current?.blur();
                await next?.focus();
                activeDescendant = next?.id ?? null;
                break;
            }
            case ' ':
            case 'Enter':
            case 'ArrowDown':
            case 'ArrowRight': {
                const next = menuitemDataset[0];
                await current?.blur();
                await next?.focus();
                activeDescendant = next?.id ?? null;
                break;
            }
        }
    }, { immediate: true });

    provide(dispatchCommandKey, dispatchCommand);
    provide(menuContextKey, shallowReadonly({
        parent: parentMenuContext,
        orientation: toRef(props, 'orientation'),
        uncheckSameGroupRadio: (name: string) => getMenuitemDataset().forEach(i => i.uncheckRadio(name)),
        closeAllSubmenu: () => getMenuitemDataset().forEach(item => item.closeSubmenu())
    }));

    return () => {
        const data: Record<string, unknown> = {
            id: menuRequiredData?.id,
            class: [ classes.menu ],
            style: menuRequiredData?.style.value,
            role: 'menu',
            'aria-orientation': props.orientation,
            onKeydown: onMenuKeyboardNavigation
        };

        return createElement(
            Transition,
            {
                name: 'vue-menu',
                type: 'transition',
                css: true,
                mode: 'out-in'
            },
            () => withDirectives(
                createElement(
                    'div',
                    data,
                    markChildOrder(slots.default?.() ?? [])
                ),
                [ [ vShow, containerContext?.status.value ] ]
            )
        );
    };
}, {
    name: 'VueMenu',
    inheritAttrs: true,
    props: {
        orientation: {
            type: String as PropType<'horizontal' | 'vertical'>,
            required: false,
            default: 'vertical',
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

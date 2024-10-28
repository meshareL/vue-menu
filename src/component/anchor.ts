import {
    defineComponent,
    h as createElement,
    inject
} from 'vue';
import type {
    PublicProps,
    ButtonHTMLAttributes,
    VNode,
    SlotsType
} from 'vue';
import { ChevronRight } from './icon';
import { menuContextKey } from './internal/key';
import classes from '../css/menuitem.module.scss';

const component = defineComponent((props, { slots }) => {
    const menuContext = inject(menuContextKey, null);

    function onMouseEnter(event: MouseEvent): void {
        !event.defaultPrevented && event.preventDefault();
        menuContext?.closeAllSubmenu();
    }

    return () => {
        const data: Record<string, unknown> = {
            class: classes.anchor,
            type: 'button',
            role: 'menuitem',
            onMouseenter: onMouseEnter
        };

        const children: VNode[] = [ ];

        slots.leading && children.push(createElement('span', { class: classes.leading }, slots.leading()));
        children.push(createElement('span', { class: classes.label }, slots.default?.()));
        children.push(createElement(ChevronRight, { class: classes.chevronRight }));
        slots.description && children.push(createElement('span', { class: classes.description }, slots.description()));

        return createElement('button', data, children);
    };
}, {
    name: 'VueMenuAnchor',
    inheritAttrs: true,
    slots: Object as SlotsType<{
        leading?: Record<string, unknown>;
        default?: Record<string, unknown>;
        description?: Record<string, unknown>;
    }>
});

export default component as unknown as new() => {
    $props:
        PublicProps
        & ButtonHTMLAttributes;

    $slots: {
        default?: () => VNode[];
        leading?: () => VNode[];
        description?: () => VNode[];
    };
};

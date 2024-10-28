import { h as createElement, inject, computed } from 'vue';
import type { FunctionalComponent, PropType } from 'vue';
import { menuContextKey } from './internal/key';

type Prop = {
    orientation?: 'horizontal' | 'vertical';
};

const component: FunctionalComponent<Prop> = props => {
    const menuContext = inject(menuContextKey, null);
    const orientation = computed(() => {
        if (props.orientation) {
            return props.orientation;
        }

        if (menuContext) {
            return menuContext.orientation.value === 'vertical'
                ? 'horizontal'
                : 'vertical';
        }

        return 'horizontal';
    });

    return createElement('hr', { role: 'separator', 'aria-orientation': orientation.value });
};

component.displayName = 'VueMenuDivider';
component.inheritAttrs = true;
component.props = {
    orientation: {
        type: String as PropType<'horizontal' | 'vertical'>,
        required: false,
        validator: (value: string) => [ 'horizontal', 'vertical' ].includes(value)
    }
};

export default component;
export type { Prop };

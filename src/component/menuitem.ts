import {
    defineComponent,
    h as createElement,
    inject,
    ref,
    watch,
    mergeProps
} from 'vue';
import type {
    PublicProps,
    HTMLAttributes,
    VNode,
    PropType,
    VNodeChild,
    SlotsType
} from 'vue';
import { dispatchCommandKey, menuItemManageKey, menuContextKey } from './internal/key';
import type { Command } from './internal/key';
import { Check, Uncheck } from './icon';
import { generateId, useFocusManagement, useDataCollect, getPositionInSet } from './internal/util';
import classes from '../css/menuitem.module.scss';

// type Tristate = 'true' | 'false' | 'mixed';

type Prop = {
    /**
     * 类型为 radio 或 checkbox 时, 支持 `v-model`
     *
     * radio 只支持 `string` 类型
     *
     * checkbox 支持 `boolean`, `Array`, `Set` 类型
     */
    modelValue?: string | boolean | Array<string> | Set<string>;
    /** @default command */
    type?: 'command' | 'radio' | 'checkbox';
    disabled?: boolean;
    command?: Command;
    /**
     * 当类型为 radio 或 checkbox 并且 **使用v-model** 时, 组件会自动创建一个隐藏的 input 元素,
     * 通过该参数设置该 input 元素
     */
    name?: string;
    /**
     * 当类型为 radio 或 checkbox, 并且 **使用 v-model** 时, 组件会自动创建一个隐藏的 input 元素,
     * 通过该参数设置该 input 元素
     */
    value?: string;
    /**
     * 类型为 radio 或 checkbox, 并且 **未使用 v-model** 时, 使用该参数设置默认值
     *
     * @default false
     */
    defaultChecked?: boolean;
};

const component = defineComponent((props, { slots, emit, attrs }) => {
    const id = generateId();
    const checked = ref<boolean>(false);

    watch(() => props.type, type => {
        if (type === 'command') return;

        if (props.modelValue === null || props.modelValue === undefined) {
            return checked.value = props.defaultChecked;
        }

        if (type === 'radio') {
            return checked.value = props.modelValue === props.value;
        }

        if (typeof props.modelValue === 'boolean') {
            return checked.value = props.modelValue;
        }

        if (Array.isArray(props.modelValue)) {
            return checked.value = props.modelValue.includes(props.value!);
        }

        if (props.modelValue instanceof Set) {
            return checked.value = props.modelValue.has(props.value!);
        }
    },
          { immediate: true }
    );

    watch(() => props.modelValue, modelValue => {
        if (props.type === 'command'
            || modelValue === null
            || modelValue === undefined) {
            return checked.value = false;
        }

        if (props.type === 'radio') {
            return checked.value = modelValue === props.value;
        }

        if (typeof modelValue === 'boolean') {
            return checked.value = modelValue;
        }

        if (Array.isArray(modelValue)) {
            return checked.value = modelValue.includes(props.value!);
        }

        if (modelValue instanceof Set) {
            return checked.value = modelValue.has(props.value!);
        }
    });

    const menuContext = inject(menuContextKey, null),
          menuitemRef = ref<HTMLElement | null>(null),
          tabindex = ref(-1),
          { focus, blur } = useFocusManagement(menuitemRef, tabindex);

    useDataCollect(menuItemManageKey).supply(
        {
            id,
            focus,
            blur,
            uncheckRadio: (name: string): void => {
                if (props.type !== 'radio' || name !== props.name) return;
                checked.value = false;
            },
            closeSubmenu: () => { /* Don't do anything */ }
        },
        getPositionInSet()
    );

    const dispatchCommand = inject(dispatchCommandKey, null),
          inputRef = ref<HTMLInputElement | null>(null);

    function commitCommand(event: MouseEvent): void {
        if (props.disabled) return;
        !event.defaultPrevented && event.preventDefault();

        if (props.type === 'command') {
            emit('command', props.command);
            dispatchCommand?.(props.command);
            return;
        }

        // 如果组件未使用 v-model 指令, 则只更新本地状态
        if (props.modelValue === null || props.modelValue === undefined) {
            if (props.type === 'radio') {
                menuContext?.uncheckSameGroupRadio(props.name ?? '');
                checked.value = true;
                return;
            }

            checked.value = !checked.value;
            return;
        }

        if (!(inputRef.value instanceof HTMLInputElement)) return;

        if (props.type === 'radio') {
            emit('update:modelValue', props.value!);
            return;
        }

        // single checkbox
        // todo: checkbox mixed
        if (typeof props.modelValue === 'boolean') {
            emit('update:modelValue', !checked.value);
            return;
        }

        if (Array.isArray(props.modelValue)) {
            const arr = Array.from(props.modelValue);
            const index = arr.indexOf(props.value ?? '');

            if (index === -1) {
                arr.push(props.value!);
            } else {
                arr.splice(index, 1);
            }

            emit('update:modelValue', arr);
            return;
        }

        if (props.modelValue instanceof Set) {
            const set = new Set(props.modelValue);
            if (set.has(props.value!)) {
                set.delete(props.value!);
            } else {
                set.add(props.value!);
            }

            emit('update:modelValue', set);
            return;
        }
    }

    function onMouseEnter(event: MouseEvent): void {
        !event.defaultPrevented && event.preventDefault();
        menuContext?.closeAllSubmenu();
    }

    return () => {
        const data = mergeProps(attrs, {
            ref: menuitemRef,
            class: classes.menuitem,
            tabindex: tabindex.value,
            type: slots['as'] ? null : 'button',
            role: `menuitem${props.type === 'command' ? '' : props.type}`,
            'aria-disabled': props.disabled.toString(),
            'aria-checked': props.type === 'command' ? null : checked.value,
            onClick: commitCommand,
            onMouseenter: onMouseEnter
        });

        // 自定义渲染内容
        if (slots.as) {
            return slots.as((data));
        }

        let children: VNodeChild = [ slots.default?.() ];

        if (slots.trailing || slots.description) {
            children = [];

            children.push(createElement('span', { class: classes.label }, slots.default?.()));
            slots.trailing && children.push(createElement('span', { class: classes.trailing }, slots.trailing()));
            slots.description && children.push(createElement('span', { class: classes.description }, slots.description()));
        }

        if (props.type !== 'command') {
            const input = createElement('input', {
                ref: inputRef,
                type: props.type,
                name: props.name,
                value: props.value,
                checked: checked.value,
                hidden: true
            }), leading = createElement('span', { class: classes.leading }, [
                createElement(Check, { class: classes.check }),
                createElement(Uncheck, { class: classes.uncheck })
            ]);

            children = [ leading, input, children ];
        } else if (slots.leading) {
            children = [
                createElement('span', { class: classes.leading }, slots.leading()),
                children
            ];
        }

        return createElement('button', data, children);
    };
}, {
    name: 'VueMenuItem',
    inheritAttrs: false,
    props: {
        modelValue: {
            type: [ String, Boolean, Array, Set ] as PropType<string | boolean | Array<string> | Set<string>>,
            required: false,
            default: undefined
        },
        type: {
            type: String as PropType<'command' | 'radio' | 'checkbox'>,
            required: false,
            default: 'command',
            validator: (value: string) => [ 'command', 'radio', 'checkbox' ].includes(value)
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        command: {
            type: [ Number, String, Object ] as PropType<Command>,
            required: false,
            default: undefined
        },
        name: {
            type: String,
            required: false
        },
        value: {
            type: String,
            required: false
        },
        defaultChecked: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: {
        command: null as unknown as (command?: Command) => void,
        'update:modelValue': null as unknown as (value: string | boolean | Array<string> | Set<string>) => void
    },
    slots: Object as SlotsType<{
        as?: Record<string, unknown>;
        default?: Record<string, unknown>;
        leading?: Record<string, unknown>;
        trailing?: Record<string, unknown>;
        description?: Record<string, unknown>;
    }>
});

/**
 * @see https://w3c.github.io/aria/#menuitem
 */
// todo checkbox mixed
export default component as unknown as new() => {
    $props:
        PublicProps
        & HTMLAttributes
        & Prop
        & {
            onCommand?: (command?: Command) => void;
            'onUpdate:modelValue'?: (value: string | boolean | Array<string> | Set<string>) => void;
        };

    $slots: {
        as?: (props: Record<string, unknown>) => VNode[];
        default?: () => VNode[];
        leading?: () => VNode[];
        trailing?: () => VNode[];
        description?: () => VNode[];
    };
};
export type { Prop };

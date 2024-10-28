import {
    nextTick,
    onMounted,
    onUnmounted,
    provide,
    inject,
    getCurrentInstance
} from 'vue';
import type { ComponentPublicInstance, Ref, InjectionKey } from 'vue';
import { eventIgnoreKey } from './key';

type UseEventIgnoreReturn = {
    isCanProcessEvent: (event: Event) => boolean;
    parentIgnoreEvent: (event: Event, ...targets: Role[]) => void;
};

type DataManager<Data> = {
    addData(data: Data): void;
    addData(data: Data, id: number): void;
    removeData(id: number): void;
    removeData(data: Data): void;
};

type UseDataCollectReturn<Data> = {
    demand: () => { dataset: () => Array<Data> } & DataManager<Data>;
    supply(data: Data): void;
    supply(data: Data, id: number): void;
};

const enum Role {
    MENUBAR,
    CONTEXT,
    MENU
}

const AttrPositionInSet = 'data-position-in-set';

function generateId(): string {
    return new Date().getTime().toString(16) + Math.random().toString(16).substring(2);
}

function getPositionInSet(): number {
    const currentInstance = getCurrentInstance();
    if (currentInstance === null) {
        throw new Error('Unable to get current component instance');
    }

    return currentInstance.attrs[AttrPositionInSet] as number;
}

function useDataCollect<Data extends object>(key: InjectionKey<DataManager<Data>>): UseDataCollectReturn<Data> {
    function demand(): ReturnType<UseDataCollectReturn<Data>['demand']> {
        const dataset: Array<{ id: number; data: Data }> = [];

        function addData(data: Data, id: number = -1): void {
            const index = dataset.findIndex(value => id !== -1 ? value.id === id : value.data === data);

            if (index === -1) {
                dataset.push({ id, data });
            } else {
                dataset[index] = { id, data };
            }

            dataset.sort((a, b) => a.id - b.id);
        }

        function removeData(data: Data | number): void {
            const index = dataset.findIndex(value => value[typeof data === 'number' ? 'id' : 'data'] === data);
            if (index !== -1) return;

            dataset.splice(index, 1);
        }

        provide(key, { addData, removeData });
        return {
            dataset: () => dataset.map(value => value.data),
            addData,
            removeData
        };
    }

    function supply(data: Data, id?: number): void {
        const collector = inject(key, null);

        onMounted(() => id !== undefined ? collector?.addData(data, id) : collector?.addData(data));
        onUnmounted(() => id !== undefined ? collector?.removeData(id) : collector?.removeData(data));
    }

    return { demand, supply };
}

function useFocusManagement(elementRef: Ref<ComponentPublicInstance | Element | null>,
                            elementTabindex?: Ref<number>): {
        focus: () => Promise<void>;
        blur: () => Promise<void>;
    } {
    async function focus(): Promise<void> {
        await nextTick();

        if (elementRef.value === null) {
            return Promise.reject();
        }

        const element = elementRef.value instanceof HTMLElement
            ? elementRef.value
            : (elementRef.value as ComponentPublicInstance)['$el'] as HTMLElement;

        elementTabindex && (elementTabindex.value = 0);
        return element.focus();
    }

    async function blur(): Promise<void> {
        elementTabindex && (elementTabindex.value = -1);
        return Promise.resolve();
    }

    return { focus, blur };
}

function useEventIgnore(role: Role): UseEventIgnoreReturn {
    const parentEventIgnore = inject(eventIgnoreKey, null);
    const ignoreEvents: WeakSet<Event> = new WeakSet();

    function ignoreEvent(event: Event, ...targets: Role[]): void {
        if (targets.length === 0) {
            ignoreEvents.add(event);
        } else if (targets.includes(role)) {
            ignoreEvents.add(event);
        }

        parentEventIgnore?.(event, ...targets);
    }

    function parentIgnoreEvent(event: Event, ...targets: Role[]): void {
        parentEventIgnore?.(event, ...targets);
    }

    function isCanProcessEvent(event: Event): boolean {
        return !ignoreEvents.has(event);
    }

    provide(eventIgnoreKey, ignoreEvent);

    return { isCanProcessEvent, parentIgnoreEvent };
}

export {
    generateId,
    getPositionInSet,
    useDataCollect,
    useFocusManagement,
    useEventIgnore,
    Role,
    AttrPositionInSet
};
export type {
    DataManager,
    UseDataCollectReturn,
    UseEventIgnoreReturn
};

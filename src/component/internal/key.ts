import type { InjectionKey, Ref, ShallowRef } from 'vue';
import type { UseFloatingReturn } from '@floating-ui/vue';
import type { DataManager, Role } from './util';

type Command = number | string | Record<string, unknown>;

type Focusable = {
    focus: () => Promise<void>;
    blur: () => Promise<void>;
};

type MenubarContext = {
    isAnyMenuOpened: Readonly<Ref<boolean>>;
    menuHavaBeenOpened: () => void;
    closeAllMenu: () => void;
};

type ContainerContext = {
    parent: Readonly<ContainerContext> | null;
    status: Readonly<Ref<boolean>>;
    relatedEvent: Readonly<ShallowRef<Event | null>>;
    toggle: (value?: boolean, relatedEvent?: Event) => void;
};

type MenuContext = {
    parent: Readonly<MenuContext> | null;
    orientation: Readonly<Ref<'horizontal' | 'vertical'>>;
    uncheckSameGroupRadio: (name: string) => void;
    closeAllSubmenu: () => void;
};

type MenuItemData = Focusable & {
    id: string;
    uncheckRadio: (name: string) => void;
    closeSubmenu: () => void;
};

type MenubarItemData = Focusable & {
    id: string;
    closeMenu: () => void;
};

const containerContextKey = Symbol('VueMenu: container context') as InjectionKey<Readonly<ContainerContext>>,
      menubarContextKey = Symbol('VueMenu: menubar context') as InjectionKey<Readonly<MenubarContext>>,
      menuContextKey = Symbol('VueMenu: menu context') as InjectionKey<Readonly<MenuContext>>;

const menuRequiredDataKey = Symbol('VueMenu: menu required key') as
    InjectionKey<Readonly<{ id: string; style: UseFloatingReturn['floatingStyles'] }>>;

const dispatchCommandKey = Symbol('VueMenu: dispatch command') as InjectionKey<(command?: Command) => void>,
      eventIgnoreKey = Symbol('VueMenu: event ignore') as InjectionKey<(event: Event, ...targets: Role[]) => void>;

const menuItemManageKey = Symbol('VueMenu: menu item manage') as InjectionKey<DataManager<MenuItemData>>,
      menubarItemManageKey = Symbol('VueMenu: menubar item manage') as InjectionKey<DataManager<MenubarItemData>>;

export {
    containerContextKey,
    menubarContextKey,
    menuContextKey,
    menuRequiredDataKey,
    dispatchCommandKey,
    eventIgnoreKey,
    menuItemManageKey,
    menubarItemManageKey
};
export type {
    ContainerContext,
    MenubarContext,
    MenuContext,
    Command,
    MenuItemData,
    MenubarItemData
};

# VueMenu
vue3 菜单组件

> 组件目前未实现菜单栏垂直排列与菜单水平排列的键盘交互

## 安装
```shell
npm install @tomoeed/vue-menu --save
```

## 使用
```vue
<script setup>
import { Context, Menu, Menuitem } from '@tomoeed/vue-menu';
</script>

<template>
<Context #default="{ triggerProps, triggerRef, menuRef }">
    <button type="button" v-bind="triggerProps" :ref="triggerRef">Open menu</button>
    <Menu :ref="menuRef">
        <Menuitem>menuitem</Menuitem>
        <Menuitem>menuitem</Menuitem>
    </Menu>
</Context>
</template>
```

## 组件
### Context
| 属性           | 类型                                                                   | 默认值                          | 说明                                                |
|:-------------|:---------------------------------------------------------------------|:-----------------------------|:--------------------------------------------------|
| defaultOpen  | boolean                                                              | false                        | 菜单是否默认打开                                          |
| placement    | [Placement](https://floating-ui.com/docs/computePosition#placement)  | bottom-start \| right-start  | 菜单默认放置位置为 `bottom-start`, 如果是子菜单则为 `right-start`  |

| 插槽      | 参数                                                                                                                                                                                                                                                                                                  | 说明 |
|:--------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---|
| default | { status: boolean; toggle: (value?: boolean, relatedEvent?: Event) => void; menuRef: [function ref](https://vuejs.org/guide/essentials/template-refs.html#function-refs)]; triggerRef: [function ref](https://vuejs.org/guide/essentials/template-refs.html#function-refs); triggerProps: object; } |    |

用户需要提供一个菜单触发按钮, 并将 `triggerProps` 和 `triggerRef` 属性传递到该按钮, 同时将 `menuRef` 属性传递到 `<Menu>` 组件

```vue
<Context #default="{ triggerProps, triggerRef, menuRef }">
  <button type="button" v-bind="triggerProps" :ref="triggerRef">Open menu</button>
  <Menu :ref="menuRef"></Menu>
</Context>
```

### Menu
| 属性          | 类型                     | 默认值      | 说明     |
|:------------|:-----------------------|:---------|:-------|
| orientation | horizontal \| vertical | vertical | 菜单排列方向 |

### Menuitem
| 属性                  | 类型                                                | 默认值     | 说明                                                                                                                    |
|:--------------------|:--------------------------------------------------|:--------|:----------------------------------------------------------------------------------------------------------------------|
| modelValue(v-model) | string \| boolean \| Array<string> \| Set<string> |         | 类型为 `radio` 或 `checkbox` 时, 支持 `v-model`  `radio` 只支持 `string`  `checkbox` 支持 `boolean` `Array<string>` `Set<string>` |
| type                | command \| radio \| checkbox                      | command | 菜单项类型                                                                                                                 |
| disabled            | boolean                                           | false   |                                                                                                                       |
| command             | number \| string \| object                        |         | command 事件参数                                                                                                          |
| name                | string                                            |         | 类型为 `radio` 或 `checkbox` 时, 需要该参数                                                                                     |
| value               | string                                            |         | 类型为 `radio` 或 `checkbox` 时, 需要该参数                                                                                     |
| defaultChecked      | boolean                                           | false   | 类型为 `radio` 或 `checkbox` 时, 如果未使用 `v-model`, 使用该参数设置组件选中状态                                                            |

| 插槽          | 参数     | 说明                                                  |
|:------------|:-------|:----------------------------------------------------|
| as          | object | 如果你想渲染自定义元素, 可以使用这个插槽                               |
| default     |        |                                                     |
| leading     |        | 可用于显示菜单项图标, 如果菜单项类型为 `radio` 或 `checkbox`, 则不会渲染该插槽 |
| trailing    |        | 该插槽可用于显示与菜单项相关的值, 如: 菜单栏快捷键                         |
| description |        | 菜单项描述                                               |

```vue
<Menuitem #as="props">
  <RouterLink v-bind="props">Link</RouterLink>
</Menuitem>
```

### Anchor
子菜单触发按钮

| 插槽          | 参数     | 说明                                                |
|:------------|:-------|:--------------------------------------------------|
| default     |        |                                                   |
| leading     |        | 可用于显示菜单项图标                                        |
| description |        | 菜单项描述                                             |

```vue
<Context>
  <Menuitem></Menuitem>
  <Context>
    <Anchor></Anchor>
    <Menu></Menu>
  </Context>
</Context>
```

### Divider
菜单项分割线

```vue
<Context>
  <button type="button"></button>
  <Menu>
    <Menuitem></Menuitem>
    <Divider/>
    <Menuitem></Menuitem>
  </Menu>
</Context>
```

### Menubar
| 属性          | 类型                     | 默认值      | 说明     |
|:------------|:-----------------------|:---------|:-------|
| orientation | horizontal \| vertical | vertical | 菜单排列方向 |

菜单栏中的菜单项需要手动添加 `role="menuitem"` 属性, 如果是使用 `<Context>` 创建的菜单则不需要添加该属性

```vue
<Menubar>
  <button type="button" role="menuitem">Button</button>
  <Context>
    <button type="button">Open menu</button>
    <Menu></Menu>
  </Context>
</Menubar>
```

## License
[Apache-2.0](https://github.com/meshareL/vue-menu/blob/master/LICENSE)

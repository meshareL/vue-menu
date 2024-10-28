import { h as createElement } from 'vue';
import type { FunctionalComponent } from 'vue';

const Info: FunctionalComponent = () => {
    const data: Record<string, unknown> = {
        class: [ 'info' ],
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 16 16',
        width: 16,
        height: 16,
        fill: 'currentcolor',
        role: 'img',
        'aria-hidden': 'true'
    }, path = createElement('path', {
        d: 'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 '
            + '7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 '
            + '1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z'
    });
    return createElement('svg', data, path);
};

const ChevronRight: FunctionalComponent = () => {
    const data: Record<string, unknown> = {
        class: [ 'chevron-right' ],
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 16 16',
        width: 16,
        height: 16,
        fill: 'currentcolor',
        role: 'img',
        'aria-hidden': 'true'
    }, path = createElement('path', {
        d: 'M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 '
            + '0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z'
    });
    return createElement('svg', data, path);
};

const Check: FunctionalComponent = () => {
    const data: Record<string, unknown> = {
        class: [ 'check' ],
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 16 16',
        width: 16,
        height: 16,
        fill: 'currentcolor',
        role: 'img',
        'aria-hidden': 'true'
    }, path = createElement('path', {
        d: 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 '
            + '.018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z'
    });
    return createElement('svg', data, path);
};

const Uncheck: FunctionalComponent = () => {
    const data: Record<string, unknown> = {
        class: [ 'uncheck' ],
        role: 'img',
        'aria-hidden': 'true'
    };
    return createElement('span', data);
};

const Indeterminate: FunctionalComponent = () => {
    const data: Record<string, unknown> = {
        class: [ 'indeterminate' ],
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 16 16',
        width: 16,
        height: 16,
        fill: 'currentcolor',
        role: 'img',
        'aria-hidden': 'true'
    }, path = createElement('path', {
        d: 'M2 7.75A.75.75 0 0 1 2.75 7h10a.75.75 0 0 1 0 1.5h-10A.75.75 0 0 1 2 7.75Z'
    });
    return createElement('svg', data, path);
};

export { Info, ChevronRight, Check, Uncheck, Indeterminate };

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [ '**/test/**/*.spec.[jt]s' ],
        environment: 'jsdom',
        clearMocks: true,
        mockReset: true,
        restoreMocks: true,
        reporters: 'basic',
        cacheDir: 'node_modules/.cache/.vitest',
        coverage: {
            enabled: true,
            include: [
                'src/component/context.ts',
                'src/component/menu.ts',
                'src/component/menubar.ts',
                'src/component/menuitem.ts',
                'src/component/anchor.ts',
                'src/component/divider.ts',
                'src/component/internal/util.ts'
            ]
        }
    }
});

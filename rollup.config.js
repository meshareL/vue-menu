import { defineConfig } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

export default defineConfig({
    input: 'src/component/index.ts',
    output: [
        {
            file: 'dist/index.esm.min.js',
            format: 'module',
            sourcemap: true
        },
        {
            file: 'dist/index.umd.min.js',
            format: 'umd',
            name: 'VueMenu',
            exports: 'named',
            globals: { vue: 'Vue', '@floating-ui/vue': 'FloatingUIVue' },
            sourcemap: true
        }
    ],
    external: [
        'vue',
        '@floating-ui/vue'
    ],
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript({ noForceEmit: true }),
        postcss({
            extensions: [ '.css', '.scss' ],
            extract: 'index.min.css',
            modules: {
                localsConvention: 'camelCaseOnly',
                generateScopedName: '[hash:base64:8]'
            },
            minimize: { preset: [ 'default', { cssDeclarationSorter: false } ] },
            sourceMap: true,
            use: [ 'sass' ]
        }),
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'runtime',
            extensions: [ '.js', '.ts', '.cjs', '.mjs' ]
        }),
        terser()
    ]
});

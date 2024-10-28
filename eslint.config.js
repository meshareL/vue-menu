import jslint from '@eslint/js';
import tslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

const stylisticCustomConfig = stylistic.configs.customize({
    indent: 4,
    quotes: 'single',
    semi: true,
    jsx: true,
    commaDangle: 'never',
    quoteProps: 'as-needed',
    braceStyle: '1tbs'
});

export default [
    jslint.configs.recommended,
    ...tslint.configs.recommended,
    stylisticCustomConfig,
    {
        files: [
            '**/*.js',
            '**/*.ts'
        ]
    },
    {
        ignores: [
            'node_modules/**/',
            'dist/**'
        ]
    },
    {
        rules: {
            '@typescript-eslint/no-unused-expressions': [ 'error', {
                allowShortCircuit: true,
                allowTernary: true,
                allowTaggedTemplates: true
            } ],
            '@stylistic/arrow-parens': [ 'warn', 'as-needed' ],
            '@stylistic/indent': [ 'error', 4, {
                SwitchCase: 1,
                VariableDeclarator: 'first',
                FunctionDeclaration: { parameters: 'first' },
                FunctionExpression: { parameters: 'first' },
                CallExpression: { arguments: 'first' }
            } ],
            '@stylistic/array-bracket-spacing': [ 'warn', 'always', {
                singleValue: true,
                objectsInArrays: true,
                arraysInArrays: true
            } ]
        }
    }
];

import pkg from './package.json' with { type: 'json' };

export default {
    presets: [
        [ '@babel/preset-env', {
            // debug: true,
            bugfixes: true,
            useBuiltIns: false
        } ],
        [ '@babel/preset-typescript', {
            allowDeclareFields: true,
            optimizeConstEnums: true,
            onlyRemoveTypeImports: true
        } ]
    ],
    plugins: [
        [ '@babel/plugin-transform-runtime', {
            corejs: false,
            version: pkg.dependencies['@babel/runtime']
        } ],
        [ 'babel-plugin-polyfill-corejs3', {
            // debug: true,
            exclude: [ 'es.array.push' ],
            method: 'usage-pure',
            version: pkg.dependencies['core-js-pure'],
            proposals: true
        } ]
    ]
};

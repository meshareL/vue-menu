/* eslint-disable no-undef,@typescript-eslint/no-require-imports */
const presetEnv = require('postcss-preset-env');

/** @type {import('postcss-load-config').Config} */
module.exports = {
    plugins: [
        presetEnv()
    ]
};

/** @type {import('stylelint').Config} */
export default {
    ignoreFiles: [
        'node_modules/**/*',
        'coverage/**/*',
        'dist/**/*'
    ],
    extends: [
        'stylelint-config-standard',
        'stylelint-config-standard-scss',
        'stylelint-config-css-modules',
        'stylelint-config-recess-order'
    ],
    rules: {
        'no-descending-specificity': null,
        'no-duplicate-selectors': null,
        'custom-property-empty-line-before': null,
        'scss/dollar-variable-empty-line-before': null,
        'scss/double-slash-comment-empty-line-before': null
    }
};

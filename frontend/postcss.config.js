export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {
      overrideBrowserslist: ['>0.2%', 'not dead', 'not op_mini all', 'last 2 versions'],
    },
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: true,
            mergeLonghand: true,
            mergeRules: true,
            minifySelectors: true,
            reduceIdents: false, // Keep animation names
            zindex: false, // Don't optimize z-index values
          },
        ],
      },
    }),
  },
};

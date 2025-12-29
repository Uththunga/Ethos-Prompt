export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Keep viewBox for responsive scaling
          removeViewBox: false,
          // Keep IDs that might be referenced
          cleanupIds: false,
        },
      },
    },
    // Remove unnecessary metadata
    'removeMetadata',
    // Remove comments
    'removeComments',
    // Remove empty containers
    'removeEmptyContainers',
    // Remove unused namespaces
    'removeUnusedNS',
    // Optimize path data
    'convertPathData',
    // Merge paths where possible
    'mergePaths',
    // Remove unnecessary groups
    'collapseGroups',
    // Convert colors to shorter formats
    'convertColors',
    // Remove default attributes
    'removeUselessDefs',
    // Minify styles
    'minifyStyles',
    // Remove empty text elements
    'removeEmptyText',
    // Convert transform attributes
    'convertTransform',
    // Remove unnecessary stroke and fill attributes
    'removeUselessStrokeAndFill',
  ],
};

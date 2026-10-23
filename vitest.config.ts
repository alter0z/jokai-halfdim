/**
 * Vitest configuration
 */

export default {
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['**/._*.test.ts', 'node_modules', 'dist'],
  },
};

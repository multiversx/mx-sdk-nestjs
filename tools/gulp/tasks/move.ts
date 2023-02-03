import { dest, src, task } from 'gulp';

const distFiles = src([
  'packages/**/*',
  '!packages/**/*.ts',
  'packages/**/*.d.ts',
]);

/**
 * Moves the compiled nest files into "node_module" folder.
 */
function moveToNodeModules() {
  return distFiles.pipe(dest('node_modules/@multiversx/sdk-nestjs'));
}

task('move:node_modules', moveToNodeModules);

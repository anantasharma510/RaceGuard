import { Command } from 'commander';
import { spawn } from 'child_process';
import * as path from 'path';

export const startCommand = new Command('start')
  .description('Start the RaceGuard engine (and optionally the UI)')
  .option('--ui', 'Also launch the Next.js dashboard')
  .action((options) => {
    console.log('Starting RaceGuard engine on port 7842...');

    // Use ts-node in dev, compiled dist in production
    const engineSrc = path.resolve(__dirname, '../../../engine/src/main.ts');
    const engineDist = path.resolve(__dirname, '../../../engine/dist/main.js');
    const tsNodeBin = path.resolve(__dirname, '../../../engine/node_modules/.bin/ts-node');

    const useCompiled = require('fs').existsSync(engineDist);
    const engine = useCompiled
      ? spawn('node', [engineDist], { stdio: 'ignore', detached: true, shell: true })
      : spawn(tsNodeBin, [engineSrc], { stdio: 'ignore', detached: true, shell: true });

    engine.unref();
    console.log('Engine started in background. Logs suppressed.');
    console.log('Hit http://localhost:7842 to verify it is running.');

    if (options.ui) {
      console.log('Starting RaceGuard UI on port 7843...');
      const ui = spawn('npx', ['next', 'start', '-p', '7843'], {
        cwd: path.resolve(__dirname, '../../../ui'),
        stdio: 'inherit',
        shell: true,
      });

      ui.on('error', (err) => {
        console.error('Failed to start UI:', err.message);
      });
    }
  });

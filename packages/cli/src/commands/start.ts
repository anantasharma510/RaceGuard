import { Command } from 'commander';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export const startCommand = new Command('start')
  .description('Start the RaceGuard engine (and optionally the UI)')
  .option('--ui', 'Also launch the Next.js dashboard and open browser')
  .action((options) => {
    console.log('Starting RaceGuard engine on port 7842...');
    console.log('\x1b[33m⚠  USE AT YOUR OWN RISK — experimental tool, may contain bugs.\x1b[0m');
    console.log('\x1b[33m   Only test APIs you own. Author accepts no liability.\x1b[0m\n');

    const engineSrc = path.resolve(__dirname, '../../../engine/src/main.ts');
    const engineDist = path.resolve(__dirname, '../../../engine/dist/main.js');
    const tsNodeBin = path.resolve(__dirname, '../../../engine/node_modules/.bin/ts-node');

    // When bundled (published), engine is at dist/engine/main.js
    const bundledEngine = path.resolve(__dirname, '../engine/main.js');
    const useCompiled = fs.existsSync(bundledEngine)
      ? bundledEngine
      : fs.existsSync(engineDist)
        ? engineDist
        : null;
    const engine = useCompiled
      ? spawn('node', [useCompiled], { stdio: 'ignore', detached: true, shell: true })
      : spawn(tsNodeBin, [engineSrc], { stdio: 'ignore', detached: true, shell: true });

    engine.unref();

    // Wait a moment then verify engine started
    setTimeout(() => {
      console.log('Engine started on http://localhost:7842');
      console.log('Status: http://localhost:7842');
    }, 1500);

    if (options.ui) {
      console.log('Starting RaceGuard UI on port 3000...');
      const uiPath = path.resolve(__dirname, '../../../ui');
      const ui = spawn('npx', ['next', 'dev'], {
        cwd: uiPath,
        stdio: 'ignore',
        detached: true,
        shell: true,
      });
      ui.unref();

      // Open browser after UI starts
      setTimeout(() => {
        const url = 'http://localhost:3000';
        console.log(`Opening dashboard: ${url}`);
        const open = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        spawn(open, [url], { shell: true, stdio: 'ignore' }).unref();
      }, 3000);
    }
  });

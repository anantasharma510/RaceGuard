import { Command } from 'commander';
import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const isWindows = process.platform === 'win32';

function spawnBackground(cmd: string, args: string[], cwd?: string) {
  const opts: SpawnOptions = {
    stdio: 'ignore',
    detached: true,
    cwd,
  };

  // On Windows, detached processes need shell:true to work correctly
  if (isWindows) {
    opts.shell = true;
    opts.windowsHide = true;
  }

  const child = spawn(cmd, args, opts);
  child.unref();
  return child;
}

function getNpxCmd(): string {
  return isWindows ? 'npx.cmd' : 'npx';
}

export const startCommand = new Command('start')
  .description('Start the RaceGuard engine (and optionally the UI)')
  .option('--ui', 'Also launch the Next.js dashboard and open browser')
  .action((options) => {
    console.log('Starting RaceGuard engine on port 7842...');
    console.log('\x1b[33m⚠  USE AT YOUR OWN RISK — experimental tool, may contain bugs.\x1b[0m');
    console.log('\x1b[33m   Only test APIs you own. Author accepts no liability.\x1b[0m\n');

    const engineSrc = path.resolve(__dirname, '../../../engine/src/main.ts');
    const engineDist = path.resolve(__dirname, '../../../engine/dist/main.js');
    const bundledEngine = path.resolve(__dirname, '../engine/main.js');

    if (fs.existsSync(bundledEngine)) {
      spawnBackground(process.execPath, [bundledEngine]);
    } else if (fs.existsSync(engineDist)) {
      spawnBackground(process.execPath, [engineDist]);
    } else {
      const tsNodeBin = path.resolve(__dirname, '../../../engine/node_modules/.bin/ts-node');
      const tsNodeExe = isWindows ? tsNodeBin + '.cmd' : tsNodeBin;
      spawnBackground(tsNodeExe, [engineSrc]);
    }

    setTimeout(() => {
      console.log('Engine started on http://localhost:7842');
    }, 1500);

    if (options.ui) {
      console.log('Starting RaceGuard UI on port 3000...');
      const uiPath = path.resolve(__dirname, '../../../ui');

      spawnBackground(getNpxCmd(), ['next', 'dev'], uiPath);

      setTimeout(() => {
        const url = 'http://localhost:3000';
        console.log(`Opening dashboard: ${url}`);
        if (isWindows) {
          spawnBackground('explorer', [url]);
        } else if (process.platform === 'darwin') {
          spawnBackground('open', [url]);
        } else {
          spawnBackground('xdg-open', [url]);
        }
      }, 4000);
    }
  });

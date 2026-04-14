import { Command } from 'commander';
import { execSync, execFileSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as https from 'https';

const isWindows = process.platform === 'win32';

const COMPOSE_URL =
  'https://raw.githubusercontent.com/anantasharma510/RaceGuard/main/docker-compose.yml';

function getComposeDir(): string {
  return path.join(os.homedir(), '.raceguard');
}

function getComposeFile(): string {
  return path.join(getComposeDir(), 'docker-compose.yml');
}

function downloadComposeFile(): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = getComposeDir();
    const file = getComposeFile();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const tmp = file + '.tmp';
    const dest = fs.createWriteStream(tmp);

    https.get(COMPOSE_URL, (res) => {
      if (res.statusCode !== 200) {
        dest.close();
        fs.unlinkSync(tmp);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(dest);
      dest.on('finish', () => {
        dest.close();
        fs.renameSync(tmp, file); // atomic replace
        resolve();
      });
    }).on('error', (err) => {
      dest.close();
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      reject(err);
    });
  });
}

function ensureComposeFile(): Promise<string> {
  const file = getComposeFile();
  return downloadComposeFile()
    .then(() => file)
    .catch((err) => {
      // If download fails but we have a cached copy, use it
      if (fs.existsSync(file)) {
        console.log('\x1b[33m⚠  Could not download latest config (offline?), using cached version.\x1b[0m');
        return file;
      }
      throw new Error(`Failed to download config and no cached version found: ${err.message}`);
    });
}

function checkDocker(): boolean {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Support both `docker compose` (v2) and `docker-compose` (v1)
function getDockerComposeCmd(): string {
  try {
    execSync('docker compose version', { stdio: 'ignore' });
    return 'docker compose';
  } catch {
    try {
      execSync('docker-compose --version', { stdio: 'ignore' });
      return 'docker-compose';
    } catch {
      return 'docker compose'; // default, will fail with a clear error
    }
  }
}

function openBrowser(url: string) {
  try {
    if (isWindows) {
      // 'start' is a cmd built-in, must use cmd /c
      execFileSync('cmd', ['/c', 'start', url], { stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
      execFileSync('open', [url], { stdio: 'ignore' });
    } else {
      execFileSync('xdg-open', [url], { stdio: 'ignore' });
    }
  } catch {
    // Non-fatal — just print the URL
    console.log(`   Open manually: ${url}`);
  }
}

export const startCommand = new Command('start')
  .description('Start the RaceGuard engine and dashboard via Docker')
  .option('--ui', 'Open the dashboard in browser after starting')
  .action(async (options) => {
    console.log('\x1b[33m⚠  USE AT YOUR OWN RISK — experimental tool, may contain bugs.\x1b[0m');
    console.log('\x1b[33m   Only test APIs you own. Author accepts no liability.\x1b[0m\n');

    if (!checkDocker()) {
      console.error('\x1b[31m✗  Docker is not installed or not running.\x1b[0m');
      console.error('   Install Docker Desktop: https://www.docker.com/products/docker-desktop');
      process.exit(1);
    }

    const composeCmd = getDockerComposeCmd();

    console.log('Fetching latest config...');
    let composeFile: string;
    try {
      composeFile = await ensureComposeFile();
    } catch (err: any) {
      console.error(`\x1b[31m✗  ${err.message}\x1b[0m`);
      process.exit(1);
    }

    console.log('Pulling latest Docker image...');
    try {
      execSync(`${composeCmd} -f "${composeFile}" pull`, { stdio: 'inherit' });
    } catch {
      console.log('\x1b[33m⚠  Could not pull latest image, using cached version if available.\x1b[0m');
    }

    console.log('Starting RaceGuard...');
    try {
      execSync(`${composeCmd} -f "${composeFile}" up -d`, { stdio: 'inherit' });
    } catch {
      console.error('\x1b[31m✗  Failed to start containers. Make sure Docker Desktop is running.\x1b[0m');
      process.exit(1);
    }

    console.log('\n\x1b[32m✓  RaceGuard started.\x1b[0m');
    console.log('   Engine:    http://localhost:7842');
    console.log('   Dashboard: http://localhost:3004\n');

    if (options.ui) {
      setTimeout(() => openBrowser('http://localhost:3004'), 3000);
    }
  });

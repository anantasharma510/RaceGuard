import { Command } from 'commander';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

function getComposeFile(): string {
  return path.join(os.homedir(), '.raceguard', 'docker-compose.yml');
}

function getDockerComposeCmd(): string {
  try {
    execSync('docker compose version', { stdio: 'ignore' });
    return 'docker compose';
  } catch {
    try {
      execSync('docker-compose --version', { stdio: 'ignore' });
      return 'docker-compose';
    } catch {
      return 'docker compose';
    }
  }
}

export const stopCommand = new Command('stop')
  .description('Stop the RaceGuard engine and dashboard')
  .action(() => {
    const composeFile = getComposeFile();

    if (!fs.existsSync(composeFile)) {
      // Fallback: try stopping by container name directly
      try {
        execSync('docker stop raceguard', { stdio: 'ignore' });
        execSync('docker rm raceguard', { stdio: 'ignore' });
        console.log('\x1b[32m✓  RaceGuard stopped.\x1b[0m');
      } catch {
        console.log('RaceGuard does not appear to be running.');
      }
      return;
    }

    const composeCmd = getDockerComposeCmd();
    try {
      execSync(`${composeCmd} -f "${composeFile}" down`, { stdio: 'inherit' });
      console.log('\x1b[32m✓  RaceGuard stopped.\x1b[0m');
    } catch {
      console.log('RaceGuard is not running or Docker is not available.');
    }
  });

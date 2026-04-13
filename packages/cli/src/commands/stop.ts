import { Command } from 'commander';
import { execSync } from 'child_process';

const isWindows = process.platform === 'win32';

export const stopCommand = new Command('stop')
  .description('Stop the RaceGuard engine running on port 7842')
  .action(() => {
    console.log('Stopping RaceGuard engine on port 7842...');

    try {
      if (isWindows) {
        // Find and kill process using port 7842 on Windows
        const result = execSync('netstat -ano | findstr :7842', { encoding: 'utf8' });
        const lines = result.trim().split('\n');
        const pids = new Set<string>();

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') pids.add(pid);
        }

        if (pids.size === 0) {
          console.log('No process found on port 7842. Engine may not be running.');
          return;
        }

        for (const pid of pids) {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`Killed process ${pid}`);
        }
      } else {
        // macOS/Linux
        execSync('lsof -ti:7842 | xargs kill -9', { stdio: 'ignore' });
      }

      console.log('RaceGuard engine stopped.');
    } catch {
      console.log('No process found on port 7842. Engine may not be running.');
    }
  });

#!/usr/bin/env node
import { Command } from 'commander';
import { idempotencyCommand } from './commands/idempotency';
import { invariantCommand } from './commands/invariant';
import { flakyCommand } from './commands/flaky';
import { startCommand } from './commands/start';
import { stopCommand } from './commands/stop';

const program = new Command();

program
  .name('raceguard')
  .description('Prove your API handles concurrent requests correctly.\n\n  ⚠  USE AT YOUR OWN RISK — experimental tool built as a personal learning project.\n     May contain bugs. Only test APIs you own. Author accepts no liability.')
  .version('1.0.6');

program.addCommand(startCommand);
program.addCommand(stopCommand);
program.addCommand(idempotencyCommand);
program.addCommand(invariantCommand);
program.addCommand(flakyCommand);

program.parse(process.argv);

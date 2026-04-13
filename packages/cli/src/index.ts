#!/usr/bin/env node
import { Command } from 'commander';
import { idempotencyCommand } from './commands/idempotency';
import { invariantCommand } from './commands/invariant';
import { flakyCommand } from './commands/flaky';
import { startCommand } from './commands/start';

const program = new Command();

program
  .name('raceguard')
  .description('Prove your API handles concurrent requests correctly')
  .version('0.1.0');

program.addCommand(startCommand);
program.addCommand(idempotencyCommand);
program.addCommand(invariantCommand);
program.addCommand(flakyCommand);

program.parse(process.argv);

#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createUser, listUsers } = require('../auth');

function printUsage() {
  console.log(`
SENTINEL User Provisioning Tool
===============================
Usage:
  node server/cli/create-user.js --username <user> --password <pass> [--role <operator|administrator>]
  node server/cli/create-user.js --list

Options:
  --username <name>     Username (3-32 alphanumeric characters, dashes, underscores)
  --password <secret>   Password (minimum 10 characters)
  --role <role>         Role: 'operator' (default) or 'administrator'
  --list                List existing registered users (usernames & roles)

Examples:
  node server/cli/create-user.js --username sec_admin --password "StrongPass#2026!" --role administrator
  node server/cli/create-user.js --username observer_1 --password "FieldOperator99!" --role operator
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--username' && args[i + 1]) {
      options.username = args[++i];
    } else if (args[i] === '--password' && args[i + 1]) {
      options.password = args[++i];
    } else if (args[i] === '--role' && args[i + 1]) {
      options.role = args[++i];
    } else if (args[i] === '--list') {
      options.list = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      options.help = true;
    }
  }

  return options;
}

function main() {
  const opts = parseArgs();

  if (opts.help || (!opts.list && (!opts.username || !opts.password))) {
    printUsage();
    process.exit(opts.help ? 0 : 1);
  }

  if (opts.list) {
    const users = listUsers();
    console.log(`\nRegistered Users (${users.length}):`);
    console.log('------------------------------------------------------------');
    users.forEach(u => {
      console.log(`• ID: ${u.id.padEnd(26)} User: ${u.username.padEnd(16)} Role: ${u.role.padEnd(14)} Created: ${u.createdAt}`);
    });
    console.log('------------------------------------------------------------\n');
    return;
  }

  const role = opts.role || 'operator';

  try {
    const created = createUser({
      username: opts.username,
      password: opts.password,
      role
    });

    console.log(`\n[SUCCESS] User account provisioned successfully.`);
    console.log(`  User ID:  ${created.id}`);
    console.log(`  Username: ${created.username}`);
    console.log(`  Role:     ${created.role}`);
    console.log(`  Created:  ${created.createdAt}\n`);
  } catch (err) {
    console.error(`\n[ERROR] Failed to create user: ${err.message}\n`);
    process.exit(1);
  }
}

main();

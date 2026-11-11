#!/usr/bin/env node
/**
 * Xcode 27 replaced Simulator.app with DeviceHub.app (Contents/Applications), but the RN CLI
 * hard-codes `<developer dir>/Applications/Simulator.app` and aborts `run-ios` before building.
 * Open whichever exists; if neither, skip (the booted simulator still gets the app).
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '../node_modules/@react-native-community/cli-platform-apple/build/commands/runCommand/runOnSimulator.js',
);

if (!fs.existsSync(file)) {
  process.exit(0);
}

const original = "_child_process().default.execFileSync('open', [`${activeDeveloperDir}/Applications/Simulator.app`, '--args', '-CurrentDeviceUDID', simulator.udid]);";
const patched = "const simulatorApp = [`${activeDeveloperDir}/Applications/Simulator.app`, `${activeDeveloperDir}/../Applications/DeviceHub.app`].find(p => require('fs').existsSync(p)); /* patched: patch-rn-cli-simulator */\n  if (simulatorApp) _child_process().default.execFileSync('open', [simulatorApp, '--args', '-CurrentDeviceUDID', simulator.udid]);";

const content = fs.readFileSync(file, 'utf8');
if (content.includes(original)) {
  fs.writeFileSync(file, content.replace(original, patched));
  console.log('patch-rn-cli-simulator: open Simulator.app or DeviceHub.app');
}

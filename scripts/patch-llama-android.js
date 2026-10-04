#!/usr/bin/env node
/**
 * llama.rn rc ships with rnllamaBuildFromSource=true, which compiles the entire
 * llama.cpp tree locally (~40+ min). Force prebuilt jniLibs instead.
 */
const fs = require('fs');
const path = require('path');

const gradleProps = path.join(
  __dirname,
  '../node_modules/llama.rn/android/gradle.properties',
);

if (!fs.existsSync(gradleProps)) {
  process.exit(0);
}

let content = fs.readFileSync(gradleProps, 'utf8');
const next = content.replace(
  /rnllamaBuildFromSource\s*=\s*true/,
  'rnllamaBuildFromSource=false',
);

if (next !== content) {
  fs.writeFileSync(gradleProps, next);
  console.log('patch-llama-android: set rnllamaBuildFromSource=false');
}

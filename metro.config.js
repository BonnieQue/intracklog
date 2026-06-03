const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure node_modules with import.meta (zustand, supabase) get transformed
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Make sure .mjs files are resolved but transformed through Babel
config.resolver.sourceExts = [...(config.resolver.sourceExts || [])];
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// Keep Metro out of folders that aren't part of the app's runtime tree.
// `supabase/functions/*` is Deno (uses Deno.serve / Deno.env) — Metro can't
// parse it. `scripts/` is Node CLI utilities (smoke-test, etc.).
config.resolver.blockList = [
  /supabase[\\/]functions[\\/].*/,
  /scripts[\\/].*/,
];

module.exports = config;

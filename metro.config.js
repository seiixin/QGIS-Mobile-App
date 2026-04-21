const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Explicitly set project root to avoid Windows path resolution issues
config.projectRoot = path.resolve(__dirname);
config.watchFolders = [path.resolve(__dirname)];

module.exports = config;

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Esta es la línea clave que soluciona el problema para la web
config.resolver.assetExts.push('wasm');

module.exports = config;
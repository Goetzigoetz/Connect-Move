const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Inclure les fichiers CSS et CJS comme sources valides
config.resolver.sourceExts.push("css");
config.resolver.sourceExts.push("cjs");

// Désactiver l'activation instable de Package Exports
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });

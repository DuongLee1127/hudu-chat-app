const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// SVG được xử lý như source code thay vì asset
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

// Cho phép import .svg
config.resolver = {
  ...config.resolver,

  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),

  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = withNativeWind(config, {
  input: './global.css',
});

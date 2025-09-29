module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-worklets/plugin',
        {
          globals: ['__scanFaces'],
        },
        'react-native-worklets-plugin',
      ],
      ['react-native-reanimated/plugin', {}, 'react-native-reanimated-plugin'],
    ],
  };
};
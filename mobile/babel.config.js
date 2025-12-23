module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@utils': './src/utils',
            '@services': './src/services',
            '@contexts': './src/contexts',
            '@types': './src/types',
            '@constants': './src/constants',
            '@hooks': './src/hooks',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};



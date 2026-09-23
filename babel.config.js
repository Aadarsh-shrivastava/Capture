module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@/components/ui': './components/ui',
          '@/assets': './assets',
          '@': './src',
          'expo-router': './src/navigation/expo-router-shim',
        },
      },
    ],
  ],
};

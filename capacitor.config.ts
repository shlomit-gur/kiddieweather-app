import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kiddieweather.app',
  appName: 'KiddieWeather',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

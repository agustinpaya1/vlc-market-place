import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vlc.market.place',
  appName: 'vlc-market-place',
  webDir: 'www',
  server: {
    hostname: '192.168.68.135',
    androidScheme: 'https',
    iosScheme: 'https',
    url: 'http://192.168.68.135:4200'
  }
};

export default config;

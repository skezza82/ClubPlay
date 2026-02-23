import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clubplaygaming.app',
  appName: 'ClubPlay',
  webDir: 'out',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    // @ts-expect-error Types missing for Capacitor 8 edge-to-edge
    adjustMarginsForEdgeToEdge: "auto"
  }
};

export default config;

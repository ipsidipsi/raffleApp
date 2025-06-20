import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'raffleApp',
  webDir: 'www',
  server: {
    // This allows your app to make HTTP requests to your server
    cleartext: true,
    allowNavigation: [
      "172.24.234.179:3000", // ✅ Your actual ZeroTier server IP
      "localhost:3000", // ✅ Removed extra comma
      "172.24.0.0/16", // ✅ ZeroTier IP range
      "*.zerotier.com"
    ]
  },
  android: {
    // Allow HTTP traffic (needed for local development)
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
    // ✅ Removed useLegacyBridge (deprecated)
  },
  plugins: {
    // Configure any plugins you might need
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#4f46e5",
      showSpinner: true,
      spinnerColor: "#ffffff"
    }
  }
};

export default config;

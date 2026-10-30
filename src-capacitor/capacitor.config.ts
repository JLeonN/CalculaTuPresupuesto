import { defineCapacitorConfig } from '@quasar/app-vite/capacitor';

export default defineCapacitorConfig({
  appId: 'com.calculatupresupuesto.app',
  appName: 'Calcula tu presupuesto',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
});

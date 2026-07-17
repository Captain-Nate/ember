import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/constants/palette';
import { IAPShopProvider } from '@/hooks/use-theme-shop';

export default function RootLayout() {
  return (
    <IAPShopProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      />
    </IAPShopProvider>
  );
}

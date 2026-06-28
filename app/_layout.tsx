import { useEffect } from 'react';
import { Platform, TextInput } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { CinemaProvider } from '../contexts/CinemaContext';
import { useVersionCheck } from '../hooks/useVersionCheck';
import UpdatePrompt from '../components/UpdatePrompt';
import { syncTitle, isMiniProgram } from '../utils/miniprogram';

// Remove Android bottom underline globally for all TextInputs
if (Platform.OS === 'android') {
  // @ts-ignore
  TextInput.defaultProps = { ...(TextInput.defaultProps || {}), underlineColorAndroid: 'transparent' };
}

const ROUTE_TITLES: Record<string, string> = {
  '/': '青创视界',
  '/(tabs)': '青创视界',
  '/(tabs)/index': '青创视界',
  '/(tabs)/movies': '影片',
  '/(tabs)/orders': '订单',
  '/orders': '订单',
  '/(tabs)/profile': '我的',
  '/notifications': '通知',
  '/coupons': '优惠券',
  '/points': '积分',
  '/edit-profile': '编辑资料',
  '/settings': '设置',
  '/help': '帮助',
  '/my-reviews': '我的评价',
  '/student-cert': '学生认证',
  '/support-chat': '在线客服',
  '/verify-ticket': '验票',
  '/school-picker': '选择高校',
  '/order': '订单详情',
  '/booking': '选座购票',
  '/payment': '确认支付',
};

function TitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isMiniProgram()) return;
    // Dynamic-title pages (movie/[id]) handle their own sync after data loads
    if (pathname.startsWith('/movie/')) return;
    const title = ROUTE_TITLES[pathname]
      ?? Object.entries(ROUTE_TITLES).find(([k]) => pathname.startsWith(k))?.[1]
      ?? '';
    if (title) syncTitle(title);
  }, [pathname]);

  return null;
}

function AppStack() {
  const { isDark } = useTheme();
  const { currentVersion, platform, latestInfo, updateStatus, loading, doUpdate } = useVersionCheck();
  const isForce = updateStatus === 'force';

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        input, textarea, select, [contenteditable] {
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        *:focus { outline: none !important; }
      `;
      style.id = '__app-input-reset';
      if (!document.getElementById('__app-input-reset')) {
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <>
      <TitleSync />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="movie/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cinema/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="booking/[sessionId]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="payment/[orderId]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cinema-admin" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="school-picker" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Force update overlay — shown on top of everything, cannot be dismissed */}
      {!loading && isForce && (
        <UpdatePrompt
          visible={true}
          updateStatus="force"
          latestInfo={latestInfo}
          currentVersion={currentVersion}
          platform={platform}
          onUpdate={doUpdate}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider>
      <AuthProvider>
        <CinemaProvider>
          <AppStack />
        </CinemaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
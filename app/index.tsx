import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../components/SplashScreen';

export default function Index() {
  const { loading } = useAuth();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const navigatedRef = useRef(false);

  const navigate = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace('/(tabs)');
  };

  // Navigate as soon as both splash is done and auth has resolved.
  // Safety: if auth is still loading 3s after splash finishes, navigate anyway.
  useEffect(() => {
    if (!splashDone) return;
    if (!loading) { navigate(); return; }
    const t = setTimeout(() => navigate(), 3000);
    return () => clearTimeout(t);
  }, [splashDone, loading]);

  // Hard fallback: navigate after 10s no matter what
  useEffect(() => {
    const t = setTimeout(() => navigate(), 10000);
    return () => clearTimeout(t);
  }, []);

  const handleSplashFinish = () => setSplashDone(true);

  // On tap, navigate immediately if auth has resolved (unblocks iOS Safari)
  const handleTap = () => {
    if (!loading) navigate();
    else setSplashDone(true);
  };

  return <SplashScreen onFinish={handleSplashFinish} onTap={handleTap} />;
}
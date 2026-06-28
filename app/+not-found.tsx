import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// This screen should never appear in normal use because:
// - The nginx config serves index.html for all unknown paths (SPA fallback)
// - expo-router handles all defined routes client-side
// If it does appear, silently redirect to home so users are never stranded.
export default function NotFoundScreen() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, []);
  return null;
}
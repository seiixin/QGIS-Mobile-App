import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Returns { isOnline, isConnected }
 * isOnline  — true when device has internet access
 * isConnected — true when device has any network (wifi/cell, even no internet)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(state => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    // Subscribe to changes
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => unsub();
  }, []);

  return { isOnline };
}

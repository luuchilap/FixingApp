import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { updateMyLocation, getUserLocation } from '../services/usersApi';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface TrackedUser {
  userId: number;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: number | null;
}

interface UseLocationTrackingOptions {
  /** Whether tracking is enabled */
  enabled: boolean;
  /** Interval in milliseconds for updating location (default: 5 minutes) */
  intervalMs?: number;
  /** User IDs to track (fetch their locations) */
  trackUserIds?: number[];
}

interface UseLocationTrackingResult {
  /** Current user's location */
  myLocation: LocationCoords | null;
  /** Tracked users' locations */
  trackedLocations: TrackedUser[];
  /** Whether location permission was granted */
  permissionGranted: boolean;
  /** Whether currently fetching/updating */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Hook for location tracking.
 * - Requests location permission
 * - Periodically sends current user's location to backend
 * - Periodically fetches tracked users' locations from backend
 */
export function useLocationTracking({
  enabled,
  intervalMs = FIVE_MINUTES,
  trackUserIds = [],
}: UseLocationTrackingOptions): UseLocationTrackingResult {
  const [myLocation, setMyLocation] = useState<LocationCoords | null>(null);
  const [trackedLocations, setTrackedLocations] = useState<TrackedUser[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Request location permission
  useEffect(() => {
    if (!enabled) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionGranted(status === 'granted');
        if (status !== 'granted') {
          setError('Cần quyền truy cập vị trí để sử dụng tính năng này');
        }
      } catch {
        setError('Không thể yêu cầu quyền vị trí');
      }
    })();
  }, [enabled]);

  const updateAndFetch = useCallback(async () => {
    if (!enabledRef.current || !permissionGranted) return;

    try {
      setLoading(true);
      setError(null);

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setMyLocation(coords);

      // Send to backend
      try {
        await updateMyLocation(coords.latitude, coords.longitude);
      } catch {
        // Silently fail - don't block UI for location update failures
      }

      // Fetch tracked users' locations
      if (trackUserIds.length > 0) {
        const results = await Promise.allSettled(
          trackUserIds.map(async (userId) => {
            const loc = await getUserLocation(userId);
            return {
              userId,
              latitude: loc.latitude,
              longitude: loc.longitude,
              locationUpdatedAt: loc.locationUpdatedAt,
            };
          })
        );

        const locations: TrackedUser[] = results
          .filter((r): r is PromiseFulfilledResult<TrackedUser> => r.status === 'fulfilled')
          .map(r => r.value);

        setTrackedLocations(locations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi cập nhật vị trí');
    } finally {
      setLoading(false);
    }
  }, [permissionGranted, trackUserIds]);

  // Initial fetch + interval
  useEffect(() => {
    if (!enabled || !permissionGranted) return;

    // Initial fetch
    updateAndFetch();

    // Set up interval
    intervalRef.current = setInterval(updateAndFetch, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, permissionGranted, intervalMs, updateAndFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    myLocation,
    trackedLocations,
    permissionGranted,
    loading,
    error,
    refresh: updateAndFetch,
  };
}

/**
 * Simpler hook: just get current location once (no tracking).
 * Used when worker opens job detail to see employer on map.
 */
export function useCurrentLocation(enabled: boolean) {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    (async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Cần quyền truy cập vị trí');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        setError('Không thể lấy vị trí hiện tại');
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled]);

  return { location, loading, error };
}

import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  color: 'red' | 'blue' | 'green' | 'orange';
  /** Emoji or short icon label shown on popup */
  icon?: string;
}

export interface RouteInfo {
  /** Origin coordinates */
  from: { latitude: number; longitude: number };
  /** Destination coordinates */
  to: { latitude: number; longitude: number };
}

interface JobLocationMapProps {
  markers: MapMarker[];
  /** Map height in pixels */
  height?: number;
  /** Auto-fit bounds to all markers */
  fitBounds?: boolean;
  /** Show a loading state */
  loading?: boolean;
  /** Optional label above the map */
  title?: string;
  /** Last updated timestamp */
  lastUpdated?: string;
  /** Route to draw between two points (uses OSRM) */
  route?: RouteInfo | null;
}

const MARKER_COLORS: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
};

/**
 * Map component using Leaflet in a WebView with OpenStreetMap tiles.
 * Supports multiple markers with colored icons.
 */
export const JobLocationMap: React.FC<JobLocationMapProps> = ({
  markers,
  height = 300,
  fitBounds = true,
  loading = false,
  title,
  lastUpdated,
  route,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Filter valid markers
  const validMarkers = useMemo(
    () => markers.filter(m => m.latitude && m.longitude && m.latitude !== 0 && m.longitude !== 0),
    [markers]
  );

  // Calculate center and zoom
  const center = useMemo(() => {
    if (validMarkers.length === 0) return { lat: 10.8231, lng: 106.6297 }; // Default: HCMC
    if (validMarkers.length === 1) return { lat: validMarkers[0].latitude, lng: validMarkers[0].longitude };
    const avgLat = validMarkers.reduce((s, m) => s + m.latitude, 0) / validMarkers.length;
    const avgLng = validMarkers.reduce((s, m) => s + m.longitude, 0) / validMarkers.length;
    return { lat: avgLat, lng: avgLng };
  }, [validMarkers]);

  const mapHTML = useMemo(() => {
    const markersJS = validMarkers
      .map(m => {
        const clr = MARKER_COLORS[m.color] || MARKER_COLORS.red;
        return `
          (function() {
            var icon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background:${clr};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">${m.icon || '📍'}</div>',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });
            var marker = L.marker([${m.latitude}, ${m.longitude}], {icon: icon}).addTo(map);
            marker.bindPopup('<b>${m.label.replace(/'/g, "\\'")}</b>');
            bounds.push([${m.latitude}, ${m.longitude}]);
          })();
        `;
      })
      .join('\n');

    const fitBoundsJS = fitBounds && validMarkers.length > 1
      ? `if (bounds.length > 1) { map.fitBounds(bounds, {padding: [50, 50]}); }`
      : '';

    // Route drawing logic using OSRM
    const routeJS = route
      ? `
      (function() {
        var routeLine = null;
        var routeInfoDiv = document.getElementById('route-info');

        function drawRoute() {
          var fromLat = ${route.from.latitude};
          var fromLng = ${route.from.longitude};
          var toLat = ${route.to.latitude};
          var toLng = ${route.to.longitude};

          var url = 'https://router.project-osrm.org/route/v1/driving/' +
            fromLng + ',' + fromLat + ';' + toLng + ',' + toLat +
            '?overview=full&geometries=geojson&steps=true';

          fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                var routeData = data.routes[0];
                var coords = routeData.geometry.coordinates.map(function(c) {
                  return [c[1], c[0]];
                });

                if (routeLine) {
                  map.removeLayer(routeLine);
                }

                routeLine = L.polyline(coords, {
                  color: '#0284c7',
                  weight: 5,
                  opacity: 0.8,
                  dashArray: null,
                  lineCap: 'round',
                  lineJoin: 'round'
                }).addTo(map);

                // Add a subtle shadow line beneath
                L.polyline(coords, {
                  color: '#075985',
                  weight: 8,
                  opacity: 0.3,
                  lineCap: 'round',
                  lineJoin: 'round'
                }).addTo(map).bringToBack();

                // Show route info
                var distKm = (routeData.distance / 1000).toFixed(1);
                var durMin = Math.round(routeData.duration / 60);
                var durText = durMin >= 60
                  ? Math.floor(durMin / 60) + ' giờ ' + (durMin % 60) + ' phút'
                  : durMin + ' phút';

                if (routeInfoDiv) {
                  routeInfoDiv.innerHTML = '🚗 ' + distKm + ' km · ⏱ ' + durText;
                  routeInfoDiv.style.display = 'block';
                }

                // Fit bounds to include route
                var allBounds = bounds.slice();
                coords.forEach(function(c) { allBounds.push(c); });
                if (allBounds.length > 1) {
                  map.fitBounds(allBounds, {padding: [50, 60]});
                }
              }
            })
            .catch(function(err) {
              // Fallback: draw straight dashed line
              if (routeLine) map.removeLayer(routeLine);
              routeLine = L.polyline(
                [[fromLat, fromLng], [toLat, toLng]],
                { color: '#0284c7', weight: 3, opacity: 0.6, dashArray: '10, 8' }
              ).addTo(map);
            });
        }

        drawRoute();
      })();
      `
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-marker { background: none !important; border: none !important; }
    #route-info {
      display: none;
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.95);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #0c4a6e;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="route-info"></div>
  <script>
    var map = L.map('map', {
      center: [${center.lat}, ${center.lng}],
      zoom: ${validMarkers.length === 1 ? 15 : 13},
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var bounds = [];
    ${markersJS}
    ${fitBoundsJS}
    ${routeJS}

    // Listen for marker updates from React Native
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'updateMarkers') {
          // Remove markers and polylines
          map.eachLayer(function(layer) {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
              map.removeLayer(layer);
            }
          });
          
          var newBounds = [];
          data.markers.forEach(function(m) {
            var clr = m.color === 'blue' ? '#3b82f6' : m.color === 'green' ? '#22c55e' : m.color === 'orange' ? '#f97316' : '#ef4444';
            var icon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background:' + clr + ';width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">' + (m.icon || '📍') + '</div>',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });
            var marker = L.marker([m.latitude, m.longitude], {icon: icon}).addTo(map);
            marker.bindPopup('<b>' + m.label + '</b>');
            newBounds.push([m.latitude, m.longitude]);
          });

          // Draw route if provided
          if (data.route) {
            var fromLat = data.route.from.latitude;
            var fromLng = data.route.from.longitude;
            var toLat = data.route.to.latitude;
            var toLng = data.route.to.longitude;

            fetch('https://router.project-osrm.org/route/v1/driving/' +
              fromLng + ',' + fromLat + ';' + toLng + ',' + toLat +
              '?overview=full&geometries=geojson')
              .then(function(res) { return res.json(); })
              .then(function(rdata) {
                if (rdata.code === 'Ok' && rdata.routes.length > 0) {
                  var coords = rdata.routes[0].geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
                  L.polyline(coords, { color: '#075985', weight: 8, opacity: 0.3, lineCap: 'round', lineJoin: 'round' }).addTo(map).bringToBack();
                  L.polyline(coords, { color: '#0284c7', weight: 5, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }).addTo(map);
                  var distKm = (rdata.routes[0].distance / 1000).toFixed(1);
                  var durMin = Math.round(rdata.routes[0].duration / 60);
                  var durText = durMin >= 60 ? Math.floor(durMin/60) + ' giờ ' + (durMin%60) + ' phút' : durMin + ' phút';
                  var ri = document.getElementById('route-info');
                  if (ri) { ri.innerHTML = '🚗 ' + distKm + ' km · ⏱ ' + durText; ri.style.display = 'block'; }
                  coords.forEach(function(c) { newBounds.push(c); });
                  if (newBounds.length > 1) map.fitBounds(newBounds, {padding: [50, 60]});
                }
              })
              .catch(function() {
                L.polyline([[fromLat,fromLng],[toLat,toLng]], {color:'#0284c7',weight:3,opacity:0.6,dashArray:'10,8'}).addTo(map);
              });
          } else {
            if (newBounds.length > 1) {
              map.fitBounds(newBounds, {padding: [50, 50]});
            } else if (newBounds.length === 1) {
              map.setView(newBounds[0], 15);
            }
          }
        }
      } catch(e) {}
    });
  </script>
</body>
</html>`;
  }, [validMarkers, center, fitBounds, route]);

  // Send updated markers to WebView when markers change
  useEffect(() => {
    if (webViewRef.current && validMarkers.length > 0) {
      const message = JSON.stringify({
        type: 'updateMarkers',
        markers: validMarkers,
      });
      webViewRef.current.postMessage(message);
    }
  }, [validMarkers]);

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={[styles.loadingContainer, { height: height - (title ? 30 : 0) }]}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      </View>
    );
  }

  if (validMarkers.length === 0) {
    return (
      <View style={[styles.container, { height: 80 }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.noLocationContainer}>
          <Text style={styles.noLocationText}>📍 Chưa có thông tin vị trí</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.mapWrapper, { height }]}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={styles.webview}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          )}
        />
      </View>
      {lastUpdated && (
        <Text style={styles.lastUpdated}>Cập nhật lần cuối: {lastUpdated}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  mapWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  noLocationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  noLocationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  lastUpdated: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing[1],
  },
});

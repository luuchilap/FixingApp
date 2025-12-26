/**
 * TrackAsia API utility
 * Handles geocoding, autocomplete, and location services
 */

const TRACKASIA_API_BASE = 'https://maps.track-asia.com/api/v2';
const TRACKASIA_API_KEY = process.env.TRACKASIA_API_KEY;

if (!TRACKASIA_API_KEY) {
  console.warn('Warning: TRACKASIA_API_KEY not set. Location features will not work.');
}

/**
 * Get autocomplete suggestions for an address query
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array>} Array of location suggestions
 */
async function autocomplete(query, limit = 5) {
  if (!TRACKASIA_API_KEY) {
    throw new Error('TRACKASIA_API_KEY is not configured');
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const url = `${TRACKASIA_API_BASE}/v1/autocomplete?text=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TRACKASIA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TrackAsia autocomplete error:', response.status, errorText);
      throw new Error(`TrackAsia API error: ${response.status}`);
    }

    const data = await response.json();
    
    // TrackAsia API returns features array
    if (data.features && Array.isArray(data.features)) {
      return data.features.map(feature => ({
        id: feature.id || feature.properties?.place_id,
        address: feature.properties?.name || feature.properties?.full_address || feature.properties?.address || '',
        fullAddress: feature.properties?.full_address || feature.properties?.name || '',
        latitude: feature.geometry?.coordinates?.[1],
        longitude: feature.geometry?.coordinates?.[0],
        placeId: feature.properties?.place_id,
        type: feature.properties?.type || feature.properties?.category
      }));
    }

    return [];
  } catch (error) {
    console.error('Error in TrackAsia autocomplete:', error);
    throw error;
  }
}

/**
 * Geocode an address to get coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<{latitude: number, longitude: number}>} Coordinates
 */
async function geocode(address) {
  if (!TRACKASIA_API_KEY) {
    throw new Error('TRACKASIA_API_KEY is not configured');
  }

  if (!address || address.trim().length === 0) {
    throw new Error('Address is required');
  }

  try {
    // Use Search API for geocoding
    const params = new URLSearchParams({
      text: address,
      key: TRACKASIA_API_KEY,
      size: '1'
    });
    
    const url = `${TRACKASIA_API_BASE}/place/search/json?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TrackAsia geocode error:', response.status, errorText);
      throw new Error(`TrackAsia API error: ${response.status}`);
    }

    const data = await response.json();
    
    // TrackAsia Search API returns results in results array (Google Maps Places format)
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry?.location?.lat || 0,
        longitude: result.geometry?.location?.lng || 0,
        address: result.formatted_address || result.name || address,
        placeId: result.place_id
      };
    }

    throw new Error('No results found for address');
  } catch (error) {
    console.error('Error in TrackAsia geocode:', error);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  autocomplete,
  geocode,
  calculateDistance
};


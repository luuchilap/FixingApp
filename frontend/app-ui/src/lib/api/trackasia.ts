/**
 * TrackAsia API client for frontend
 * Handles autocomplete and geocoding
 */

const TRACKASIA_API_BASE = 'https://maps.track-asia.com/api/v2';
const TRACKASIA_API_KEY = process.env.NEXT_PUBLIC_TRACKASIA_API_KEY;

export interface LocationSuggestion {
  id: string;
  address: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  type?: string;
}

/**
 * Get autocomplete suggestions for an address query
 */
export async function autocomplete(query: string, limit = 5): Promise<LocationSuggestion[]> {
  if (!TRACKASIA_API_KEY) {
    console.warn('TRACKASIA_API_KEY not configured');
    return [];
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    // TrackAsia API v2 format: /place/autocomplete/json?input=...&key=...&size=...
    const params = new URLSearchParams({
      input: query,
      key: TRACKASIA_API_KEY,
      size: limit.toString(),
      new_admin: 'true'
    });
    
    const url = `${TRACKASIA_API_BASE}/place/autocomplete/json?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('TrackAsia autocomplete error:', response.status);
      return [];
    }

    const data = await response.json();
    
    // TrackAsia follows Google Maps Places API format
    if (data.predictions && Array.isArray(data.predictions)) {
      return data.predictions.map((prediction: any) => ({
        id: prediction.place_id || Math.random().toString(),
        address: prediction.structured_formatting?.main_text || prediction.description || '',
        fullAddress: prediction.description || prediction.structured_formatting?.main_text || '',
        latitude: 0, // Will be fetched from place detail if needed
        longitude: 0, // Will be fetched from place detail if needed
        placeId: prediction.place_id,
        type: prediction.types?.[0]
      }));
    }

    return [];
  } catch (error) {
    console.error('Error in TrackAsia autocomplete:', error);
    return [];
  }
}

/**
 * Get place details by place_id (for getting coordinates from autocomplete)
 */
export async function getPlaceDetails(placeId: string): Promise<{ latitude: number; longitude: number; address: string }> {
  if (!TRACKASIA_API_KEY) {
    throw new Error('TRACKASIA_API_KEY not configured');
  }

  if (!placeId || placeId.trim().length === 0) {
    throw new Error('Place ID is required');
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: TRACKASIA_API_KEY,
      new_admin: 'true'
    });
    
    const url = `${TRACKASIA_API_BASE}/place/details/json?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TrackAsia API error: ${response.status}`);
    }

    const data = await response.json();
    
    // TrackAsia Place Detail API follows Google Maps Places format
    if (data.result) {
      const result = data.result;
      return {
        latitude: result.geometry?.location?.lat || 0,
        longitude: result.geometry?.location?.lng || 0,
        address: result.formatted_address || result.name || ''
      };
    }

    throw new Error('No results found for place_id');
  } catch (error) {
    console.error('Error in TrackAsia getPlaceDetails:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  if (!TRACKASIA_API_KEY) {
    throw new Error('TRACKASIA_API_KEY not configured');
  }

  try {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: TRACKASIA_API_KEY,
      result_type: 'street_address',
      size: '1',
      new_admin: 'true'
    });
    
    const url = `${TRACKASIA_API_BASE}/geocode/json?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TrackAsia API error: ${response.status}`);
    }

    const data = await response.json();
    
    // TrackAsia Reverse Geocoding API follows Google Maps Geocoding format
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address || '';
    }

    throw new Error('No results found for coordinates');
  } catch (error) {
    console.error('Error in TrackAsia reverseGeocode:', error);
    throw error;
  }
}

/**
 * Geocode an address to get coordinates using Search API
 */
export async function geocode(address: string): Promise<{ latitude: number; longitude: number; address: string }> {
  if (!TRACKASIA_API_KEY) {
    throw new Error('TRACKASIA_API_KEY not configured');
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
      throw new Error(`TrackAsia API error: ${response.status}`);
    }

    const data = await response.json();
    
    // TrackAsia Search API returns results in results array
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry?.location?.lat || 0,
        longitude: result.geometry?.location?.lng || 0,
        address: result.formatted_address || result.name || address
      };
    }

    throw new Error('No results found for address');
  } catch (error) {
    console.error('Error in TrackAsia geocode:', error);
    throw error;
  }
}


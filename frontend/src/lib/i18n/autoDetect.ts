import { INDIA_LANGUAGES } from './languages';

/**
 * Reverse geocodes coordinates to identify the Indian State name.
 * Uses Nominatim OpenStreetMap client-side queries, and falls back to
 * offline bounding distance calculations when connection is dropped.
 */
export async function reverseGeocodeState(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
      headers: { "Accept-Language": "en", "User-Agent": "AarogyaSetu-ASHA-Triage" }
    });
    if (response.ok) {
      const data = await response.json();
      const state = data.address?.state;
      if (state) {
        // Strip trailing specifiers to map to INDIA_LANGUAGES states
        return state.replace(" State", "").trim();
      }
    }
  } catch (e) {
    console.warn("Reverse geocode request failed. Triggering offline coordinate estimation mapping.", e);
  }

  // Bounding node proximity matrix for rural zero-network environments
  const stateCoordinates = [
    { name: "Karnataka", lat: 12.9716, lng: 77.5946 },
    { name: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
    { name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
    { name: "Bihar", lat: 25.0961, lng: 85.3131 },
    { name: "West Bengal", lat: 22.5726, lng: 88.3639 },
    { name: "Maharashtra", lat: 19.7515, lng: 75.7139 },
    { name: "Kerala", lat: 10.8505, lng: 76.2711 },
    { name: "Andhra Pradesh", lat: 15.9129, lng: 79.7400 },
    { name: "Telangana", lat: 18.1124, lng: 79.0193 },
    { name: "Jammu & Kashmir", lat: 33.7782, lng: 76.5762 }
  ];

  let closestState = "Uttar Pradesh"; // Fallback default
  let minDistance = Infinity;

  for (const node of stateCoordinates) {
    const d = Math.pow(lat - node.lat, 2) + Math.pow(lng - node.lng, 2);
    if (d < minDistance) {
      minDistance = d;
      closestState = node.name;
    }
  }

  return closestState;
}

export async function detectLanguageFromGPS(lat: number, lng: number): Promise<string> {
  // Reverse geocode → state name → map to language code
  const state = await reverseGeocodeState(lat, lng);
  const lang = INDIA_LANGUAGES.find(l => l.states.includes(state));
  return lang?.code ?? "hi";  // Hindi as national default fallback
}

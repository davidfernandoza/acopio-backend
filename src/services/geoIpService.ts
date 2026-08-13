import { Request } from 'express';
import { City } from '../models';

interface GeoLocationLookup {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface UserIpLocation {
  city: City | null;
  latitude: number | null;
  longitude: number | null;
}

interface GeoLocationService {
  buildUrl: (clientIp: string | null) => string;
  parseResponse: (payload: Record<string, unknown>) => GeoLocationLookup | null;
}

function parseCoordinate(value: unknown): number | undefined {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) {
    return undefined;
  }
  return coordinate;
}

function normalizeKey(text: string): string {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isLocalIp(clientIp: string | null): boolean {
  if (!clientIp) {
    return true;
  }
  return (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('172.16.')
  );
}

const geoLocationServices: GeoLocationService[] = [
  {
    buildUrl: (clientIp) =>
      clientIp && !isLocalIp(clientIp)
        ? `https://ipwhois.app/json/${encodeURIComponent(clientIp)}`
        : 'https://ipwhois.app/json/',
    parseResponse: (payload) => {
      if (payload.success === false) {
        return null;
      }
      return {
        city: typeof payload.city === 'string' ? payload.city : undefined,
        region: typeof payload.region === 'string' ? payload.region : undefined,
        country: typeof payload.country === 'string' ? payload.country : undefined,
        latitude: parseCoordinate(payload.latitude),
        longitude: parseCoordinate(payload.longitude),
      };
    },
  },
  {
    buildUrl: (clientIp) =>
      clientIp && !isLocalIp(clientIp)
        ? `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`
        : 'https://ipapi.co/json/',
    parseResponse: (payload) => {
      if (payload.error) {
        return null;
      }
      return {
        city: typeof payload.city === 'string' ? payload.city : undefined,
        region: typeof payload.region === 'string' ? payload.region : undefined,
        country:
          typeof payload.country_name === 'string' ? payload.country_name : undefined,
        latitude: parseCoordinate(payload.latitude),
        longitude: parseCoordinate(payload.longitude),
      };
    },
  },
];

export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].trim();
  }

  const remoteAddress = request.socket.remoteAddress;
  if (!remoteAddress) {
    return null;
  }

  if (remoteAddress.startsWith('::ffff:')) {
    return remoteAddress.slice('::ffff:'.length);
  }

  return remoteAddress;
}

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: abortController.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function lookupGeoLocation(clientIp: string | null): Promise<GeoLocationLookup | null> {
  for (const geoLocationService of geoLocationServices) {
    try {
      const response = await fetchWithTimeout(geoLocationService.buildUrl(clientIp));
      if (!response.ok) {
        continue;
      }
      const payload = (await response.json()) as Record<string, unknown>;
      const parsedLocation = geoLocationService.parseResponse(payload);
      const hasCoordinates =
        parsedLocation?.latitude != null && parsedLocation?.longitude != null;
      if (parsedLocation?.city || parsedLocation?.region || hasCoordinates) {
        return parsedLocation;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function matchCityFromLookup(lookup: GeoLocationLookup): Promise<City | null> {
  const candidateNames = [lookup.city, lookup.region].filter(Boolean) as string[];
  if (!candidateNames.length) {
    return null;
  }

  const cities = await City.findAll();
  for (const candidateName of candidateNames) {
    const candidateKey = normalizeKey(candidateName);
    const matchedCity = cities.find(
      (city) =>
        normalizeKey(city.name) === candidateKey ||
        normalizeKey(city.name).includes(candidateKey) ||
        candidateKey.includes(normalizeKey(city.name))
    );
    if (matchedCity) {
      return matchedCity;
    }
  }

  return null;
}

export async function resolveUserLocationFromIp(
  clientIp: string | null
): Promise<UserIpLocation> {
  const lookup = await lookupGeoLocation(clientIp);
  if (!lookup) {
    return { city: null, latitude: null, longitude: null };
  }

  const matchedCity = await matchCityFromLookup(lookup);
  const latitude =
    lookup.latitude ?? (matchedCity ? Number(matchedCity.latitude) : null);
  const longitude =
    lookup.longitude ?? (matchedCity ? Number(matchedCity.longitude) : null);

  return {
    city: matchedCity,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

export async function resolveCityFromIp(clientIp: string | null): Promise<City | null> {
  const userLocation = await resolveUserLocationFromIp(clientIp);
  return userLocation.city;
}

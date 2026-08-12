/**
 * vacation-rental-config.ts
 * Default PropertyContext for the Mermicorn vacation rental.
 * Fill in real values — this file is committed (no secrets).
 * WiFi password / door code should come from env vars in production.
 */

import type { PropertyContext } from './ai-comms';

export const DEFAULT_PROPERTY: PropertyContext = {
  name: 'Mermicorn Grove — Honolulu Retreat',
  location: 'Honolulu, Hawaii',
  checkInTime: '3:00 PM',
  checkOutTime: '11:00 AM',
  maxGuests: 6,
  amenities: [
    'Full kitchen',
    'High-speed WiFi',
    'Private parking (2 spots)',
    'Washer & dryer',
    'Air conditioning',
    'Beach gear (chairs, umbrella, cooler)',
    'Smart TV + streaming',
    'Outdoor lanai/patio',
  ],
  houseRules: [
    'No smoking indoors',
    'No parties or events',
    'Pets allowed with prior approval',
    'Quiet hours 10pm–8am',
    'Leave property as found',
  ],
  wifiName: process.env.WIFI_NAME ?? 'MermicornGrove',
  wifiPassword: process.env.WIFI_PASSWORD ?? 'SET_IN_ENV',
  parkingInstructions:
    'Two assigned stalls in the covered garage. Access code: SET_IN_ENV (update via PARKING_CODE env var).',
  emergencyContact: process.env.EMERGENCY_CONTACT ?? 'Host Cherry — SET_IN_ENV',
  hostName: 'Cherry',
};

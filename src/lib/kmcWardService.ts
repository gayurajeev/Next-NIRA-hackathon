/**
 * NIRA — Kochi Municipal Corporation (KMC) Ward Boundary & Routing Engine
 * Challenge: SC-08 — Canal and storm-drain blockage reporting
 * 
 * DESIGN RATIONALE:
 * Citizens reporting a blocked storm-drain rarely know their administrative ward number
 * or which zonal KMC engineering office is responsible.
 * This service takes raw GPS or manually placed map coordinates, performs
 * Point-in-Polygon (PIP) geospatial analysis against KMC boundary polygons,
 * and outputs the verified Ward, Ward Number, Authority, and Dispatched Office.
 * 
 * NOTE ON GIS DATASET:
 * This file contains a clearly structured prototype boundary dataset covering primary
 * flood-prone drainage corridors of Kochi Municipal Corporation.
 * The data structure matches standard GeoJSON Polygon format so that production
 * KSSDI / KMC GIS shapefiles can be dropped in seamlessly.
 */

export interface WardGeoPolygon {
  type: 'Polygon';
  // Array of [latitude, longitude] boundary vertices
  coordinates: [number, number][];
}

export interface KmcWardDefinition {
  wardNumber: number;
  wardName: string;
  zonalAuthority: string;
  parentCorporation: string;
  zone: 'Central Zone' | 'East Zone' | 'West Zone' | 'North Zone' | 'South Zone';
  division: string;
  officerInCharge: string;
  officerRole: string;
  officerPhone: string;
  primaryCanalSystem: string;
  suggestedLandmarks: string[];
  boundary: WardGeoPolygon;
  centroid: [number, number]; // [lat, lng]
  isPrototypeBoundary: boolean;
}

export interface WardLookupResult {
  identified: boolean;
  wardName: string;
  wardNumber: number;
  authority: string;
  zone: string;
  division: string;
  officerInCharge: string;
  officerRole: string;
  officerPhone: string;
  primaryCanalSystem: string;
  suggestedLandmark: string;
  detectionMethod: 'POLYGON_CONTAINMENT' | 'PROXIMITY_CENTROID' | 'OUT_OF_BOUNDS';
  isPrototypeBoundary: boolean;
  message: string;
}

/**
 * KOCHI MUNICIPAL CORPORATION - PROTOTYPE DRAINAGE WARD BOUNDARY DATASET
 * Clearly documented prototype boundaries for the Kochi Civic Tech Hackathon SC-08 Challenge.
 */
export const KOCHI_PROTOTYPE_WARDS: KmcWardDefinition[] = [
  {
    wardNumber: 40,
    wardName: 'Vyttila',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC East Zonal Office — Vyttila Division',
    zone: 'East Zone',
    division: 'Division 4 — Drainage & Stormwater Unit',
    officerInCharge: 'Er. Manoj Kumar K.',
    officerRole: 'Assistant Engineer (AE) - Stormwater Drainage',
    officerPhone: '+91 94471 23440',
    primaryCanalSystem: 'Vyttila Mobility Hub Feeder Canal & Sub-Drain 03',
    suggestedLandmarks: ['Vyttila Mobility Hub', 'SA Road Junction', 'Janatha Road Culvert', 'Toc-H Road Drain'],
    centroid: [9.9674, 76.3160],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [9.9740, 76.3090],
        [9.9740, 76.3260],
        [9.9590, 76.3260],
        [9.9590, 76.3090],
        [9.9740, 76.3090],
      ],
    },
  },
  {
    wardNumber: 24,
    wardName: 'Kadavanthra',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC Central Zonal Office — Kadavanthra Sub-Division',
    zone: 'Central Zone',
    division: 'Division 2 — Central Drainage Works',
    officerInCharge: 'Er. Rajesh Menon',
    officerRole: 'Assistant Engineer (AE) - Canal Maintenance',
    officerPhone: '+91 94471 23424',
    primaryCanalSystem: 'Elamkulam - Kadavanthra Arterial Canal',
    suggestedLandmarks: ['Kadavanthra Junction', 'Giri Nagar Park', 'Elamkulam Bridge', 'Gandhinagar Road Drain'],
    centroid: [9.9674, 76.2998],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [9.9740, 76.2920],
        [9.9740, 76.3090],
        [9.9590, 76.3090],
        [9.9590, 76.2920],
        [9.9740, 76.2920],
      ],
    },
  },
  {
    wardNumber: 28,
    wardName: 'Kaloor',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC Central Zonal Office — Kaloor Division',
    zone: 'Central Zone',
    division: 'Division 3 — Perandoor Basin Operations',
    officerInCharge: 'Er. Preetha K.',
    officerRole: 'Executive Engineer (EE) - Basin Management',
    officerPhone: '+91 94471 23428',
    primaryCanalSystem: 'Perandoor Arterial Canal Basin',
    suggestedLandmarks: ['Kaloor Stadium Roundabout', 'JLN Metro Station Drain', 'Deshabhimani Junction', 'Kathrikadavu Canal Point'],
    centroid: [9.9940, 76.2980],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [10.0060, 76.2880],
        [10.0060, 76.3080],
        [9.9820, 76.3080],
        [9.9820, 76.2880],
        [10.0060, 76.2880],
      ],
    },
  },
  {
    wardNumber: 35,
    wardName: 'Edappally',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC North Zonal Office — Edappally Division',
    zone: 'North Zone',
    division: 'Division 5 — North Stormwater Taskforce',
    officerInCharge: 'Er. Anoop Thomas',
    officerRole: 'Assistant Engineer (AE) - North Region',
    officerPhone: '+91 94471 23435',
    primaryCanalSystem: 'Edappally Raghavan Canal & Toll Culverts',
    suggestedLandmarks: ['Edappally Toll', 'Lulu Junction Underpass Drain', 'Edappally Church Canal Culvert', 'Mamangalam Road Drain'],
    centroid: [10.0240, 76.3120],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [10.0380, 76.2980],
        [10.0380, 76.3260],
        [10.0080, 76.3260],
        [10.0080, 76.2980],
        [10.0380, 76.2980],
      ],
    },
  },
  {
    wardNumber: 12,
    wardName: 'Fort Kochi',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC West Zonal Office — Fort Kochi Division',
    zone: 'West Zone',
    division: 'Division 1 — Coastal & Heritage Waterways',
    officerInCharge: 'Er. Sunitha V.',
    officerRole: 'Assistant Engineer (AE) - Coastal Outfalls',
    officerPhone: '+91 94471 23412',
    primaryCanalSystem: 'Calvathy Tidal Canal Outfall System',
    suggestedLandmarks: ['Calvathy Canal Bridge', 'Princess Street Drain', 'Bazaar Road Culvert', 'Fort Kochi Beach Promenade Outfall'],
    centroid: [9.9650, 76.2420],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [9.9780, 76.2300],
        [9.9780, 76.2550],
        [9.9520, 76.2550],
        [9.9520, 76.2300],
        [9.9780, 76.2300],
      ],
    },
  },
  {
    wardNumber: 18,
    wardName: 'Mattancherry',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC West Zonal Office — Mattancherry Sub-Division',
    zone: 'West Zone',
    division: 'Division 1 — West Heritage Drainage',
    officerInCharge: 'Er. Haridas P.',
    officerRole: 'Assistant Engineer (AE) - Heritage Zone',
    officerPhone: '+91 94471 23418',
    primaryCanalSystem: 'Rameswaram Canal & Jew Town Sub-Drains',
    suggestedLandmarks: ['Jew Town Market Drain', 'Mattancherry Jetty Canal', 'Gujarati Road Sump', 'Bazaar Road Silt Trap'],
    centroid: [9.9520, 76.2560],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [9.9600, 76.2480],
        [9.9600, 76.2680],
        [9.9400, 76.2680],
        [9.9400, 76.2480],
        [9.9600, 76.2480],
      ],
    },
  },
  {
    wardNumber: 52,
    wardName: 'Ernakulam South / Thevara',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC Central Zonal Office — South Division',
    zone: 'South Zone',
    division: 'Division 6 — South Outfall Unit',
    officerInCharge: 'Er. Deepa Mohan',
    officerRole: 'Assistant Engineer (AE) - South Sub-Drains',
    officerPhone: '+91 94471 23452',
    primaryCanalSystem: 'Thevara Canal & Railway Culvert Basin',
    suggestedLandmarks: ['Thevara Junction', 'South Railway Station Drain', 'Medical Trust Cross Road', 'Panampilly Nagar Outfall'],
    centroid: [9.9510, 76.2970],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [9.9590, 76.2860],
        [9.9590, 76.3080],
        [9.9380, 76.3080],
        [9.9380, 76.2860],
        [9.9590, 76.2860],
      ],
    },
  },
  {
    wardNumber: 62,
    wardName: 'Palarivattom',
    parentCorporation: 'Kochi Municipal Corporation (KMC)',
    zonalAuthority: 'KMC East Zonal Office — Palarivattom Sub-Division',
    zone: 'East Zone',
    division: 'Division 4 — East Arterial Drainage',
    officerInCharge: 'Er. Sreekumar N.',
    officerRole: 'Assistant Engineer (AE) - Bypass Drainage',
    officerPhone: '+91 94471 23462',
    primaryCanalSystem: 'Padivattom - Palarivattom NH Drainage Corridor',
    suggestedLandmarks: ['Palarivattom Flyover Junction', 'Padivattom Silt Trap', 'Pipeline Road Canal', 'Mamangalam Culvert'],
    centroid: [10.0050, 76.3120],
    isPrototypeBoundary: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [10.0160, 76.3020],
        [10.0160, 76.3260],
        [9.9950, 76.3260],
        [9.9950, 76.3020],
        [10.0160, 76.3020],
      ],
    },
  },
];

/**
 * KOCHI MUNICIPAL CORPORATION BROADER JURISDICTIONAL BOUNDS
 * Used for bounds checking to determine whether a coordinate is within Kochi Corporation limits.
 */
const KOCHI_CORPORATION_BOUNDS = {
  minLat: 9.8800,
  maxLat: 10.0900,
  minLng: 76.2000,
  maxLng: 76.3800,
};

/**
 * Standard Ray-Casting Point-in-Polygon (PIP) Algorithm
 * Works with any closed polygon coordinates [lat, lng].
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point; // x is lat, y is lng
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculates Euclidean distance between two geographic coordinates in degrees
 */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Core Reusable Ward Boundary Lookup Service
 * Resolves exact ward, responsible municipal authority, and officer routing from coordinates.
 */
export const kmcWardService = {
  /**
   * Synchronous Ward Lookup for immediate calculations
   */
  lookupWardSync(lat: number, lng: number): WardLookupResult {
    // 1. Check if completely outside Kochi Municipal Corporation bounds
    const isInsideKochi =
      lat >= KOCHI_CORPORATION_BOUNDS.minLat &&
      lat <= KOCHI_CORPORATION_BOUNDS.maxLat &&
      lng >= KOCHI_CORPORATION_BOUNDS.minLng &&
      lng <= KOCHI_CORPORATION_BOUNDS.maxLng;

    if (!isInsideKochi) {
      return {
        identified: false,
        wardName: 'Outside KMC Boundary',
        wardNumber: 0,
        authority: 'Unknown / Outside Jurisdiction',
        zone: 'Outside Jurisdiction',
        division: 'Non-KMC',
        officerInCharge: 'N/A',
        officerRole: 'N/A',
        officerPhone: 'N/A',
        primaryCanalSystem: 'N/A',
        suggestedLandmark: 'Outside Kochi Corporation Jurisdiction',
        detectionMethod: 'OUT_OF_BOUNDS',
        isPrototypeBoundary: false,
        message: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) fall outside the Kochi Municipal Corporation boundary dataset. Please select a location within Kochi Corporation limits on the map.`,
      };
    }

    // 2. Perform Point-in-Polygon (PIP) containment search across all prototype wards
    for (const ward of KOCHI_PROTOTYPE_WARDS) {
      if (isPointInPolygon([lat, lng], ward.boundary.coordinates)) {
        return {
          identified: true,
          wardName: ward.wardName,
          wardNumber: ward.wardNumber,
          authority: `${ward.parentCorporation} (${ward.zone})`,
          zone: ward.zone,
          division: ward.division,
          officerInCharge: ward.officerInCharge,
          officerRole: ward.officerRole,
          officerPhone: ward.officerPhone,
          primaryCanalSystem: ward.primaryCanalSystem,
          suggestedLandmark: ward.suggestedLandmarks[0],
          detectionMethod: 'POLYGON_CONTAINMENT',
          isPrototypeBoundary: true,
          message: `Location successfully matched within Kochi Municipal Corporation Ward ${ward.wardNumber} (${ward.wardName}) boundary polygon.`,
        };
      }
    }

    // 3. Coordinate is within Kochi Corporation, but falls between or adjacent to prototype polygons
    // Use nearest centroid proximity to assign the responsible ward
    let closestWard = KOCHI_PROTOTYPE_WARDS[0];
    let minDistance = Infinity;

    for (const ward of KOCHI_PROTOTYPE_WARDS) {
      const dist = getDistance(lat, lng, ward.centroid[0], ward.centroid[1]);
      if (dist < minDistance) {
        minDistance = dist;
        closestWard = ward;
      }
    }

    return {
      identified: true,
      wardName: closestWard.wardName,
      wardNumber: closestWard.wardNumber,
      authority: `${closestWard.parentCorporation} (${closestWard.zone})`,
      zone: closestWard.zone,
      division: closestWard.division,
      officerInCharge: closestWard.officerInCharge,
      officerRole: closestWard.officerRole,
      officerPhone: closestWard.officerPhone,
      primaryCanalSystem: closestWard.primaryCanalSystem,
      suggestedLandmark: closestWard.suggestedLandmarks[0],
      detectionMethod: 'PROXIMITY_CENTROID',
      isPrototypeBoundary: true,
      message: `Location falls within Kochi Corporation limits. Mapped to nearest ward corridor: Ward ${closestWard.wardNumber} (${closestWard.wardName}).`,
    };
  },

  /**
   * Asynchronous Ward Lookup with simulated GIS lookup latency
   * Provides realistic GIS query feedback and enables smooth loading state in UI.
   */
  async lookupWard(lat: number, lng: number): Promise<WardLookupResult> {
    // 350ms simulated async spatial query
    await new Promise(resolve => setTimeout(resolve, 350));
    return this.lookupWardSync(lat, lng);
  },

  /**
   * Get all registered KMC prototype wards
   */
  getAllWards(): KmcWardDefinition[] {
    return KOCHI_PROTOTYPE_WARDS;
  },
};

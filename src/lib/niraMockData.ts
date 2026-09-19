import { DrainageReport, HotspotCluster, WardInfo } from './niraTypes';

export const KOCHI_WARDS: WardInfo[] = [
  {
    ward_number: 24,
    ward_name: 'Vyttila Mobility Hub Junction',
    officer_in_charge: 'K. S. Rajesh (AE Drainage)',
    officer_phone: '+91 98471 20024',
    active_tickets: 0,
    resolved_tickets: 0,
  },
  {
    ward_number: 35,
    ward_name: 'Kadavanthra Canal Road',
    officer_in_charge: 'M. Somanathan (Overseer)',
    officer_phone: '+91 94470 35035',
    active_tickets: 0,
    resolved_tickets: 0,
  },
  {
    ward_number: 12,
    ward_name: 'Fort Kochi Heritage Trench',
    officer_in_charge: 'Anitha Roy (Junior Engineer)',
    officer_phone: '+91 98952 12012',
    active_tickets: 0,
    resolved_tickets: 0,
  },
  {
    ward_number: 40,
    ward_name: 'Edappally Toll Canal',
    officer_in_charge: 'P. V. Haridas (Assistant Executive Engineer)',
    officer_phone: '+91 97455 40040',
    active_tickets: 0,
    resolved_tickets: 0,
  },
  {
    ward_number: 28,
    ward_name: 'Kaloor Subhash Bose Road',
    officer_in_charge: 'T. K. Salim (Sanitation Inspector)',
    officer_phone: '+91 98460 28028',
    active_tickets: 0,
    resolved_tickets: 0,
  },
];

// No dummy reports: real reports filed by citizens will populate here and persist in database/local storage
export const INITIAL_NIRA_REPORTS: DrainageReport[] = [];

// No dummy hotspot clusters: detected dynamically from real citizen report clusters (>=3 reports in 200m)
export const INITIAL_HOTSPOT_CLUSTERS: HotspotCluster[] = [];

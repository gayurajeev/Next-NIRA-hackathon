import { Bus, Route, Schedule, Incident, Booking } from './types';

export const INITIAL_BUSES: Bus[] = [
  {
    id: 'b1',
    bus_number: 'KL-15-A-9821',
    name: 'KSRTC Swift Gaju Express',
    category: 'Swift',
    status: 'ACTIVE',
    capacity: 40,
    current_occupancy: 24,
    speed_kmh: 62,
    current_lat: 9.9674,
    current_lng: 76.2998,
    driver_name: 'K. Vijayakumar',
    driver_phone: '+91 98470 12345'
  },
  {
    id: 'b2',
    bus_number: 'KL-15-B-1044',
    name: 'Minnal Night Super Express',
    category: 'Minnal',
    status: 'ACTIVE',
    capacity: 36,
    current_occupancy: 32,
    speed_kmh: 78,
    current_lat: 10.0261,
    current_lng: 76.3125,
    driver_name: 'R. Soman',
    driver_phone: '+91 94471 67890'
  },
  {
    id: 'b3',
    bus_number: 'KL-15-C-4455',
    name: 'Malabar Super Fast',
    category: 'Super Fast',
    status: 'DELAYED',
    capacity: 48,
    current_occupancy: 41,
    speed_kmh: 35,
    current_lat: 9.5916,
    current_lng: 76.5222,
    driver_name: 'M. Ashraf',
    driver_phone: '+91 98952 34567'
  },
  {
    id: 'b4',
    bus_number: 'KL-15-D-8820',
    name: 'High-Range Scenic Deluxe',
    category: 'Swift',
    status: 'ACTIVE',
    capacity: 40,
    current_occupancy: 18,
    speed_kmh: 48,
    current_lat: 10.0889,
    current_lng: 77.0597,
    driver_name: 'S. Haridas',
    driver_phone: '+91 97455 90123'
  },
  {
    id: 'b5',
    bus_number: 'KL-15-E-3301',
    name: 'Keralam City Circular Electric',
    category: 'Ordinary',
    status: 'ACTIVE',
    capacity: 35,
    current_occupancy: 12,
    speed_kmh: 28,
    current_lat: 9.9312,
    current_lng: 76.2673,
    driver_name: 'P. Sudheesh',
    driver_phone: '+91 98460 55432'
  }
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'r1',
    route_code: 'R-EKN-MNR',
    origin: 'Ernakulam Vyttila Hub',
    destination: 'Munnar KSRTC Stand',
    distance_km: 128.5,
    estimated_mins: 270,
    stops: [
      { name: 'Vyttila Hub', offset: 0 },
      { name: 'Kothamangalam', offset: 60 },
      { name: 'Adimali', offset: 180 },
      { name: 'Munnar Stand', offset: 270 }
    ]
  },
  {
    id: 'r2',
    route_code: 'R-TVM-CLT',
    origin: 'Trivandrum Central',
    destination: 'Kozhikode Mavoor Stand',
    distance_km: 395.0,
    estimated_mins: 540,
    stops: [
      { name: 'Thampanoor', offset: 0 },
      { name: 'Kollam Depot', offset: 90 },
      { name: 'Alappuzha Hub', offset: 180 },
      { name: 'Ernakulam Vyttila', offset: 250 },
      { name: 'Thrissur Sakthan', offset: 360 },
      { name: 'Kozhikode Stand', offset: 540 }
    ]
  },
  {
    id: 'r3',
    route_code: 'R-KCH-TCR',
    origin: 'Keralam Airport Transit',
    destination: 'Thrissur Sakthan Stand',
    distance_km: 55.0,
    estimated_mins: 90,
    stops: [
      { name: 'Nedumbassery Airport', offset: 0 },
      { name: 'Angamaly Depot', offset: 20 },
      { name: 'Chalakudy Stand', offset: 45 },
      { name: 'Thrissur Sakthan', offset: 90 }
    ]
  }
];

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 's1',
    bus_id: 'b1',
    route_id: 'r1',
    departure_time: '06:30 AM',
    arrival_time: '11:00 AM',
    fare_inr: 245,
    available_seats: 16,
    bus: INITIAL_BUSES[0],
    route: INITIAL_ROUTES[0]
  },
  {
    id: 's2',
    bus_id: 'b2',
    route_id: 'r2',
    departure_time: '10:00 PM',
    arrival_time: '07:00 AM',
    fare_inr: 580,
    available_seats: 4,
    bus: INITIAL_BUSES[1],
    route: INITIAL_ROUTES[1]
  },
  {
    id: 's3',
    bus_id: 'b3',
    route_id: 'r2',
    departure_time: '08:15 AM',
    arrival_time: '05:15 PM',
    fare_inr: 420,
    available_seats: 7,
    bus: INITIAL_BUSES[2],
    route: INITIAL_ROUTES[1]
  },
  {
    id: 's4',
    bus_id: 'b4',
    route_id: 'r1',
    departure_time: '02:00 PM',
    arrival_time: '06:30 PM',
    fare_inr: 280,
    available_seats: 22,
    bus: INITIAL_BUSES[3],
    route: INITIAL_ROUTES[0]
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    bus_id: 'b3',
    reporter_type: 'DRIVER',
    issue_category: 'BREAKDOWN',
    description: 'Radiator overheating near Kottayam bypass. Mechanical crew dispatched.',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    lat: 9.5916,
    lng: 76.5222,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    bus: INITIAL_BUSES[2]
  },
  {
    id: 'inc-2',
    bus_id: 'b1',
    reporter_type: 'COMMUTER',
    issue_category: 'DIRTY_BUS',
    description: 'Seat 14B recliner lever loose. Needs maintenance at Ernakulam depot.',
    severity: 'LOW',
    status: 'OPEN',
    lat: 9.9674,
    lng: 76.2998,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    bus: INITIAL_BUSES[0]
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    schedule_id: 's1',
    passenger_name: 'Anjali Nair',
    passenger_phone: '+91 98450 11223',
    seat_number: '12A',
    ticket_code: 'KSRTC-SW-9821-12A',
    status: 'CONFIRMED',
    amount_paid: 245,
    qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=KSRTC-SW-9821-12A',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    schedule: INITIAL_SCHEDULES[0]
  }
];

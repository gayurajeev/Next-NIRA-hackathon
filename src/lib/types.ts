export type BusCategory = 'Minnal' | 'Swift' | 'Super Fast' | 'Fast Passenger' | 'Ordinary';

export type BusStatus = 'ACTIVE' | 'DELAYED' | 'MAINTENANCE' | 'BREAKDOWN';

export interface BusStop {
  name: string;
  offset: number; // minutes from origin
}

export interface Bus {
  id: string;
  bus_number: string;
  name: string;
  category: BusCategory;
  status: BusStatus;
  capacity: number;
  current_occupancy: number;
  speed_kmh: number;
  current_lat: number;
  current_lng: number;
  driver_name: string;
  driver_phone: string;
}

export interface Route {
  id: string;
  route_code: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_mins: number;
  stops: BusStop[];
}

export interface Schedule {
  id: string;
  bus_id: string;
  route_id: string;
  departure_time: string;
  arrival_time: string;
  fare_inr: number;
  available_seats: number;
  bus?: Bus;
  route?: Route;
}

export interface Booking {
  id: string;
  schedule_id: string;
  passenger_name: string;
  passenger_phone: string;
  seat_number: string;
  ticket_code: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'BOARDED';
  amount_paid: number;
  qr_url: string;
  created_at: string;
  schedule?: Schedule;
}

export interface Incident {
  id: string;
  bus_id?: string;
  reporter_type: 'COMMUTER' | 'DRIVER' | 'DEPOT';
  issue_category: 'SOS_EMERGENCY' | 'BREAKDOWN' | 'OVERCHARGING' | 'DIRTY_BUS' | 'UNSCHEDULED_STOP';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  lat?: number;
  lng?: number;
  created_at: string;
  bus?: Bus;
}

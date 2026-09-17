import { createClient } from '@supabase/supabase-js';
import { INITIAL_BUSES, INITIAL_ROUTES, INITIAL_SCHEDULES, INITIAL_INCIDENTS, MOCK_BOOKINGS } from './mockData';
import { Bus, Route, Schedule, Incident, Booking } from './types';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Data Service Wrapper: Automatically fetches from Supabase if configured,
 * or falls back seamlessly to local interactive state.
 */
export const dataService = {
  async getBuses(): Promise<Bus[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('buses').select('*');
        if (!error && data && data.length > 0) return data as Bus[];
      } catch (e) {
        console.warn('Supabase fetch failed, fallback to local state:', e);
      }
    }
    return INITIAL_BUSES;
  },

  async getRoutes(): Promise<Route[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('routes').select('*');
        if (!error && data && data.length > 0) return data as Route[];
      } catch (e) {
        console.warn('Supabase fetch failed, fallback to local state:', e);
      }
    }
    return INITIAL_ROUTES;
  },

  async getSchedules(): Promise<Schedule[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*, bus:buses(*), route:routes(*)');
        if (!error && data && data.length > 0) return data as Schedule[];
      } catch (e) {
        console.warn('Supabase fetch failed, fallback to local state:', e);
      }
    }
    return INITIAL_SCHEDULES;
  },

  async getIncidents(): Promise<Incident[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*, bus:buses(*)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as Incident[];
      } catch (e) {
        console.warn('Supabase fetch failed, fallback to local state:', e);
      }
    }
    return INITIAL_INCIDENTS;
  },

  async createIncident(incident: Partial<Incident>): Promise<Incident> {
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      bus_id: incident.bus_id,
      reporter_type: incident.reporter_type || 'COMMUTER',
      issue_category: incident.issue_category || 'SOS_EMERGENCY',
      description: incident.description || 'Emergency SOS signal triggered',
      severity: incident.severity || 'HIGH',
      status: 'OPEN',
      lat: incident.lat || 9.9674,
      lng: incident.lng || 76.2998,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('incidents').insert([newInc]).select().single();
        if (!error && data) return data as Incident;
      } catch (e) {
        console.warn('Supabase insert failed, fallback to local insert:', e);
      }
    }

    return newInc;
  },

  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    const ticketCode = `KSRTC-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${booking.seat_number}`;
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      schedule_id: booking.schedule_id || 's1',
      passenger_name: booking.passenger_name || 'Passenger',
      passenger_phone: booking.passenger_phone || '+91 90000 00000',
      seat_number: booking.seat_number || '1A',
      ticket_code: ticketCode,
      status: 'CONFIRMED',
      amount_paid: booking.amount_paid || 250,
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketCode)}`,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('bookings').insert([newBooking]).select().single();
        if (!error && data) return data as Booking;
      } catch (e) {
        console.warn('Supabase insert failed, fallback to local insert:', e);
      }
    }

    return newBooking;
  }
};

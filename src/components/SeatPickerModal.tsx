'use client';

import React, { useState } from 'react';
import { Schedule, Booking } from '@/lib/types';
import { X, Ticket, CheckCircle2, QrCode, Sparkles, User, Phone, Bus } from 'lucide-react';
import { dataService } from '@/lib/supabase';


interface SeatPickerModalProps {
  schedule: Schedule;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const SeatPickerModal: React.FC<SeatPickerModalProps> = ({
  schedule,
  onClose,
  onBookingSuccess,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<string>('12A');
  const [passengerName, setPassengerName] = useState<string>('');
  const [passengerPhone, setPassengerPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Generate 20 seats demo layout (A1..A10, B1..B10)
  const occupiedSeats = ['1A', '2B', '5A', '7B', '9A'];

  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName || !passengerPhone) return;

    setIsSubmitting(true);
    try {
      const newBooking = await dataService.createBooking({
        schedule_id: schedule.id,
        passenger_name: passengerName,
        passenger_phone: passengerPhone,
        seat_number: selectedSeat,
        amount_paid: schedule.fare_inr,
      });

      // Trigger celebration confetti
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EAB308', '#10B981', '#3B82F6'],
        });
      } catch {
        // Confetti optional
      }


      setConfirmedBooking(newBooking);
      onBookingSuccess(newBooking);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 border border-slate-300 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmedBooking ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Select KSRTC Seat & Reserve Ticket</h3>
                <p className="text-xs text-slate-500">
                  {schedule.route?.origin} ➔ {schedule.route?.destination} ({schedule.bus?.name})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BUS SEAT MATRIX */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-4 pb-2 border-b border-slate-200">
                  <span className="flex items-center gap-1.5"><Bus className="w-4 h-4 text-yellow-400" /> Driver Cabin</span>
                  <span>Door Side ➔</span>
                </div>

                {/* Seat Legend */}
                <div className="flex items-center justify-around text-[11px] mb-4 text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span> Available</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 text-slate-950 font-bold"></span> Selected</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 opacity-50 cursor-not-allowed"></span> Occupied</span>
                </div>

                {/* Seat Layout (A & B sides) */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {rows.map(rowNum => {
                    const seatA = `${rowNum}A`;
                    const seatB = `${rowNum}B`;

                    return (
                      <div key={rowNum} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {[seatA, `${rowNum}W`].slice(0, 1).map(() => (
                            <button
                              key={seatA}
                              type="button"
                              disabled={occupiedSeats.includes(seatA)}
                              onClick={() => setSelectedSeat(seatA)}
                              className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                                selectedSeat === seatA
                                  ? 'bg-yellow-500 text-slate-950 border-yellow-300 scale-105 shadow-md shadow-yellow-500/30'
                                  : occupiedSeats.includes(seatA)
                                  ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-500/50 hover:text-slate-900'
                              }`}
                            >
                              {seatA}
                            </button>
                          ))}
                        </div>

                        <span className="text-[10px] text-slate-600 font-mono">Row {rowNum}</span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={occupiedSeats.includes(seatB)}
                            onClick={() => setSelectedSeat(seatB)}
                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center ${
                              selectedSeat === seatB
                                ? 'bg-yellow-500 text-slate-950 border-yellow-300 scale-105 shadow-md shadow-yellow-500/30'
                                : occupiedSeats.includes(seatB)
                                ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-500/50 hover:text-slate-900'
                            }`}
                          >
                            {seatB}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PASSENGER FORM & FARE SUMMARY */}
              <form onSubmit={handleConfirmBooking} className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-yellow-400" /> Passenger Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Anjali Nair"
                      value={passengerName}
                      onChange={e => setPassengerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-yellow-400" /> Phone Number (SMS Ticket)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98470 12345"
                      value={passengerPhone}
                      onChange={e => setPassengerPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Selected Seat</span>
                      <strong className="text-yellow-400 font-mono text-sm">{selectedSeat}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Base Bus Fare</span>
                      <span className="text-slate-900 font-mono">₹{schedule.fare_inr}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Civic Safety & GST Fee</span>
                      <span className="text-emerald-400 font-mono">₹0 (Waived)</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black">
                      <span className="text-slate-900">Total Payable</span>
                      <span className="text-yellow-400 font-mono text-base">₹{schedule.fare_inr}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !passengerName || !passengerPhone}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-950 font-black text-sm shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Issuing Digital QR Ticket...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Reserve & Issue QR Pass
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>
        ) : (
          /* CONFIRMED QR TICKET PASS DISPLAY */
          <div className="text-center py-4 space-y-6">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">KSRTC Ticket Booking Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your digital board pass has been issued and stored in Supabase.
              </p>
            </div>

            {/* Ticket Card View */}
            <div className="max-w-md mx-auto p-6 rounded-3xl bg-white border border-yellow-500/30 text-left space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-yellow-500 text-slate-950 text-[10px] font-black uppercase rounded-bl-2xl">
                OFFICIAL KSRTC PASS
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Passenger</p>
                  <p className="text-base font-extrabold text-slate-900">{confirmedBooking.passenger_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Seat No.</p>
                  <p className="text-2xl font-black text-yellow-400 font-mono">{confirmedBooking.seat_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 text-[10px]">Ticket PNR Code</p>
                  <p className="font-mono font-bold text-emerald-400">{confirmedBooking.ticket_code}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Total Paid</p>
                  <p className="font-mono font-bold text-yellow-400">₹{confirmedBooking.amount_paid}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="pt-4 border-t border-slate-200 flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-white rounded-2xl shadow-inner">
                  {/* eslint-disable-next-html-element-suppression */}
                  <img src={confirmedBooking.qr_url} alt="KSRTC Ticket QR" className="w-32 h-32" />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Scan QR at conductor handheld machine</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

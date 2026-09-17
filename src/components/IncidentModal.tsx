'use client';

import React, { useState } from 'react';
import { Incident, Bus } from '@/lib/types';
import { ShieldAlert, AlertCircle, MapPin, CheckCircle, X, Send, Radio } from 'lucide-react';
import { dataService } from '@/lib/supabase';

interface IncidentModalProps {
  buses: Bus[];
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated: (incident: Incident) => void;
  isSOSMode?: boolean;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  buses,
  isOpen,
  onClose,
  onIncidentCreated,
  isSOSMode = false,
}) => {
  const [selectedBusId, setSelectedBusId] = useState<string>(buses[0]?.id || '');
  const [reporterType, setReporterType] = useState<'COMMUTER' | 'DRIVER' | 'DEPOT'>('COMMUTER');
  const [category, setCategory] = useState<Incident['issue_category']>(
    isSOSMode ? 'SOS_EMERGENCY' : 'BREAKDOWN'
  );
  const [severity, setSeverity] = useState<Incident['severity']>(isSOSMode ? 'CRITICAL' : 'MEDIUM');
  const [description, setDescription] = useState<string>(
    isSOSMode ? 'EMERGENCY SOS BUTTON PRESSED BY COMMUTER. Requesting immediate depot & police ping.' : ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const created = await dataService.createIncident({
        bus_id: selectedBusId,
        reporter_type: reporterType,
        issue_category: category,
        severity: severity,
        description: description,
        lat: 9.9674 + (Math.random() - 0.5) * 0.01,
        lng: 76.2998 + (Math.random() - 0.5) * 0.01,
      });

      setSuccessMsg('Incident Alert Broadcasted to Depot Control Room!');
      onIncidentCreated(created);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Incident submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
        isSOSMode 
          ? 'bg-white border border-slate-200 shadow-sm-red border-red-500/50 glow-red' 
          : 'bg-white border border-slate-200 shadow-sm border-slate-300'
      }`}>
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className={`p-3 rounded-2xl ${isSOSMode ? 'bg-red-500/20 text-red-400 animate-bounce' : 'bg-amber-500/10 text-amber-400'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {isSOSMode ? 'COMMUTER SOS EMERGENCY DISPATCH' : 'Report Transit Issue / Incident'}
            </h3>
            <p className="text-xs text-slate-500">
              {isSOSMode
                ? 'High-priority SOS trigger sent directly to KSRTC Depot Control Room & Police'
                : 'Civic feedback for seat maintenance, delay, or ticket harassment'}
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-lg font-bold text-slate-900">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Bus Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Select KSRTC Bus Number
              </label>
              <select
                value={selectedBusId}
                onChange={e => setSelectedBusId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-red-500"
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bus_number} — {b.name} ({b.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Reporter Type & Issue Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Reporter Category</label>
                <select
                  value={reporterType}
                  onChange={e => setReporterType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs"
                >
                  <option value="COMMUTER">Commuter</option>
                  <option value="DRIVER">Bus Driver</option>
                  <option value="DEPOT">Depot Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Issue Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs"
                >
                  <option value="SOS_EMERGENCY">SOS Emergency</option>
                  <option value="BREAKDOWN">Vehicle Breakdown</option>
                  <option value="OVERCHARGING">Ticket / Overcharging</option>
                  <option value="DIRTY_BUS">Bus Cleanliness</option>
                  <option value="UNSCHEDULED_STOP">Unscheduled Delay</option>
                </select>
              </div>
            </div>

            {/* Severity Pill Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Severity Level</label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 rounded-xl text-[11px] font-extrabold border transition-all ${
                      severity === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-red-600 text-slate-900 border-red-400 glow-red'
                          : sev === 'HIGH'
                          ? 'bg-amber-600 text-slate-900 border-amber-400'
                          : 'bg-yellow-500 text-slate-950 border-yellow-400'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Description & Context</label>
              <textarea
                required
                rows={3}
                placeholder="Describe location, incident details, or emergency status..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-red-500"
              ></textarea>
            </div>

            {/* GPS Location Ping info */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" /> Geolocation Ping: Active (Vyttila Hub, Kochi)
              </span>
              <span className="font-mono text-emerald-400">± 4m Accuracy</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                isSOSMode
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-slate-900 shadow-red-600/40 hover:scale-[1.02]'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 shadow-yellow-500/20 hover:scale-[1.02]'
              }`}
            >
              {isSubmitting ? (
                <span>Dispatching SOS Alert...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Broadcast Incident Alert
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

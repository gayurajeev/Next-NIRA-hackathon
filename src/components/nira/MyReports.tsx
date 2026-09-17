'use client';

import React, { useState } from 'react';
import { DrainageReport } from '@/lib/niraTypes';
import { ClipboardList, User, MapPin, CheckCircle2 } from 'lucide-react';

interface MyReportsProps {
  reports: DrainageReport[];
}

export const MyReports: React.FC<MyReportsProps> = ({ reports }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredReports = reports.filter(rep => {
    if (filterStatus === 'ALL') return true;
    return rep.status === filterStatus;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#256BF5]" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              My Submitted Drainage Reports
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Track real-time progress timeline, municipal officer assignment, and resolution status for your tickets.
          </p>
        </div>

        {/* Status Filter Pills (Fund My Crazy Style) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-black transition-all ${
                filterStatus === st
                  ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* REPORTS LIST */}
      <div className="space-y-6">
        {filteredReports.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
            <p className="text-base font-black">No drainage reports found for this filter.</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 space-y-6"
            >
              {/* TOP HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                    {/* eslint-disable-next-html-element-suppression */}
                    <img src={report.photo_url} alt="Drainage photo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-[#256BF5]">{report.ticket_code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        report.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-[#10B981]'
                          : report.status === 'ESCALATED'
                          ? 'bg-red-100 text-[#EF4444]'
                          : report.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-[#256BF5]'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">{report.issue_type.replace(/_/g, ' ')}</h3>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#EF4444]" /> {report.ward} • {report.landmark}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-slate-500">Impact Score</div>
                  <div className="text-2xl font-black text-[#256BF5] font-mono">{report.priority_score}<span className="text-xs text-slate-400">/100</span></div>
                </div>
              </div>

              {/* DESCRIPTION & ASSIGNED OFFICER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="font-black text-slate-700">Description:</p>
                  <p className="text-slate-600 font-medium">{report.description}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="font-black text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#256BF5]" /> Assigned Officer:
                  </p>
                  <p className="text-slate-900 font-bold">{report.assigned_officer || 'Rerouting to Ward AE...'}</p>
                  {report.escalated_reason && (
                    <p className="text-[#EF4444] text-[11px] font-bold pt-1">
                      ⚠️ Escalated: {report.escalated_reason}
                    </p>
                  )}
                </div>
              </div>

              {/* TIMELINE PROGRESS PIPELINE (Fund My Crazy Style) */}
              <div className="pt-2">
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-3">Resolution Progress Timeline</p>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-black">
                  
                  {/* Step 1: Reported */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 rounded-full bg-[#256BF5]"></div>
                    <span className="text-[#256BF5]">1. Reported</span>
                  </div>

                  {/* Step 2: Ward Officer Assigned */}
                  <div className="space-y-1.5">
                    <div className={`w-full h-2.5 rounded-full ${report.status !== 'OPEN' ? 'bg-[#256BF5]' : 'bg-slate-200'}`}></div>
                    <span className={report.status !== 'OPEN' ? 'text-[#256BF5]' : 'text-slate-400'}>2. Ward Assigned</span>
                  </div>

                  {/* Step 3: In Progress / Escalated */}
                  <div className="space-y-1.5">
                    <div className={`w-full h-2.5 rounded-full ${
                      report.status === 'IN_PROGRESS' || report.status === 'RESOLVED'
                        ? 'bg-[#256BF5]'
                        : report.status === 'ESCALATED'
                        ? 'bg-[#EF4444]'
                        : 'bg-slate-200'
                    }`}></div>
                    <span className={
                      report.status === 'ESCALATED' 
                        ? 'text-[#EF4444]' 
                        : report.status === 'IN_PROGRESS' || report.status === 'RESOLVED'
                        ? 'text-[#256BF5]' 
                        : 'text-slate-400'
                    }>
                      3. {report.status === 'ESCALATED' ? 'Escalated' : 'In Progress'}
                    </span>
                  </div>

                  {/* Step 4: Resolved */}
                  <div className="space-y-1.5">
                    <div className={`w-full h-2.5 rounded-full ${report.status === 'RESOLVED' ? 'bg-[#10B981]' : 'bg-slate-200'}`}></div>
                    <span className={report.status === 'RESOLVED' ? 'text-[#10B981]' : 'text-slate-400'}>4. Cleared</span>
                  </div>

                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};

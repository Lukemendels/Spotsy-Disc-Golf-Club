import React from "react";
import { Officer } from "../types";
import { ShieldCheck, Mail } from "lucide-react";

interface LeadershipPageProps {
  officers: Officer[];
}

export const LeadershipPage: React.FC<LeadershipPageProps> = ({ officers }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Club Governance & Officers</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Spotsy Disc Golf Leadership</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Elected club officers and board members serving Spotsylvania County disc golf development, course maintenance, and player advocacy.
        </p>
      </div>

      {/* Officers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {officers.map((officer) => (
          <div
            key={officer.id}
            className="bg-white border border-slate-200 rounded-xl p-5 card-shadow flex flex-col justify-between space-y-3 hover:border-slate-300 transition"
          >
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-700 text-white font-black text-base flex items-center justify-center shrink-0">
                  {officer.name.charAt(0)}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{officer.name}</h3>
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                    {officer.roleTitle}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {officer.bio}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-green-600" /> Official Contact:
              </span>
              <p className="text-xs text-slate-800 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 select-all">
                {officer.contactChannel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


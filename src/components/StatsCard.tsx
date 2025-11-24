import React from 'react';
import { Users, Crown, Star } from 'lucide-react';

interface StatsCardProps {
  totalStudents: number;
  averageGPA: number;
  highestTotal: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ totalStudents, averageGPA, highestTotal }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
      {/* Students Card */}
      <div className="bg-sky/30 p-4 md:p-6 rounded-bubble shadow-pop flex items-center gap-4 border-4 border-white transition-transform hover:-translate-y-1">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-sky-400 shadow-sm flex-shrink-0">
          <Users size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-bold text-slate-500 text-xs md:text-sm mb-1">จำนวนนักเรียน</p>
          <h3 className="text-2xl md:text-4xl font-bold text-slate-700">{totalStudents} <span className="text-sm md:text-lg text-slate-500">คน</span></h3>
        </div>
      </div>

      {/* Average GPA Card */}
      <div className="bg-mint/40 p-4 md:p-6 rounded-bubble shadow-pop flex items-center gap-4 border-4 border-white transition-transform hover:-translate-y-1">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-teal-400 shadow-sm flex-shrink-0">
          <Star size={24} className="md:w-8 md:h-8" strokeWidth={2.5} fill="#4fd1c5" />
        </div>
        <div>
          <p className="font-bold text-slate-500 text-xs md:text-sm mb-1">เกรดเฉลี่ย (GPA)</p>
          <h3 className="text-2xl md:text-4xl font-bold text-slate-700">{averageGPA ? averageGPA.toFixed(2) : '0.00'}</h3>
        </div>
      </div>

      {/* Highest Score Card */}
      <div className="bg-lemon p-4 md:p-6 rounded-bubble shadow-pop flex items-center gap-4 border-4 border-white transition-transform hover:-translate-y-1">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-orange-400 shadow-sm flex-shrink-0">
          <Crown size={24} className="md:w-8 md:h-8" strokeWidth={2.5} fill="#fb923c" />
        </div>
        <div>
          <p className="font-bold text-slate-500 text-xs md:text-sm mb-1">คะแนนสูงสุด</p>
          <h3 className="text-2xl md:text-4xl font-bold text-slate-700">{highestTotal}</h3>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
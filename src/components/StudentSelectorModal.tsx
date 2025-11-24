import React, { useState } from 'react';
import { Search, Check, X, UserPlus } from 'lucide-react';
import { MasterStudent } from '../types';
import { masterStudentDB } from '../data/students';

interface StudentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedStudents: MasterStudent[]) => void;
  existingStudentIds: string[];
}

const StudentSelectorModal: React.FC<StudentSelectorModalProps> = ({ isOpen, onClose, onImport, existingStudentIds }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const filteredStudents = masterStudentDB.filter(s => 
    !existingStudentIds.includes(s.id) && 
    (s.name.includes(searchTerm) || s.id.includes(searchTerm) || s.originalClass.includes(searchTerm))
  );

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleImport = () => {
    const studentsToImport = masterStudentDB.filter(s => selectedIds.has(s.id));
    onImport(studentsToImport);
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border-4 border-white animate-in zoom-in-95 duration-200">
        <div className="bg-peach p-4 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <UserPlus size={24} /> เลือกนักเรียน
          </h2>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/40 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-cream border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ, รหัสนักเรียน..." 
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-peach outline-none font-bold text-slate-600 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold">
              ไม่พบรายชื่อ หรือ มีอยู่ในห้องแล้ว
            </div>
          ) : (
            filteredStudents.map(student => (
              <div 
                key={student.id}
                onClick={() => toggleSelection(student.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                  selectedIds.has(student.id) 
                    ? 'bg-lemon border-orange-300 shadow-sm' 
                    : 'bg-white border-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.has(student.id) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                    {selectedIds.has(student.id) && <Check size={14} className="text-white" strokeWidth={4} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 truncate">{student.name}</p>
                    <p className="text-xs text-slate-400 font-bold truncate">ID: {student.id} | ห้องเดิม: {student.originalClass}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center safe-area-pb">
          <span className="font-bold text-slate-500 text-sm">เลือก {selectedIds.size} คน</span>
          <button 
            onClick={handleImport}
            disabled={selectedIds.size === 0}
            className={`px-6 py-3 rounded-2xl font-bold text-white shadow-pop transition-all ${
              selectedIds.size > 0 
                ? 'bg-mint text-teal-800 hover:shadow-pop-hover hover:-translate-y-1 active:translate-y-0' 
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            นำเข้า 📥
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSelectorModal;
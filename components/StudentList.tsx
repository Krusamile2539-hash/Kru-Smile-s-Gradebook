import React, { useState } from 'react';
import { Trash2, Users, UserPlus } from 'lucide-react';
import { Student, MasterStudent } from '../types';
import StudentSelectorModal from './StudentSelectorModal';

interface StudentListProps {
  students: Student[];
  onUpdateStudents: (updatedStudents: Student[]) => void;
  classTitle: string;
}

const StudentList: React.FC<StudentListProps> = ({ students, onUpdateStudents, classTitle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const calculateTotal = (s: Student) => {
    const mid = (s.midterm.c1 || 0) + (s.midterm.c2 || 0) + (s.midterm.c3 || 0) + (s.midterm.exam || 0);
    const fin = (s.final.c1 || 0) + (s.final.c2 || 0) + (s.final.c3 || 0) + (s.final.exam || 0);
    return mid + fin;
  };

  const calculateGrade = (total: number) => {
    if (total >= 80) return 4;
    if (total >= 75) return 3.5;
    if (total >= 70) return 3;
    if (total >= 65) return 2.5;
    if (total >= 60) return 2;
    if (total >= 55) return 1.5;
    if (total >= 50) return 1;
    return 0;
  };

  const getGradeStyle = (grade: number) => {
    if (grade >= 3.5) return 'bg-lemon text-orange-600';
    if (grade >= 2.5) return 'bg-mint text-teal-700';
    if (grade >= 1) return 'bg-sky/30 text-blue-600';
    return 'bg-rose text-white font-black'; // Fail
  };

  const handleImportStudents = (selected: MasterStudent[]) => {
    const newStudents: Student[] = selected.map((m, index) => ({
      id: crypto.randomUUID(),
      masterId: m.id,
      no: (students.length + index + 1).toString(), // Auto-assign next number
      studentId: m.id,
      name: m.name,
      midterm: { c1: 0, c2: 0, c3: 0, exam: 0 },
      final: { c1: 0, c2: 0, c3: 0, exam: 0 }
    }));
    
    onUpdateStudents([...students, ...newStudents]);
  };

  const handleDelete = (id: string) => {
    if (confirm('ต้องการลบนักเรียนคนนี้ออกจากห้องใช่มั้ยครับ?')) {
      onUpdateStudents(students.filter(s => s.id !== id));
    }
  };

  const handleScoreChange = (id: string, field: 'midterm' | 'final', subField: string, value: string) => {
    // Allow empty string for deleting
    if (value === '') {
       const updated = students.map(s => {
        if (s.id === id) {
          return { ...s, [field]: { ...s[field], [subField]: 0 } };
        }
        return s;
      });
      onUpdateStudents(updated);
      return;
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    const updated = students.map(s => {
      if (s.id === id) {
        return {
          ...s,
          [field]: {
            ...s[field],
            [subField]: numVal
          }
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  return (
    <div className="bg-white rounded-3xl shadow-soft border-4 border-white overflow-hidden min-h-[600px] flex flex-col relative">
      <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-slate-700 flex items-center justify-center md:justify-start gap-2">
            <span className="text-peach text-2xl md:text-3xl">📝</span> 
            <span>เกรดห้อง <span className="text-peach">{classTitle}</span></span>
          </h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm mt-1 md:ml-10">{students.length} นักเรียน</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-peach hover:bg-orange-300 text-white px-6 py-3 rounded-2xl font-bold shadow-pop hover:shadow-pop-hover hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm md:text-base active:translate-y-0"
        >
          <UserPlus size={20} /> เพิ่มนักเรียน
        </button>
      </div>

      {students.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
           <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users size={48} className="text-slate-300" />
           </div>
           <h3 className="text-lg md:text-xl font-bold text-slate-400">ยังไม่มีนักเรียนในห้องนี้</h3>
           <p className="text-slate-400 text-sm">กดปุ่ม "เพิ่มนักเรียน" ด้านบนได้เลย!</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 w-full pb-10">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="text-xs md:text-sm">
                {/* Sticky Header Group for Name */}
                <th className="sticky left-0 z-40 p-3 bg-white text-slate-500 font-bold border-b-2 border-r border-slate-100 min-w-[140px] md:min-w-[200px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] text-left pl-4 align-bottom" rowSpan={2}>
                   รายชื่อ ({students.length})
                </th>

                <th className="p-2 bg-sky/20 text-sky-700 font-bold border-l-2 border-white text-center rounded-t-xl" colSpan={4}>กลางภาค (Mid)</th>
                <th className="p-2 bg-rose/20 text-rose-700 font-bold border-l-2 border-white text-center rounded-t-xl" colSpan={4}>ปลายภาค (Final)</th>
                <th className="p-2 bg-lemon text-orange-600 font-bold border-l-2 border-white text-center rounded-t-xl" colSpan={3}>สรุปผล</th>
              </tr>
              <tr className="text-[10px] md:text-xs text-slate-500 font-bold bg-slate-50">
                {/* Mid Inputs Header */}
                <th className="p-2 min-w-[50px] bg-sky/5 border-b border-white">เก็บ1</th>
                <th className="p-2 min-w-[50px] bg-sky/5 border-b border-white">เก็บ2</th>
                <th className="p-2 min-w-[50px] bg-sky/5 border-b border-white">เก็บ3</th>
                <th className="p-2 min-w-[50px] bg-sky/10 border-b border-white text-sky-600">สอบ</th>

                {/* Final Inputs Header */}
                <th className="p-2 min-w-[50px] bg-rose/5 border-b border-white">เก็บ1</th>
                <th className="p-2 min-w-[50px] bg-rose/5 border-b border-white">เก็บ2</th>
                <th className="p-2 min-w-[50px] bg-rose/5 border-b border-white">เก็บ3</th>
                <th className="p-2 min-w-[50px] bg-rose/10 border-b border-white text-rose-600">สอบ</th>

                <th className="p-2 min-w-[50px] bg-lemon/30 border-b border-white">รวม</th>
                <th className="p-2 min-w-[50px] bg-lemon/50 border-b border-white">เกรด</th>
                <th className="p-2 w-10 bg-white border-b border-white">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const total = calculateTotal(student);
                const grade = calculateGrade(total);
                
                // Helper for Input Cell
                const NumInput = ({ val, onChange, colorClass }: any) => (
                  <input 
                    type="text" 
                    inputMode="decimal" // Triggers numeric keyboard on mobile
                    pattern="[0-9]*"
                    className={`w-full h-12 md:h-10 text-center bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-inset font-bold text-sm md:text-base transition-all ${colorClass}`}
                    value={val === 0 ? '' : val} 
                    placeholder="-"
                    onChange={e => onChange(e.target.value)}
                    onFocus={(e) => e.target.select()} // Auto select content on click
                  />
                );

                return (
                  <tr key={student.id} className="hover:bg-slate-50 group">
                    {/* Sticky Name Column - Enhanced for Mobile */}
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] p-0 align-middle">
                      <div className="flex items-center h-12 md:h-10 px-2 md:px-3 gap-2 md:gap-3">
                         <div className="w-6 text-center text-xs font-bold text-slate-300 shrink-0">
                            {student.no}
                         </div>
                         <div className="hidden md:block w-8 h-8 rounded-full bg-cream border border-slate-200 shrink-0 overflow-hidden">
                            <img src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${student.name}`} className="w-full h-full object-cover" alt="av" />
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-xs md:text-sm font-bold text-slate-700 truncate w-[90px] md:w-[140px]">{student.name}</span>
                         </div>
                      </div>
                    </td>

                    {/* Midterm Inputs */}
                    <td className="p-0 border-r border-slate-100 bg-sky/5"><NumInput val={student.midterm.c1} onChange={(v:string) => handleScoreChange(student.id, 'midterm', 'c1', v)} colorClass="text-slate-600 focus:ring-sky-200"/></td>
                    <td className="p-0 border-r border-slate-100 bg-sky/5"><NumInput val={student.midterm.c2} onChange={(v:string) => handleScoreChange(student.id, 'midterm', 'c2', v)} colorClass="text-slate-600 focus:ring-sky-200"/></td>
                    <td className="p-0 border-r border-slate-100 bg-sky/5"><NumInput val={student.midterm.c3} onChange={(v:string) => handleScoreChange(student.id, 'midterm', 'c3', v)} colorClass="text-slate-600 focus:ring-sky-200"/></td>
                    <td className="p-0 border-r border-slate-100 bg-sky/10"><NumInput val={student.midterm.exam} onChange={(v:string) => handleScoreChange(student.id, 'midterm', 'exam', v)} colorClass="text-sky-700 focus:ring-sky-300"/></td>

                    {/* Final Inputs */}
                    <td className="p-0 border-r border-slate-100 bg-rose/5"><NumInput val={student.final.c1} onChange={(v:string) => handleScoreChange(student.id, 'final', 'c1', v)} colorClass="text-slate-600 focus:ring-rose-200"/></td>
                    <td className="p-0 border-r border-slate-100 bg-rose/5"><NumInput val={student.final.c2} onChange={(v:string) => handleScoreChange(student.id, 'final', 'c2', v)} colorClass="text-slate-600 focus:ring-rose-200"/></td>
                    <td className="p-0 border-r border-slate-100 bg-rose/5"><NumInput val={student.final.c3} onChange={(v:string) => handleScoreChange(student.id, 'final', 'c3', v)} colorClass="text-slate-600 focus:ring-rose-200"/></td>
                    <td className="p-0 border-r border-slate-100 bg-rose/10"><NumInput val={student.final.exam} onChange={(v:string) => handleScoreChange(student.id, 'final', 'exam', v)} colorClass="text-rose-600 focus:ring-rose-300"/></td>

                    {/* Results */}
                    <td className={`text-center font-bold border-r border-slate-100 text-sm md:text-base ${grade === 0 ? 'text-rose' : 'text-slate-700'}`}>{total}</td>
                    <td className="p-1 text-center border-r border-slate-100">
                       <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black mx-auto ${getGradeStyle(grade)}`}>{grade}</div>
                    </td>
                    <td className="text-center p-0">
                       <button onClick={() => handleDelete(student.id)} className="p-2 text-slate-300 hover:text-rose transition-colors"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <StudentSelectorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleImportStudents}
        existingStudentIds={students.map(s => s.masterId || '')}
      />
    </div>
  );
};

export default StudentList;
import React, { useState, useEffect } from 'react';
import { Plus, Save, X, User, Hash, FileText } from 'lucide-react';
import { Student, StudentFormData } from '../types';

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  onCancelEdit: () => void;
  editingStudent: Student | null;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSubmit, onCancelEdit, editingStudent }) => {
  // Basic Info
  const [no, setNo] = useState('');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  
  // Midterm
  const [midC1, setMidC1] = useState('');
  const [midC2, setMidC2] = useState('');
  const [midC3, setMidC3] = useState('');
  const [midExam, setMidExam] = useState('');

  // Final
  const [finC1, setFinC1] = useState('');
  const [finC2, setFinC2] = useState('');
  const [finC3, setFinC3] = useState('');
  const [finExam, setFinExam] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (editingStudent) {
      setNo(editingStudent.no.toString());
      setStudentId(editingStudent.studentId);
      setName(editingStudent.name);
      
      setMidC1(editingStudent.midterm.c1.toString());
      setMidC2(editingStudent.midterm.c2.toString());
      setMidC3(editingStudent.midterm.c3.toString());
      setMidExam(editingStudent.midterm.exam.toString());

      setFinC1(editingStudent.final.c1.toString());
      setFinC2(editingStudent.final.c2.toString());
      setFinC3(editingStudent.final.c3.toString());
      setFinExam(editingStudent.final.exam.toString());
    } else {
      resetForm();
    }
    setError('');
  }, [editingStudent]);

  const resetForm = () => {
    setNo('');
    setStudentId('');
    setName('');
    setMidC1(''); setMidC2(''); setMidC3(''); setMidExam('');
    setFinC1(''); setFinC2(''); setFinC3(''); setFinExam('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('กรอกชื่อน้องด้วยนะจ๊ะ! 😊');
      return;
    }

    const parseScore = (val: string) => parseFloat(val) || 0;

    const data: StudentFormData = {
      no: no,
      studentId: studentId,
      name: name,
      midterm: {
        c1: parseScore(midC1),
        c2: parseScore(midC2),
        c3: parseScore(midC3),
        exam: parseScore(midExam),
      },
      final: {
        c1: parseScore(finC1),
        c2: parseScore(finC2),
        c3: parseScore(finC3),
        exam: parseScore(finExam),
      }
    };

    onSubmit(data);
    
    if (!editingStudent) {
      resetForm();
    }
  };

  const InputGroup = ({ label, val, setVal, placeholder }: any) => (
    <div className="flex-1">
      <label className="text-xs font-bold text-slate-400 ml-2 mb-1 block">{label}</label>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-peach/30 focus:border-peach text-slate-700 font-bold text-center"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="bg-white rounded-bubble shadow-soft border-4 border-peach/30 p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${editingStudent ? 'bg-lemon text-orange-500' : 'bg-peach text-white'}`}>
            {editingStudent ? <Save size={20} /> : <Plus size={20} />}
          </div>
          {editingStudent ? 'แก้ไขข้อมูล' : 'เพิ่มนักเรียน'}
        </h2>
        {editingStudent && (
          <button 
            onClick={onCancelEdit}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <X size={16} strokeWidth={3} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Info Section */}
        <div className="space-y-3 p-4 bg-slate-50/80 rounded-3xl border-2 border-slate-100">
          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">เลขที่</label>
              <input type="text" value={no} onChange={e => setNo(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-slate-100 rounded-2xl text-center font-bold text-slate-700" placeholder="1" />
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">รหัสนักเรียน</label>
              <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-slate-100 rounded-2xl text-center font-bold text-slate-700" placeholder="STD001" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 ml-2">ชื่อ-นามสกุล</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700" placeholder="ด.ช. รักเรียน..." />
          </div>
        </div>

        {/* Midterm Section */}
        <div className="p-4 bg-sky/10 rounded-3xl border-2 border-sky/20">
          <h3 className="font-bold text-sky-600 mb-2 flex items-center gap-2 text-sm"><FileText size={14}/> คะแนนกลางภาค</h3>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <InputGroup label="เก็บ 1" val={midC1} setVal={setMidC1} placeholder="0" />
            <InputGroup label="เก็บ 2" val={midC2} setVal={setMidC2} placeholder="0" />
            <InputGroup label="เก็บ 3" val={midC3} setVal={setMidC3} placeholder="0" />
            <InputGroup label="สอบ" val={midExam} setVal={setMidExam} placeholder="0" />
          </div>
        </div>

        {/* Final Section */}
        <div className="p-4 bg-rose/10 rounded-3xl border-2 border-rose/20">
          <h3 className="font-bold text-rose-500 mb-2 flex items-center gap-2 text-sm"><FileText size={14}/> คะแนนปลายภาค</h3>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <InputGroup label="เก็บ 1" val={finC1} setVal={setFinC1} placeholder="0" />
            <InputGroup label="เก็บ 2" val={finC2} setVal={setFinC2} placeholder="0" />
            <InputGroup label="เก็บ 3" val={finC3} setVal={setFinC3} placeholder="0" />
            <InputGroup label="สอบ" val={finExam} setVal={setFinExam} placeholder="0" />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose text-white text-sm font-bold rounded-2xl animate-bounce text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 px-6 rounded-3xl shadow-pop text-lg font-bold text-white transition-all transform hover:-translate-y-1 hover:shadow-pop-hover active:translate-y-0 ${
            editingStudent 
              ? 'bg-lemon text-orange-600 border-2 border-orange-200' 
              : 'bg-peach border-2 border-white'
          }`}
        >
          {editingStudent ? 'บันทึกแก้ไข 👍' : 'เพิ่มนักเรียน 🚀'}
        </button>
      </form>
    </div>
  );
};

export default StudentForm;
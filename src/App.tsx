import React, { useState, useMemo, useEffect } from 'react';
import { Smile, ArrowRight, Folder, ChevronRight, Plus, LayoutGrid, ArrowLeft, Eye, EyeOff, CheckCircle2, UploadCloud, Lock, LogOut } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import StudentList from './components/StudentList';
import StatsCard from './components/StatsCard';
import { Subject, Student } from './types';
import { masterStudentDB } from './data/students';

type ViewState = 'dashboard' | 'class-list' | 'grading';

const App: React.FC = () => {
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // เก็บ Password ไว้ในเครื่อง
  const [storedPassword, setStoredPassword] = useLocalStorage<string>('kru_smile_pin', '');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // --- Data State (Local Storage) ---
  const getInitialData = (): Subject[] => {
     const createClassFromDB = (className: string, searchKey: string) => {
        const students = masterStudentDB
          .filter(m => m.originalClass === searchKey)
          .map((m, index) => ({
             id: crypto.randomUUID(),
             masterId: m.id,
             no: (index + 1).toString(),
             studentId: m.id,
             name: m.name,
             midterm: { c1: 0, c2: 0, c3: 0, exam: 0 },
             final: { c1: 0, c2: 0, c3: 0, exam: 0 }
          }));
        
        return {
           id: crypto.randomUUID(),
           name: className,
           students
        };
     };

     return [
       {
         id: 'subj-1',
         name: 'สังคมศึกษา 6',
         code: 'ส23102',
         classes: [
            createClassFromDB('3/1', '3/1'),
            createClassFromDB('3/5', '3/5'),
         ]
       },
     ];
  };

  // ใช้ LocalStorage แทน Google Sheets
  const [subjects, setSubjectsRaw] = useLocalStorage<Subject[]>('kru_smile_data', getInitialData());
  const [isSaving, setIsSaving] = useState(false);

  // Wrapper function เพื่อทำ Effect ว่ากำลังบันทึก
  const setSubjects = (newData: Subject[]) => {
    setIsSaving(true);
    setSubjectsRaw(newData);
    // แกล้งหน่วงเวลาให้ User เห็นว่าบันทึกแล้ว
    setTimeout(() => setIsSaving(false), 600);
  };
  
  // --- Navigation State ---
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const activeSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const activeClass = useMemo(() => activeSubject?.classes.find(c => c.id === selectedClassId), [activeSubject, selectedClassId]);

  // --- Actions ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (passwordInput.length < 4) {
      setLoginError("รหัสผ่านต้องมีอย่างน้อย 4 ตัวนะครับ");
      return;
    }

    if (!storedPassword) {
      // ครั้งแรก: ตั้งรหัสผ่าน
      if (confirm(`คุณต้องการตั้งรหัสผ่านเป็น "${passwordInput}" ใช่ไหมครับ?`)) {
        setStoredPassword(passwordInput);
        setIsLoggedIn(true);
      }
    } else {
      // ครั้งต่อไป: ตรวจสอบรหัส
      if (passwordInput === storedPassword) {
        setIsLoggedIn(true);
      } else {
        setLoginError("รหัสผ่านไม่ถูกต้องครับ");
        setPasswordInput('');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPasswordInput('');
    setCurrentView('dashboard');
  };

  const createSubject = () => {
    const name = prompt('ชื่อวิชา (เช่น คณิตศาสตร์):');
    if (!name) return;
    const newSubject: Subject = { id: crypto.randomUUID(), name, code: '', classes: [] };
    setSubjects([...subjects, newSubject]);
  };

  const createClass = () => {
    if (!selectedSubjectId) return;
    const name = prompt('ชื่อห้องเรียน (เช่น 3/1):');
    if (!name) return;

    const newSubjects = subjects.map(sub => {
      if (sub.id === selectedSubjectId) {
        return { ...sub, classes: [...sub.classes, { id: crypto.randomUUID(), name, students: [] }] };
      }
      return sub;
    });
    setSubjects(newSubjects);
  };

  const updateStudentsInClass = (updatedStudents: Student[]) => {
    if (!selectedSubjectId || !selectedClassId) return;
    const newSubjects = subjects.map(sub => {
      if (sub.id === selectedSubjectId) {
        return { ...sub, classes: sub.classes.map(cls => cls.id === selectedClassId ? { ...cls, students: updatedStudents } : cls) };
      }
      return sub;
    });
    setSubjects(newSubjects);
  };

  const goHome = () => {
    setCurrentView('dashboard');
    setSelectedSubjectId(null);
    setSelectedClassId(null);
  };

  const goToClassList = (subId: string) => {
    setSelectedSubjectId(subId);
    setCurrentView('class-list');
  };

  const goToGrading = (clsId: string) => {
    setSelectedClassId(clsId);
    setCurrentView('grading');
  };

  const stats = useMemo(() => {
    let totalStudents = 0;
    let sumGPA = 0;
    let studentCountForGPA = 0;
    let maxScore = 0;

    const calcG = (total: number) => {
       if (total >= 80) return 4;
       if (total >= 75) return 3.5;
       if (total >= 70) return 3;
       if (total >= 65) return 2.5;
       if (total >= 60) return 2;
       if (total >= 55) return 1.5;
       if (total >= 50) return 1;
       return 0;
    };

    const processStudents = (stList: Student[]) => {
      stList.forEach(s => {
        totalStudents++;
        const total = (s.midterm.c1||0)+(s.midterm.c2||0)+(s.midterm.c3||0)+(s.midterm.exam||0) + (s.final.c1||0)+(s.final.c2||0)+(s.final.c3||0)+(s.final.exam||0);
        if(total > maxScore) maxScore = total;
        sumGPA += calcG(total);
        studentCountForGPA++;
      });
    };

    if (currentView === 'grading' && activeClass) processStudents(activeClass.students);
    else if (currentView === 'class-list' && activeSubject) activeSubject.classes.forEach(c => processStudents(c.students));
    else subjects.forEach(s => s.classes.forEach(c => processStudents(c.students)));

    return { total: totalStudents, avgGPA: studentCountForGPA ? sumGPA / studentCountForGPA : 0, highestTotal: maxScore };
  }, [subjects, currentView, activeClass, activeSubject]);


  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-10 left-10 w-32 h-32 bg-peach/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-mint/30 rounded-full blur-xl animate-pulse delay-700"></div>

        <div className="bg-white p-6 md:p-10 rounded-bubble shadow-soft border-4 border-white max-w-sm w-full relative z-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-peach text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-pop animate-bounce border-4 border-white">
            <Lock size={36} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-700 mb-2">
            {storedPassword ? 'ยินดีต้อนรับกลับครับ' : 'ตั้งรหัสผ่านเข้าใช้งาน'}
          </h1>
          <p className="text-slate-400 mb-8 font-bold text-sm">
             {storedPassword ? 'กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบ' : 'กำหนดรหัสผ่านเพื่อความเป็นส่วนตัว'}
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <div className="relative">
                    <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="รหัสผ่าน (4 ตัวขึ้นไป)"
                    className="w-full text-center text-xl font-bold p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-peach/20 focus:border-peach outline-none text-slate-600 transition-all tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-base"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-peach transition p-2">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
              </div>

              {loginError && (
                <div className="text-rose font-bold text-sm text-center bg-rose/10 py-2 rounded-xl animate-shake">
                   {loginError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={!passwordInput}
                className="w-full py-4 bg-peach text-white font-bold rounded-3xl shadow-pop hover:translate-y-[-2px] hover:shadow-pop-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-300 active:translate-y-0 text-lg"
              >
                {storedPassword ? 'เข้าสู่ระบบ 🚀' : 'เริ่มใช้งาน ✅'}
              </button>
            </form>
        </div>
        <div className="absolute bottom-4 text-slate-300 text-xs font-bold">
           ข้อมูลถูกเก็บไว้ในเครื่องของคุณเท่านั้น (Local Storage)
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden bg-cream font-sans">
      <nav className="pt-2 md:pt-4 pb-2 mb-2 sticky top-0 z-50 px-2 md:px-3">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-full border-2 border-white shadow-soft px-3 py-2 md:px-6 md:py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
              <div className="bg-peach p-2 rounded-full shadow-pop border-2 border-white">
                <Smile className="text-white h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="font-black text-lg md:text-2xl text-slate-700 tracking-tight leading-none">
                  Kru Smile<span className="text-peach">'</span>s
                </h1>
                <div className="flex items-center gap-2">
                   {isSaving ? (
                      <div className="flex items-center gap-1 bg-sky/10 px-2 py-0.5 rounded-full border border-sky/20 animate-pulse">
                        <UploadCloud size={12} className="text-sky-500"/>
                        <span className="text-[10px] font-bold text-sky-600">Saving...</span>
                      </div>
                   ) : (
                       <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                          <CheckCircle2 size={12} className="text-green-600"/>
                          <span className="text-[10px] font-bold text-green-600">Saved</span>
                       </div>
                   )}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="bg-rose/10 text-rose px-3 py-2 md:px-4 md:py-2 rounded-full md:rounded-2xl font-bold hover:bg-rose hover:text-white transition flex items-center gap-2 text-xs md:text-sm">
               <span className="hidden md:inline">ออกจากระบบ</span> <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-2 md:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold text-xs md:text-lg overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide px-1">
          <button onClick={goHome} className={`${currentView === 'dashboard' ? 'text-peach underline decoration-wavy' : ''}`}>Dashboard</button>
          {activeSubject && <><ChevronRight size={14} /><button onClick={() => goToClassList(activeSubject.id)} className={`${currentView === 'class-list' ? 'text-peach underline decoration-wavy' : ''}`}>{activeSubject.name}</button></>}
          {activeClass && <><ChevronRight size={14} /><span className="text-peach underline decoration-wavy">ห้อง {activeClass.name}</span></>}
        </div>

        <StatsCard totalStudents={stats.total} averageGPA={stats.avgGPA} highestTotal={stats.highestTotal} />

        {currentView === 'dashboard' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-2xl font-bold text-slate-700 flex items-center gap-2"><LayoutGrid size={20}/> รายวิชา</h2>
              <button onClick={createSubject} className="bg-mint text-teal-800 px-3 py-2 rounded-2xl font-bold shadow-pop flex items-center gap-1 text-sm transition-transform hover:-translate-y-1 active:translate-y-0"><Plus size={16} /> สร้างวิชา</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {subjects.map(sub => (
                <div key={sub.id} onClick={() => goToClassList(sub.id)} className="bg-white p-5 rounded-bubble shadow-soft border-4 border-white cursor-pointer hover:border-peach transition-all hover:-translate-y-1">
                  <div className="flex justify-between mb-2">
                     <div className="w-10 h-10 bg-sky/20 rounded-xl flex items-center justify-center text-sky-600"><Folder size={20} /></div>
                     <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-lg h-fit">{sub.classes.length} ห้อง</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">{sub.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'class-list' && activeSubject && (
          <div>
            <div className="flex justify-between items-center mb-4">
               <button onClick={goHome} className="bg-white p-2 rounded-full text-slate-400 shadow-sm hover:bg-slate-50"><ArrowLeft size={18}/></button>
               <button onClick={createClass} className="bg-lemon text-orange-600 px-3 py-2 rounded-2xl font-bold shadow-pop flex items-center gap-1 text-sm transition-transform hover:-translate-y-1 active:translate-y-0"><Plus size={16} /> เพิ่มห้อง</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeSubject.classes.map(cls => (
                <div key={cls.id} onClick={() => goToGrading(cls.id)} className="bg-white p-4 rounded-3xl shadow-soft border-4 border-white cursor-pointer hover:border-lemon transition-all hover:-translate-y-1 relative overflow-hidden group">
                  <div className="absolute -right-2 -top-2 w-12 h-12 bg-lemon rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
                  <h3 className="text-xl font-black text-slate-700 relative z-10">ห้อง {cls.name}</h3>
                  <p className="text-slate-400 font-bold text-xs relative z-10">{cls.students.length} คน</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'grading' && activeClass && activeSubject && (
          <div>
            <button onClick={() => goToClassList(activeSubject.id)} className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-2 hover:text-peach transition-colors w-fit"><ArrowLeft size={14}/> ย้อนกลับ</button>
            <StudentList students={activeClass.students} onUpdateStudents={updateStudentsInClass} classTitle={activeClass.name} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
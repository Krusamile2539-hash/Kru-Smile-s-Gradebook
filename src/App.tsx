import React, { useState, useMemo, useEffect } from 'react';
import { Smile, ArrowRight, Folder, ChevronRight, Plus, LayoutGrid, ArrowLeft, Eye, EyeOff, Loader2, FileSpreadsheet, Link as LinkIcon, HelpCircle, PlayCircle, CloudUpload, CheckCircle2, Copy, X, BookOpen } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import StudentList from './components/StudentList';
import StatsCard from './components/StatsCard';
import { Subject, Student } from './types';
import { masterStudentDB } from './data/students';

type ViewState = 'dashboard' | 'class-list' | 'grading';

const GOOGLE_SCRIPT_CODE = `
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
  const action = e.parameter.action;
  const key = e.parameter.key;
  
  if (action === 'read') {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == key) {
        return ContentService.createTextOutput(data[i][1]).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify(null)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
  const params = JSON.parse(e.postData.contents);
  const key = params.key;
  const jsonData = JSON.stringify(params.data);
  const timestamp = new Date();

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == key) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    sheet.appendRow([key, jsonData, timestamp]);
  } else {
    sheet.getRange(rowIndex, 2).setValue(jsonData);
    sheet.getRange(rowIndex, 3).setValue(timestamp);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}
`;

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [storedAuth, setStoredAuth] = useLocalStorage('kru_auth_config', { password: '', scriptUrl: '' });
  const [passwordInput, setPasswordInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    if (storedAuth.password) setPasswordInput(storedAuth.password);
    if (storedAuth.scriptUrl) setUrlInput(storedAuth.scriptUrl);
  }, [storedAuth]);
  
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

  const { 
    data: subjects, 
    saveData: setSubjects, 
    loadData: fetchFromSheet, 
    loading: isSheetLoading, 
    error: sheetError,
    isSaving
  } = useGoogleSheets<Subject[]>(
    isDemoMode ? '' : storedAuth.scriptUrl, 
    isDemoMode ? '' : storedAuth.password, 
    getInitialData()
  );
  
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const activeSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const activeClass = useMemo(() => activeSubject?.classes.find(c => c.id === selectedClassId), [activeSubject, selectedClassId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 4) return alert("รหัสผ่านสั้นเกินไปครับ");
    if (!urlInput.includes("script.google.com")) return alert("ลิงก์ Google Script ไม่ถูกต้องครับ");

    setStoredAuth({ password: passwordInput, scriptUrl: urlInput });
    setIsDemoMode(false);
    setTimeout(async () => {
        await fetchFromSheet();
        setIsLoggedIn(true);
    }, 100);
  };

  const handleDemoMode = () => {
    setIsDemoMode(true);
    setIsLoggedIn(true);
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    alert('คัดลอกโค้ดเรียบร้อย!');
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
        <div className="bg-white p-6 md:p-8 rounded-bubble shadow-soft border-4 border-white max-w-lg w-full relative z-10 text-center">
          <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-pop animate-bounce">
            <FileSpreadsheet size={32} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-700 mb-2">เชื่อมต่อ Google Sheets</h1>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                 <label className="text-xs font-bold text-slate-500 ml-2 mb-1 block">Web App URL</label>
                 <input 
                  type="text"
                  placeholder="https://script.google.com/..."
                  className="w-full text-sm font-bold p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-200 outline-none"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 ml-2 mb-1 block">รหัสส่วนตัว (Key)</label>
                <div className="relative">
                    <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="ตั้งรหัสเองได้เลย (เช่น MyGrade)"
                    className="w-full text-lg font-bold p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-200 outline-none"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    disabled={isSheetLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
              </div>
              {sheetError && <p className="text-rose font-bold animate-bounce text-sm text-center">{sheetError}</p>}
              <button 
                type="submit" 
                disabled={isSheetLoading || !passwordInput || !urlInput}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-3xl shadow-pop hover:translate-y-[-2px] hover:shadow-pop-hover transition-all flex items-center justify-center gap-2"
              >
                {isSheetLoading ? <Loader2 className="animate-spin" /> : <>เชื่อมต่อ <ArrowRight size={20} strokeWidth={3} /></>}
              </button>
              <div className="flex gap-2">
                 <button type="button" onClick={() => setShowSetupModal(true)} className="flex-1 py-3 bg-slate-50 text-slate-500 font-bold rounded-3xl border-2 border-slate-100 hover:bg-white text-sm">วิธีติดตั้ง</button>
                 <button type="button" onClick={handleDemoMode} className="flex-1 py-3 bg-slate-50 text-orange-400 font-bold rounded-3xl border-2 border-slate-100 hover:bg-white text-sm">ทดลองเล่น</button>
              </div>
            </form>
        </div>
        {showSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-3xl shadow-soft max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border-4 border-white">
                <div className="p-5 bg-green-500 flex justify-between items-center text-white">
                   <h3 className="font-bold text-lg">วิธีติดตั้ง Google Sheets</h3>
                   <button onClick={() => setShowSetupModal(false)}><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-50 space-y-4">
                   <p className="text-sm">1. สร้าง Sheet ใหม่ที่ <b>sheets.new</b></p>
                   <p className="text-sm">2. ไปที่ <b>Extensions > Apps Script</b></p>
                   <div className="relative">
                     <pre className="bg-slate-800 text-green-300 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-48">{GOOGLE_SCRIPT_CODE}</pre>
                     <button onClick={handleCopyCode} className="absolute top-2 right-2 bg-white/10 text-white p-2 rounded-lg text-xs font-bold"><Copy size={14}/> Copy</button>
                   </div>
                   <p className="text-sm">3. กด <b>Deploy > New deployment</b> เลือก <b>Web App</b>, Execute as: <b>Me</b>, Who has access: <b>Anyone</b></p>
                </div>
             </div>
          </div>
        )}
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
                        <CloudUpload size={10} className="text-sky-500"/>
                        <span className="text-[10px] font-bold text-sky-600">Saving...</span>
                      </div>
                   ) : (
                       !isDemoMode && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 rounded-full border border-green-200">Online</span>
                   )}
                </div>
              </div>
            </div>
            <button onClick={() => window.location.reload()} className="bg-rose/10 text-rose p-2 rounded-full font-bold hover:bg-rose hover:text-white transition"><ArrowRight size={16} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-2 md:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold text-xs md:text-lg overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide px-1">
          <button onClick={goHome} className={`${currentView === 'dashboard' ? 'text-peach underline' : ''}`}>Dashboard</button>
          {activeSubject && <><ChevronRight size={14} /><button onClick={() => goToClassList(activeSubject.id)} className={`${currentView === 'class-list' ? 'text-peach underline' : ''}`}>{activeSubject.name}</button></>}
          {activeClass && <><ChevronRight size={14} /><span className="text-peach underline">ห้อง {activeClass.name}</span></>}
        </div>

        <StatsCard totalStudents={stats.total} averageGPA={stats.avgGPA} highestTotal={stats.highestTotal} />

        {currentView === 'dashboard' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-2xl font-bold text-slate-700 flex items-center gap-2"><LayoutGrid size={20}/> รายวิชา</h2>
              <button onClick={createSubject} className="bg-mint text-teal-800 px-3 py-2 rounded-2xl font-bold shadow-pop flex items-center gap-1 text-sm"><Plus size={16} /> สร้างวิชา</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {subjects.map(sub => (
                <div key={sub.id} onClick={() => goToClassList(sub.id)} className="bg-white p-5 rounded-bubble shadow-soft border-4 border-white active:scale-95 transition-all">
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
               <button onClick={goHome} className="bg-white p-2 rounded-full text-slate-400 shadow-sm"><ArrowLeft size={18}/></button>
               <button onClick={createClass} className="bg-lemon text-orange-600 px-3 py-2 rounded-2xl font-bold shadow-pop flex items-center gap-1 text-sm"><Plus size={16} /> เพิ่มห้อง</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeSubject.classes.map(cls => (
                <div key={cls.id} onClick={() => goToGrading(cls.id)} className="bg-white p-4 rounded-3xl shadow-soft border-4 border-white active:scale-95 transition-all relative overflow-hidden">
                  <div className="absolute -right-2 -top-2 w-12 h-12 bg-lemon rounded-full opacity-50"></div>
                  <h3 className="text-xl font-black text-slate-700 relative z-10">ห้อง {cls.name}</h3>
                  <p className="text-slate-400 font-bold text-xs relative z-10">{cls.students.length} คน</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'grading' && activeClass && activeSubject && (
          <div>
            <button onClick={() => goToClassList(activeSubject.id)} className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-2"><ArrowLeft size={14}/> ย้อนกลับ</button>
            <StudentList students={activeClass.students} onUpdateStudents={updateStudentsInClass} classTitle={activeClass.name} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
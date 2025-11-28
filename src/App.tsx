import React, { useState, useMemo, useEffect } from 'react';
import { Smile, ArrowRight, Folder, ChevronRight, Plus, LayoutGrid, ArrowLeft, Eye, EyeOff, Loader2, FileSpreadsheet, Link as LinkIcon, HelpCircle, PlayCircle, UploadCloud, CheckCircle2, Copy, X, BookOpen, Menu } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import StudentList from './components/StudentList';
import StatsCard from './components/StatsCard';
import { Subject, Student } from './types';
import { masterStudentDB } from './data/students';

type ViewState = 'dashboard' | 'class-list' | 'grading';

const GOOGLE_SCRIPT_CODE = `
function doGet(e) {
  // 1. Setup Sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
  
  // 2. Handle Read
  const action = e.parameter.action;
  const key = e.parameter.key;
  
  if (action === 'read') {
    const data = sheet.getDataRange().getValues();
    // Loop to find key in Column A
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == key) {
        return ContentService.createTextOutput(data[i][1]).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify(null)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // 1. Setup Sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
  
  // 2. Parse Data
  const params = JSON.parse(e.postData.contents);
  const key = params.key;
  const jsonData = JSON.stringify(params.data);
  const timestamp = new Date();

  // 3. Find Row or Append
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == key) {
      rowIndex = i + 1; // 1-based index
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
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Store Auth Creds locally so user doesn't type URL every time
  const [storedAuth, setStoredAuth] = useLocalStorage('kru_auth_config', { password: '', scriptUrl: '' });
  
  const [passwordInput, setPasswordInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Initialize inputs from storage
  useEffect(() => {
    if (storedAuth.password) setPasswordInput(storedAuth.password);
    if (storedAuth.scriptUrl) setUrlInput(storedAuth.scriptUrl);
  }, [storedAuth]);
  
  // --- Initial Data Factory ---
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
            createClassFromDB('3/7', '3/7'),
         ]
       },
       {
         id: 'subj-2',
         name: 'รัฐศาสตร์เบื้องต้น',
         code: '',
         classes: [
            createClassFromDB('6/3', '6/3'),
            createClassFromDB('6/5', '6/5'),
         ]
       },
       {
         id: 'subj-3',
         name: 'สังคม 6',
         code: 'ส33102',
         classes: [
            createClassFromDB('6/1', '6/1'),
            createClassFromDB('6/3', '6/3'),
            createClassFromDB('6/5', '6/5'),
            createClassFromDB('6/6', '6/6'),
         ]
       }
     ];
  };

  // --- Data State (Google Sheets Sync) ---
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
  
  // --- Navigation State ---
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // --- Computed Navigation Helpers ---
  const activeSubject = useMemo(() => 
    subjects.find(s => s.id === selectedSubjectId), 
    [subjects, selectedSubjectId]
  );
  
  const activeClass = useMemo(() => 
    activeSubject?.classes.find(c => c.id === selectedClassId), 
    [activeSubject, selectedClassId]
  );

  // --- Actions ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 4) {
      alert("รหัสผ่านสั้นเกินไปครับ (ต้อง 4 ตัวขึ้นไป)");
      return;
    }
    if (!urlInput.includes("script.google.com")) {
      alert("ลิงก์ Google Script ไม่ถูกต้องครับ");
      return;
    }

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
    const code = prompt('รหัสวิชา (เช่น ค31101):') || '';
    
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name,
      code,
      classes: []
    };
    setSubjects([...subjects, newSubject]);
  };

  const createClass = () => {
    if (!selectedSubjectId) return;
    const name = prompt('ชื่อห้องเรียน (เช่น 3/1):');
    if (!name) return;

    const newSubjects = subjects.map(sub => {
      if (sub.id === selectedSubjectId) {
        return {
          ...sub,
          classes: [...sub.classes, { id: crypto.randomUUID(), name, students: [] }]
        };
      }
      return sub;
    });
    setSubjects(newSubjects);
  };

  const updateStudentsInClass = (updatedStudents: Student[]) => {
    if (!selectedSubjectId || !selectedClassId) return;

    const newSubjects = subjects.map(sub => {
      if (sub.id === selectedSubjectId) {
        return {
          ...sub,
          classes: sub.classes.map(cls => {
            if (cls.id === selectedClassId) {
              return { ...cls, students: updatedStudents };
            }
            return cls;
          })
        };
      }
      return sub;
    });
    setSubjects(newSubjects);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    alert('คัดลอกโค้ดเรียบร้อย! นำไปวางใน Apps Script ได้เลยครับ');
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

  // --- Stats Calculation for StatsCard ---
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
        const mid = (s.midterm.c1||0)+(s.midterm.c2||0)+(s.midterm.c3||0)+(s.midterm.exam||0);
        const fin = (s.final.c1||0)+(s.final.c2||0)+(s.final.c3||0)+(s.final.exam||0);
        const total = mid + fin;
        if(total > maxScore) maxScore = total;
        sumGPA += calcG(total);
        studentCountForGPA++;
      });
    };

    if (currentView === 'grading' && activeClass) {
      processStudents(activeClass.students);
    } else if (currentView === 'class-list' && activeSubject) {
      activeSubject.classes.forEach(c => processStudents(c.students));
    } else {
      subjects.forEach(s => s.classes.forEach(c => processStudents(c.students)));
    }

    return {
      total: totalStudents,
      avgGPA: studentCountForGPA ? sumGPA / studentCountForGPA : 0,
      highestTotal: maxScore
    };
  }, [subjects, currentView, activeClass, activeSubject]);


  // --- Render: Login / Google Sheet Setup Screen ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Simplified Auth UI */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-peach/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-mint/30 rounded-full blur-xl animate-pulse delay-700"></div>

        <div className="bg-white p-6 md:p-8 rounded-bubble shadow-soft border-4 border-white max-w-lg w-full relative z-10 text-center">
          
          <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-pop animate-bounce">
            <FileSpreadsheet size={32} />
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-700 mb-2">
            เชื่อมต่อ Google Sheets
          </h1>
          <p className="text-slate-400 mb-6 font-bold text-xs md:text-sm">
             ข้อมูลอยู่บน Google Sheet ของคุณเอง 100%
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
              
              <div>
                 <label className="text-xs font-bold text-slate-500 ml-2 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><LinkIcon size={12}/> Web App URL</span>
                    <button type="button" onClick={() => setShowSetupModal(true)} className="text-peach flex items-center gap-1 hover:underline">
                      <HelpCircle size={12}/> หา URL ยังไง?
                    </button>
                 </label>
                 <input 
                  type="text"
                  placeholder="https://script.google.com/..."
                  className="w-full text-sm font-bold p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none text-slate-600 transition-all"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 ml-2 mb-1">รหัสส่วนตัว (Key)</label>
                <div className="relative">
                    <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="ตั้งรหัสเองได้เลย (เช่น MyGrade2024)"
                    className="w-full text-lg font-bold p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none text-slate-600 transition-all"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    disabled={isSheetLoading}
                    />
                    <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-green-500 transition"
                    >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
              </div>

              {sheetError && <p className="text-rose font-bold animate-bounce text-sm text-center">{sheetError}</p>}
              
              <button 
                type="submit" 
                disabled={isSheetLoading || !passwordInput || !urlInput}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-3xl shadow-pop hover:translate-y-[-2px] hover:shadow-pop-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
              >
                {isSheetLoading ? <Loader2 className="animate-spin" /> : <>เชื่อมต่อฐานข้อมูล <ArrowRight size={20} strokeWidth={3} /></>}
              </button>

              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold">หรือ</span>
                  <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="w-full py-3 bg-slate-50 text-slate-500 font-bold rounded-3xl border-2 border-slate-100 hover:bg-white hover:border-peach hover:text-peach transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <BookOpen size={16}/> วิธีติดตั้ง
                </button>
                <button 
                  type="button"
                  onClick={handleDemoMode}
                  className="w-full py-3 bg-slate-50 text-slate-500 font-bold rounded-3xl border-2 border-slate-100 hover:bg-white hover:border-orange-300 hover:text-orange-400 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <PlayCircle size={16}/> ทดลองเล่น
                </button>
              </div>
            </form>
        </div>
        
        {/* Setup Modal */}
        {showSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-3xl shadow-soft max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border-4 border-white">
                <div className="p-5 bg-green-500 flex justify-between items-center text-white">
                   <h3 className="font-bold text-lg flex items-center gap-2"><FileSpreadsheet/> วิธีติดตั้ง Google Sheets</h3>
                   <button onClick={() => setShowSetupModal(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-50 space-y-4">
                   <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
                      <p className="font-bold text-slate-800">1. สร้าง Sheet</p>
                      <p>ไปที่ <code className="bg-slate-200 px-1 rounded">sheets.new</code> สร้างไฟล์ใหม่ แล้วไปที่ <code className="bg-slate-200 px-1 rounded">Extensions</code> &gt; <code className="bg-slate-200 px-1 rounded">Apps Script</code></p>
                      
                      <p className="font-bold text-slate-800 mt-4">2. วางโค้ด</p>
                      <div className="relative">
                        <pre className="bg-slate-800 text-green-300 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-48 border-2 border-slate-700">
                          {GOOGLE_SCRIPT_CODE}
                        </pre>
                        <button onClick={handleCopyCode} className="absolute top-2 right-2 bg-white/10 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm flex items-center gap-1 text-xs font-bold transition">
                           <Copy size={14}/> Copy Code
                        </button>
                      </div>

                      <p className="font-bold text-slate-800 mt-4">3. Deploy</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-xs md:text-sm">
                         <li>กด <b>Deploy</b> (มุมขวาบน) &gt; <b>New deployment</b></li>
                         <li>เลือกประเภทเป็น <b>Web App</b></li>
                         <li>Execute as: <b>Me</b></li>
                         <li>Who has access: <b className="text-rose-500 bg-rose-100 px-1">Anyone (ทุกคน)</b></li>
                         <li>กด Deploy แล้ว Copy URL มาใส่ในแอป</li>
                      </ul>
                   </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-white">
                   <button onClick={() => setShowSetupModal(false)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200">
                      ปิดหน้าต่าง
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- Render: Main App ---
  return (
    <div className="min-h-screen pb-20 overflow-x-hidden bg-cream font-sans">
      
      {/* Top Bar - Mobile Optimized */}
      <nav className="pt-2 md:pt-4 pb-2 mb-2 sticky top-0 z-50 px-2 md:px-3">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-full border-2 md:border-4 border-white shadow-soft px-3 py-2 md:px-8 md:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={goHome}>
              <div className="bg-peach p-2 md:p-3 rounded-full shadow-pop border-2 border-white">
                <Smile className="text-white h-5 w-5 md:h-8 md:w-8" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="font-black text-lg md:text-3xl text-slate-700 tracking-tight leading-none">
                  Kru Smile<span className="text-peach">'</span>s
                </h1>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-slate-400 hidden md:block">Gradebook & Analytics</span>
                   
                   {/* Saving Indicator */}
                   {isSaving ? (
                      <div className="flex items-center gap-1 bg-sky/10 px-2 py-0.5 rounded-full border border-sky/20 animate-pulse">
                        <UploadCloud size={10} className="text-sky-500"/>
                        <span className="text-[10px] font-bold text-sky-600">กำลังบันทึก</span>
                      </div>
                   ) : (
                       !isDemoMode && (
                        <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                            <CheckCircle2 size={10} className="text-green-600"/>
                            <span className="text-[10px] font-bold text-green-600 hidden md:inline">ล่าสุด</span>
                        </div>
                       )
                   )}
                </div>
              </div>
            </div>
            <button onClick={() => window.location.reload()} className="bg-rose/10 text-rose p-2 md:px-4 md:py-2 rounded-full md:rounded-2xl font-bold shadow-sm text-xs md:text-sm hover:bg-rose hover:text-white transition flex items-center gap-1">
               <span className="hidden md:inline">Logout</span> <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-2 md:px-6 lg:px-8 py-2">
        
        {/* Breadcrumbs - Horizontal Scroll for Mobile */}
        <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold text-xs md:text-lg overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide px-1">
          <button onClick={goHome} className={`hover:text-peach transition flex-shrink-0 ${currentView === 'dashboard' ? 'text-peach underline decoration-wavy' : ''}`}>
            Dashboard
          </button>
          {activeSubject && (
            <>
              <ChevronRight size={14} className="flex-shrink-0" />
              <button onClick={() => goToClassList(activeSubject.id)} className={`hover:text-peach transition flex-shrink-0 ${currentView === 'class-list' ? 'text-peach underline decoration-wavy' : ''}`}>
                {activeSubject.name}
              </button>
            </>
          )}
          {activeClass && (
             <>
              <ChevronRight size={14} className="flex-shrink-0" />
              <span className="text-peach underline decoration-wavy flex-shrink-0">ห้อง {activeClass.name}</span>
            </>
          )}
        </div>

        {/* Dynamic Stats */}
        <StatsCard totalStudents={stats.total} averageGPA={stats.avgGPA} highestTotal={stats.highestTotal} />

        {/* VIEW 1: DASHBOARD (SUBJECTS) */}
        {currentView === 'dashboard' && (
          <div>
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-slate-700 flex items-center gap-2"><LayoutGrid size={20} className="md:w-6 md:h-6"/> รายวิชา</h2>
              <button onClick={createSubject} className="bg-mint text-teal-800 px-3 py-2 md:px-5 rounded-2xl font-bold shadow-pop hover:-translate-y-1 transition flex items-center gap-1 md:gap-2 text-sm md:text-base active:translate-y-0">
                <Plus size={18} /> <span className="hidden md:inline">สร้างวิชาใหม่</span><span className="md:hidden">เพิ่ม</span>
              </button>
            </div>
            
            {subjects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-4 border-slate-100 border-dashed">
                <p className="text-slate-400 font-bold text-xl">ยังไม่มีวิชาเลยครับครู!</p>
                <button onClick={createSubject} className="mt-4 text-peach underline font-bold">สร้างวิชาแรกกันเถอะ</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {subjects.map(sub => (
                  <div key={sub.id} onClick={() => goToClassList(sub.id)} className="bg-white p-5 md:p-6 rounded-bubble shadow-soft border-4 border-white hover:border-peach cursor-pointer transition-all hover:-translate-y-1 group">
                    <div className="flex items-start justify-between">
                       <div className="w-12 h-12 bg-sky/20 rounded-2xl flex items-center justify-center text-sky-600 mb-4">
                         <Folder size={24} />
                       </div>
                       <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-lg">{sub.classes.length} ห้อง</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-700">{sub.name}</h3>
                    <p className="text-slate-400 font-bold text-xs md:text-sm mb-2">{sub.code || 'ไม่มีรหัส'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CLASS LIST */}
        {currentView === 'class-list' && activeSubject && (
          <div>
            <div className="flex justify-between items-center mb-4 md:mb-6">
               <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={goHome} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 text-slate-400"><ArrowLeft size={18}/></button>
                  <h2 className="text-lg md:text-2xl font-bold text-slate-700 truncate max-w-[200px] md:max-w-none">ห้องเรียน {activeSubject.name}</h2>
               </div>
              <button onClick={createClass} className="bg-lemon text-orange-600 px-3 py-2 md:px-5 rounded-2xl font-bold shadow-pop hover:-translate-y-1 transition flex items-center gap-1 md:gap-2 text-sm md:text-base active:translate-y-0">
                <Plus size={18} /> <span className="hidden md:inline">เพิ่มห้องเรียน</span><span className="md:hidden">เพิ่ม</span>
              </button>
            </div>

            {activeSubject.classes.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl border-4 border-slate-100 border-dashed">
                <p className="text-slate-400 font-bold text-xl">วิชานี้ยังไม่มีห้องเรียนครับ</p>
                <button onClick={createClass} className="mt-4 text-orange-400 underline font-bold">สร้างห้องแรกเลย</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {activeSubject.classes.map(cls => (
                  <div key={cls.id} onClick={() => goToGrading(cls.id)} className="bg-white p-5 md:p-6 rounded-3xl shadow-soft border-4 border-white hover:border-lemon cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 md:w-20 md:h-20 bg-lemon rounded-full opacity-50"></div>
                    <div className="relative z-10 flex items-center gap-4">
                       <div className="w-12 h-12 md:w-14 md:h-14 bg-lemon rounded-full flex items-center justify-center text-orange-500 font-black text-lg md:text-xl shadow-sm border-2 border-white flex-shrink-0">
                         {cls.name.split('/')[0]}
                       </div>
                       <div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-700">ห้อง {cls.name}</h3>
                          <p className="text-slate-400 font-bold text-xs md:text-sm">{cls.students.length} นักเรียน</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: GRADING TABLE */}
        {currentView === 'grading' && activeClass && activeSubject && (
          <div>
            <div className="mb-2 md:mb-4">
               <button onClick={() => goToClassList(activeSubject.id)} className="flex items-center gap-2 text-slate-400 hover:text-peach font-bold text-xs md:text-sm mb-2 transition bg-white/50 px-3 py-1 rounded-full w-fit">
                 <ArrowLeft size={14}/> กลับไปหน้าห้องเรียน
               </button>
            </div>
            <StudentList 
              students={activeClass.students} 
              onUpdateStudents={updateStudentsInClass}
              classTitle={activeClass.name}
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
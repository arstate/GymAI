
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import WeeklyCheckin from './components/WeeklyCheckin';
import CustomDialog from './components/CustomDialog';
import { UserProfile, FitnessPlan, DailyRoutine, AppView, WeeklyFeedback } from './types';
import { generateFitnessPlan, regenerateCheapDietPlan } from './services/geminiService';
import { Key, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'fitgenius_data_v3';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Fix: All declarations of 'aistudio' must have identical modifiers. Removing readonly to allow merging.
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView | 'KEY_SETUP'>('ONBOARDING');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<DailyRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegeneratingDiet, setIsRegeneratingDiet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    const initializeApp = async () => {
      // Cek apakah API_KEY ada di environment (Vercel)
      const envKey = process.env.API_KEY;
      
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.userProfile && parsed.fitnessPlan) {
            setUserProfile(parsed.userProfile);
            setFitnessPlan(parsed.fitnessPlan);
            
            // Jika tidak ada key di env, cek apakah ada key di selection sistem
            if (!envKey) {
              const keySelected = await window.aistudio.hasSelectedApiKey();
              if (!keySelected) {
                setView('KEY_SETUP');
                return;
              }
            }
            setView('DASHBOARD');
            return;
          }
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Alur untuk user baru
      if (!envKey) {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        if (!keySelected) {
          setView('KEY_SETUP');
        } else {
          setView('ONBOARDING');
        }
      } else {
        setView('ONBOARDING');
      }
    };

    initializeApp();
  }, []);

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    if (userProfile && fitnessPlan) setView('DASHBOARD');
    else setView('ONBOARDING');
  };

  const openAlert = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => setDialog(d => ({ ...d, isOpen: false })),
    });
  };

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setDialog(d => ({ ...d, isOpen: false }));
      },
    });
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateFitnessPlan(profile, 1);
      setUserProfile(profile);
      setFitnessPlan(plan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile: profile, fitnessPlan: plan }));
      setView('DASHBOARD');
    } catch (err: any) {
      // Fix: Handle "Requested entity was not found" error by prompting for API key selection
      if (err.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else if (err.message === "API_KEY_MISSING") {
        setView('KEY_SETUP');
      } else {
        const msg = err.message || "Gagal menghasilkan rencana.";
        setError(msg);
        openAlert("Gagal Menghubungkan AI", "Environment Variable API_KEY mungkin tidak valid atau belum diredeploy di Vercel.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fix: Added missing handleWeeklyFeedback function to process end-of-week updates
  const handleWeeklyFeedback = async (feedback: WeeklyFeedback) => {
    if (!userProfile) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const nextWeek = feedback.weekCompleted + 1;
      const updatedProfile = { ...userProfile, weight: feedback.currentWeight };
      setUserProfile(updatedProfile);
      
      const plan = await generateFitnessPlan(updatedProfile, nextWeek, feedback);
      setFitnessPlan(plan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile: updatedProfile, fitnessPlan: plan }));
      setView('DASHBOARD');
      openAlert("Berhasil!", `Rencana untuk Minggu ${nextWeek} telah siap.`);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        const msg = err.message || "Gagal membuat rencana minggu baru.";
        setError(msg);
        openAlert("Gagal", "Terjadi kesalahan saat membuat rencana baru.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'KEY_SETUP') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
          <Key className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Setup API Key</h1>
        <p className="text-gray-500 max-w-sm mb-8">
          Kami tidak mendeteksi API Key di environment Vercel Anda.
        </p>
        
        <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl mb-8 flex items-start gap-3 text-left max-w-md">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <div className="text-xs text-orange-800 space-y-2">
            <p className="font-bold">Cara Memperbaiki via Vercel:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Masuk ke Vercel Dashboard {">"} Project Settings.</li>
              <li>Pilih menu <b>Environment Variables</b>.</li>
              <li>Tambah <b>Key:</b> <code className="bg-orange-200 px-1 px-1">API_KEY</code></li>
              <li>Klik <b>Add</b> dan lakukan <b>Redeploy</b> proyek Anda.</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-sm gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-xl"
          >
            Sudah Setting? Refresh Aplikasi
          </button>
          
          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Atau Gunakan Cara Cepat</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <button 
            onClick={handleSelectKey}
            className="w-full py-3 bg-white text-primary-600 border border-primary-100 rounded-2xl font-bold hover:bg-primary-50 transition"
          >
            Pilih API Key Manual
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50">
      <CustomDialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog(d => ({ ...d, isOpen: false }))}
      />

      {view === 'ONBOARDING' && (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-black text-primary-600 tracking-tight">FitGenius ID</h1>
            <p className="text-gray-400 font-medium">Personal AI Fitness Coach</p>
          </div>
          <Onboarding onComplete={handleOnboardingComplete} isLoading={isLoading} />
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-2xl text-center text-xs font-bold border border-red-100 max-w-lg mx-auto">
              {error}
              <p className="mt-1 font-normal opacity-70 italic">Cek Vercel Logs untuk detail lebih lanjut.</p>
            </div>
          )}
        </div>
      )}

      {view === 'DASHBOARD' && userProfile && fitnessPlan && (
        <Dashboard 
          plan={fitnessPlan} 
          user={userProfile} 
          onStartWorkout={(r) => { setActiveRoutine(r); setView('WORKOUT_SESSION'); }}
          onReset={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
          onFinishWeek={() => setView('WEEKLY_CHECKIN')}
          onRegenerateDiet={async () => {
             setIsRegeneratingDiet(true);
             try {
               const diet = await regenerateCheapDietPlan(userProfile);
               const newPlan = { ...fitnessPlan, diet };
               setFitnessPlan(newPlan);
               localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile, fitnessPlan: newPlan }));
             } catch(err: any) { 
               if (err.message?.includes("Requested entity was not found")) {
                 await window.aistudio.openSelectKey();
               } else {
                 openAlert("Gagal", "Gagal membuat menu baru."); 
               }
             }
             finally { setIsRegeneratingDiet(false); }
          }}
          isRegeneratingDiet={isRegeneratingDiet}
          installPrompt={null}
          onInstallApp={() => {}}
        />
      )}

      {view === 'WEEKLY_CHECKIN' && fitnessPlan && (
        <WeeklyCheckin 
          weekCompleted={fitnessPlan.weekNumber}
          onSubmit={handleWeeklyFeedback}
          isLoading={isLoading}
        />
      )}

      {view === 'WORKOUT_SESSION' && activeRoutine && (
        <WorkoutSession 
          routine={activeRoutine} 
          onExit={() => setView('DASHBOARD')}
          onComplete={() => {
            const updated = fitnessPlan!.routines.map(r => r.dayNumber === activeRoutine.dayNumber ? { ...r, isCompleted: true } : r);
            const newPlan = { ...fitnessPlan!, routines: updated };
            setFitnessPlan(newPlan);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile, fitnessPlan: newPlan }));
            setView('DASHBOARD');
          }}
        />
      )}
    </div>
  );
};

export default App;

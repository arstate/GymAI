
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import WeeklyCheckin from './components/WeeklyCheckin';
import CustomDialog from './components/CustomDialog';
import { UserProfile, FitnessPlan, DailyRoutine, AppView, WeeklyFeedback } from './types';
import { generateFitnessPlan, regenerateCheapDietPlan } from './services/geminiService';
import { Layers, AlertTriangle, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'fitgenius_data_v3';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Fixed: Removed readonly modifier to match existing global definitions and avoid TS error
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView | 'KEY_SETUP' | 'LOADING'>('LOADING');
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
      // 1. Cek apakah ada API_KEY di environment (Vercel)
      // Simplified check for environment API key
      const hasEnvKeys = !!process.env.API_KEY;

      // 2. Load data lokal
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.userProfile && parsed.fitnessPlan) {
            setUserProfile(parsed.userProfile);
            setFitnessPlan(parsed.fitnessPlan);
            
            // Jika ada kunci di env, langsung ke Dashboard
            if (hasEnvKeys) {
              setView('DASHBOARD');
              return;
            }

            // Jika tidak ada di env, cek apakah user sudah pilih key secara manual sebelumnya
            const keySelected = await window.aistudio.hasSelectedApiKey();
            if (keySelected) {
              setView('DASHBOARD');
            } else {
              setView('KEY_SETUP');
            }
            return;
          }
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // 3. Jika data baru
      if (hasEnvKeys) {
        setView('ONBOARDING');
      } else {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        if (keySelected) {
          setView('ONBOARDING');
        } else {
          setView('KEY_SETUP');
        }
      }
    };

    initializeApp();
  }, []);

  const handleSelectKey = async () => {
    // API Key Selection: Initiate the selection dialog
    await window.aistudio.openSelectKey();
    // API Key Selection: Assume success and proceed to the app to avoid race conditions
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
      const msg = err.message || "Gagal menghasilkan rencana.";
      setError(msg);
      // Reset key selection if entity not found error occurs as per guidelines
      if (msg.includes("Requested entity was not found")) {
         setView('KEY_SETUP');
      }
      openAlert("Gagal Menghubungkan AI", `Terjadi kesalahan: ${msg}. Periksa API Key Anda.`);
    } finally {
      setIsLoading(false);
    }
  };

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
      const msg = err.message || "Gagal membuat rencana minggu baru.";
      setError(msg);
      openAlert("Gagal", `Sistem AI error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (view === 'KEY_SETUP') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
          <Layers className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Konfigurasi API Key</h1>
        <p className="text-gray-500 max-w-sm mb-4">
          Silakan pilih API Key untuk melanjutkan. Aplikasi ini memerlukan akses ke Gemini API.
        </p>
        
        {/* API Key Selection: Provided link to billing documentation */}
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary-600 text-sm font-bold flex items-center gap-1 mb-8 hover:underline"
        >
          Pelajari tentang penagihan API Key <ExternalLink className="w-4 h-4" />
        </a>
        
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl mb-8 flex items-start gap-3 text-left max-w-md">
          <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div className="text-xs text-blue-800 space-y-2">
            <p className="font-bold">Informasi Penting:</p>
            <p>Anda harus menggunakan API Key dari proyek GCP yang sudah mengaktifkan penagihan (Paid Project).</p>
          </div>
        </div>

        <button 
          onClick={handleSelectKey}
          className="w-full max-w-sm py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-xl shadow-primary-100"
        >
          Pilih API Key (Google AI Studio)
        </button>
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
              Error: {error}
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
               openAlert("Gagal", `Gagal memperbarui menu: ${err.message}`); 
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

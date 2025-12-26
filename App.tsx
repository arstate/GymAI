
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import WeeklyCheckin from './components/WeeklyCheckin';
import CustomDialog from './components/CustomDialog';
import { UserProfile, FitnessPlan, DailyRoutine, AppView, WeeklyFeedback } from './types';
import { generateFitnessPlan, regenerateCheapDietPlan } from './services/geminiService';
import { Key, ShieldCheck, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'fitgenius_data_v3';

// Deklarasi Global untuk API Studio sesuai dengan standar lingkungan
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * The aistudio object provided by the environment.
     * Must be declared as readonly to match system modifiers.
     */
    readonly aistudio: AIStudio;
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
      try {
        // 1. Cek apakah key sudah terpilih di sistem
        const keySelected = await window.aistudio.hasSelectedApiKey();
        
        // 2. Muat data dari storage
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.userProfile && parsed.fitnessPlan) {
              setUserProfile(parsed.userProfile);
              setFitnessPlan(parsed.fitnessPlan);
              // Jika data ada tapi key belum ada, minta setup key
              if (!keySelected) setView('KEY_SETUP');
              else setView('DASHBOARD');
            }
          } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
          }
        } else if (!keySelected) {
          // Jika user baru dan belum ada key
          setView('KEY_SETUP');
        }
      } catch (err) {
        // Default to onboarding/setup if something fails
        setView('ONBOARDING');
      }
    };

    initializeApp();
  }, []);

  // Handle trigger untuk membuka dialog pemilihan API Key
  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Mengatasi race condition: asumsikan pemilihan berhasil setelah dialog ditutup
      if (userProfile && fitnessPlan) setView('DASHBOARD');
      else setView('ONBOARDING');
    } catch (err) {
      console.error("Gagal membuka pemilihan kunci:", err);
    }
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
      // Penanganan error API Key sesuai guideline
      if (err.message === "API_KEY_MISSING" || (err.message && err.message.includes("Requested entity was not found."))) {
        openAlert("Aktivasi Diperlukan", "Silakan pilih API Key untuk melanjutkan.");
        setView('KEY_SETUP');
      } else {
        const msg = err.message || "Gagal menghasilkan rencana.";
        setError(msg);
        openAlert("Kesalahan API", "Gagal memanggil AI. Silakan pastikan API Key Anda aktif atau coba konfigurasi ulang.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeeklyFeedback = async (feedback: WeeklyFeedback) => {
    if (!userProfile || !fitnessPlan) return;
    setIsLoading(true);
    try {
      const updatedUser = { ...userProfile, weight: feedback.currentWeight };
      const nextWeek = fitnessPlan.weekNumber + 1;
      const newPlan = await generateFitnessPlan(updatedUser, nextWeek, feedback);
      setUserProfile(updatedUser);
      setFitnessPlan(newPlan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile: updatedUser, fitnessPlan: newPlan }));
      setView('DASHBOARD');
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found.")) {
        openAlert("API Key Bermasalah", "Kunci API tidak valid. Silakan pilih kembali.");
        setView('KEY_SETUP');
      } else {
        openAlert("Gagal", "Gagal memperbarui rencana mingguan.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'KEY_SETUP') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary-50 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
          <Key className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Aktivasi FitGenius ID</h1>
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
          Untuk menggunakan aplikasi ini, Anda perlu memilih API Key Gemini Anda sendiri. Ini lebih aman daripada menyimpannya di environment publik.
        </p>
        
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-8 flex items-start gap-3 text-left max-w-sm">
          <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <b>Mengapa?</b> API Key yang ditaruh di Vercel/Publik sering diblokir Google karena terdeteksi "Bocor". Dengan cara ini, kunci Anda tetap aman.
          </p>
        </div>

        <button 
          onClick={handleSelectKey}
          className="w-full max-w-sm py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-xl shadow-primary-100 flex items-center justify-center gap-2 mb-4"
        >
          Konfigurasi API Key Sekarang
        </button>
        
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-gray-400 flex items-center gap-1 hover:text-primary-600"
        >
          Butuh info tentang Billing? Klik di sini <ExternalLink className="w-3 h-3" />
        </a>
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
          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-center text-xs font-bold">{error}</div>}
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
               if (err.message && err.message.includes("Requested entity was not found.")) {
                 openAlert("Sesi Berakhir", "Sesi API Key Anda berakhir. Silakan pilih kembali.");
                 setView('KEY_SETUP');
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

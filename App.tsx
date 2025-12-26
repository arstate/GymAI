import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import WeeklyCheckin from './components/WeeklyCheckin';
import CustomDialog from './components/CustomDialog';
import { UserProfile, FitnessPlan, DailyRoutine, AppView, WeeklyFeedback } from './types';
import { generateFitnessPlan, regenerateCheapDietPlan } from './services/geminiService';

const STORAGE_KEY = 'fitgenius_data_v3';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('ONBOARDING');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<DailyRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegeneratingDiet, setIsRegeneratingDiet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom Dialog State
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

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.userProfile && parsed.fitnessPlan) {
          setUserProfile(parsed.userProfile);
          setFitnessPlan(parsed.fitnessPlan);
          setView('DASHBOARD');
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

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

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => setInstallPrompt(null));
  };

  const saveToStorage = (profile: UserProfile, plan: FitnessPlan) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userProfile: profile,
      fitnessPlan: plan
    }));
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateFitnessPlan(profile, 1);
      setUserProfile(profile);
      setFitnessPlan(plan);
      saveToStorage(profile, plan);
      setView('DASHBOARD');
    } catch (err: any) {
      const msg = err.message || "Gagal menghasilkan rencana.";
      setError(msg);
      openAlert("Kesalahan API", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeeklyFeedback = async (feedback: WeeklyFeedback) => {
    if (!userProfile || !fitnessPlan) return;
    setIsLoading(true);
    try {
      const updatedUser = { ...userProfile, weight: feedback.currentWeight };
      setUserProfile(updatedUser);
      const nextWeekNumber = fitnessPlan.weekNumber + 1;
      const newPlan = await generateFitnessPlan(updatedUser, nextWeekNumber, feedback);
      setFitnessPlan(newPlan);
      saveToStorage(updatedUser, newPlan);
      setView('DASHBOARD');
    } catch (err: any) {
      openAlert("Gagal", err.message || "Tidak bisa membuat jadwal baru.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateDiet = async () => {
    if (!userProfile || !fitnessPlan) return;
    
    openConfirm(
      "Ganti Menu?", 
      "Menu makanan saat ini akan diganti dengan opsi LEBIH MURAH. Lanjut?", 
      async () => {
        setIsRegeneratingDiet(true);
        try {
          const newDiet = await regenerateCheapDietPlan(userProfile);
          const updatedPlan = { ...fitnessPlan, diet: newDiet };
          setFitnessPlan(updatedPlan);
          saveToStorage(userProfile, updatedPlan);
          openAlert("Berhasil!", "Menu makanan telah diperbarui menjadi lebih hemat.");
        } catch (err: any) {
          openAlert("Gagal", err.message || "Gagal mengganti menu.");
        } finally {
          setIsRegeneratingDiet(false);
        }
      }
    );
  };

  const handleFinishWeek = () => {
    openConfirm(
      "Selesai Minggu Ini?", 
      "Anda akan lanjut ke evaluasi mingguan. Pastikan semua latihan sudah selesai.", 
      () => setView('WEEKLY_CHECKIN')
    );
  };

  const handleReset = () => {
    openConfirm(
      "Reset Aplikasi?", 
      "Semua data profil dan progres latihan akan DIHAPUS PERMANEN.", 
      () => {
        localStorage.removeItem(STORAGE_KEY);
        setUserProfile(null);
        setFitnessPlan(null);
        setView('ONBOARDING');
      }
    );
  };

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
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-black text-primary-600 tracking-tight">FitGenius ID</h1>
            <p className="text-gray-400 font-medium">Personal AI Fitness Coach</p>
          </div>
          <Onboarding onComplete={handleOnboardingComplete} isLoading={isLoading} />
          
          {error && (
            <div className="max-w-lg mx-auto mt-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-center text-xs font-bold shadow-sm">
              ERROR: {error}
            </div>
          )}

          {installPrompt && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <button 
                onClick={handleInstallClick}
                className="bg-gray-900 text-white px-8 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 hover:scale-105 transition"
              >
                📲 Install App
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'DASHBOARD' && userProfile && fitnessPlan && (
        <Dashboard 
          plan={fitnessPlan} 
          user={userProfile} 
          onStartWorkout={(routine) => { setActiveRoutine(routine); setView('WORKOUT_SESSION'); }}
          onReset={handleReset}
          onFinishWeek={handleFinishWeek}
          onRegenerateDiet={handleRegenerateDiet}
          isRegeneratingDiet={isRegeneratingDiet}
          installPrompt={installPrompt}
          onInstallApp={handleInstallClick}
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
          onExit={() => { setActiveRoutine(null); setView('DASHBOARD'); }}
          onComplete={() => {
            const updatedRoutines = fitnessPlan!.routines.map(r => r.dayNumber === activeRoutine.dayNumber ? { ...r, isCompleted: true } : r);
            const updatedPlan = { ...fitnessPlan!, routines: updatedRoutines };
            setFitnessPlan(updatedPlan);
            saveToStorage(userProfile!, updatedPlan);
            setActiveRoutine(null);
            setView('DASHBOARD');
          }}
        />
      )}
    </div>
  );
};

export default App;
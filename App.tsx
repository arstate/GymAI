import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import WeeklyCheckin from './components/WeeklyCheckin';
import { UserProfile, FitnessPlan, DailyRoutine, AppView, WeeklyFeedback } from './types';
import { generateFitnessPlan, regenerateCheapDietPlan } from './services/geminiService';

const STORAGE_KEY = 'fitgenius_data_v2';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('ONBOARDING');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<DailyRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegeneratingDiet, setIsRegeneratingDiet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Load local storage on mount
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
        console.error("Failed to parse saved data");
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // PWA Install Listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
    });
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
      console.error("App Error:", err);
      setError(err.message || "Gagal menghasilkan rencana. Pastikan koneksi internet lancar dan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeeklyFeedback = async (feedback: WeeklyFeedback) => {
    if (!userProfile || !fitnessPlan) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Update local user weight for record keeping
      const updatedUser = { ...userProfile, weight: feedback.currentWeight };
      setUserProfile(updatedUser);

      // Generate next week's plan
      const nextWeekNumber = fitnessPlan.weekNumber + 1;
      const newPlan = await generateFitnessPlan(updatedUser, nextWeekNumber, feedback);
      
      setFitnessPlan(newPlan);
      saveToStorage(updatedUser, newPlan);
      setView('DASHBOARD');
    } catch (err: any) {
      console.error("App Error:", err);
      setError(err.message || "Gagal membuat jadwal minggu baru.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateDiet = async () => {
    if (!userProfile || !fitnessPlan) return;
    
    // Konfirmasi sebelum mengganti menu
    if (!window.confirm("Apakah Anda yakin ingin mengganti menu saat ini dengan menu yang LEBIH MURAH & MUDAH? Menu yang lama akan hilang.")) {
      return;
    }

    setIsRegeneratingDiet(true);
    setError(null);
    try {
      const newDiet = await regenerateCheapDietPlan(userProfile);
      
      if (!newDiet || newDiet.length === 0) {
        throw new Error("Gagal menerima data menu baru dari AI.");
      }

      const updatedPlan = {
        ...fitnessPlan,
        diet: newDiet
      };

      setFitnessPlan(updatedPlan);
      saveToStorage(userProfile, updatedPlan);
      alert("Berhasil! Menu makanan telah diganti dengan opsi yang lebih hemat.");
    } catch (err: any) {
      console.error("Regenerate Diet Error:", err);
      alert("Gagal mengganti menu: " + (err.message || "Terjadi kesalahan koneksi."));
    } finally {
      setIsRegeneratingDiet(false);
    }
  };

  const startWorkout = (routine: DailyRoutine) => {
    setActiveRoutine(routine);
    setView('WORKOUT_SESSION');
  };

  const handleWorkoutComplete = () => {
    if (!fitnessPlan || !activeRoutine || !userProfile) return;

    // Update the specific routine isCompleted status
    const updatedRoutines = fitnessPlan.routines.map(routine => {
      if (routine.dayNumber === activeRoutine.dayNumber) {
        return { ...routine, isCompleted: true };
      }
      return routine;
    });

    const updatedPlan = { ...fitnessPlan, routines: updatedRoutines };
    
    setFitnessPlan(updatedPlan);
    saveToStorage(userProfile, updatedPlan);
    
    setActiveRoutine(null);
    setView('DASHBOARD');
  };

  const cancelWorkout = () => {
    setActiveRoutine(null);
    setView('DASHBOARD');
  };

  const handleFinishWeek = () => {
    // NOTIFIKASI / KONFIRMASI AGAR TIDAK SALAH PENCET
    const confirmMsg = `Apakah Anda yakin sudah menyelesaikan SELURUH latihan Minggu ${fitnessPlan?.weekNumber}?\n\nAnda akan lanjut ke evaluasi mingguan dan tidak bisa kembali ke jadwal minggu ini.`;
    
    if (window.confirm(confirmMsg)) {
      setView('WEEKLY_CHECKIN');
    }
  };

  const handleReset = () => {
    if (window.confirm("PERINGATAN KERAS: Apakah Anda yakin ingin MENGHAPUS SEMUA data profil dan rencana latihan? Tindakan ini tidak bisa dibatalkan.")) {
      localStorage.removeItem(STORAGE_KEY);
      setUserProfile(null);
      setFitnessPlan(null);
      setView('ONBOARDING');
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50">
      {view === 'ONBOARDING' && (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-primary-600 mb-2">FitGenius ID</h1>
            <p className="text-gray-500">Asisten Kebugaran AI Pribadi Anda</p>
          </div>
          <Onboarding onComplete={handleOnboardingComplete} isLoading={isLoading} />
          {error && (
            <div className="max-w-lg mx-auto mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center text-sm">
              <p className="font-bold mb-1">Terjadi Kesalahan:</p>
              {error}
            </div>
          )}
          {/* Install Button for Onboarding */}
          {installPrompt && (
            <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 animate-fade-in">
              <button 
                onClick={handleInstallClick}
                className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2"
              >
                📲 Install Aplikasi
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'DASHBOARD' && userProfile && fitnessPlan && (
        <Dashboard 
          plan={fitnessPlan} 
          user={userProfile} 
          onStartWorkout={startWorkout}
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
          onExit={cancelWorkout}
          onComplete={handleWorkoutComplete}
        />
      )}
    </div>
  );
};

export default App;
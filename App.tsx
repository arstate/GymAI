
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutSession from './components/WorkoutSession';
import WeeklyCheckin from './components/WeeklyCheckin';
import CustomDialog from './components/CustomDialog';
import { UserProfile, FitnessPlan, DailyRoutine, AppView, WeeklyFeedback } from './types';
import { generateFitnessPlan, regenerateCheapDietPlan } from './services/geminiService';

const STORAGE_KEY = 'fitgenius_data_v4';

const App: React.FC = () => {
  const [view, setView] = useState<AppView | 'LOADING'>('LOADING');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<DailyRoutine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Memuat FitGenius...');
  const [isRegeneratingDiet, setIsRegeneratingDiet] = useState(false);
  
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
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setUserProfile(parsed.userProfile);
          setFitnessPlan(parsed.fitnessPlan);
          setView('DASHBOARD');
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
          setView('ONBOARDING');
        }
      } else {
        setView('ONBOARDING');
      }
    };

    initializeApp();
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

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setIsLoading(true);
    try {
      // Mengirim callback setLoadingMsg agar pengguna tahu progressnya
      const plan = await generateFitnessPlan(profile, 1, undefined, setLoadingMsg);
      setUserProfile(profile);
      setFitnessPlan(plan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile: profile, fitnessPlan: plan }));
      setView('DASHBOARD');
    } catch (err: any) {
      openAlert("Gagal Menghubungkan AI", `Terjadi kesalahan: ${err.message}.`);
    } finally {
      setIsLoading(false);
      setLoadingMsg('Memuat FitGenius...');
    }
  };

  const handleWeeklyFeedback = async (feedback: WeeklyFeedback) => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      const nextWeek = feedback.weekCompleted + 1;
      const updatedProfile = { ...userProfile, weight: feedback.currentWeight };
      setUserProfile(updatedProfile);
      
      const plan = await generateFitnessPlan(updatedProfile, nextWeek, feedback, setLoadingMsg);
      setFitnessPlan(plan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile: updatedProfile, fitnessPlan: plan }));
      setView('DASHBOARD');
      openAlert("Minggu Baru!", "Program minggu depan sudah siap dengan gambar tutorial lengkap.");
    } catch (err: any) {
      openAlert("Gagal", `Gagal memuat jadwal: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMsg('Memuat FitGenius...');
    }
  };

  if (view === 'LOADING' || (isLoading && view !== 'ONBOARDING')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent shadow-xl"></div>
        <p className="mt-8 text-gray-900 font-black text-lg tracking-tight text-center">{loadingMsg}</p>
        <p className="mt-2 text-gray-400 text-sm text-center">AI sedang menggambar ilustrasi tutorial untukmu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-[#FBFBFB]">
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-primary-600 tracking-tighter">FITGENIUS <span className="text-gray-900">ID</span></h1>
          </div>
          <Onboarding onComplete={handleOnboardingComplete} isLoading={isLoading} />
        </div>
      )}

      {view === 'DASHBOARD' && userProfile && fitnessPlan && (
        <Dashboard 
          plan={fitnessPlan} 
          user={userProfile} 
          onStartWorkout={(r) => { setActiveRoutine(r); setView('WORKOUT_SESSION'); }}
          onReset={() => { 
            if(window.confirm("Hapus semua data?")) {
              localStorage.removeItem(STORAGE_KEY); 
              window.location.reload(); 
            }
          }}
          onFinishWeek={() => setView('WEEKLY_CHECKIN')}
          onRegenerateDiet={async () => {
             setIsRegeneratingDiet(true);
             try {
               const diet = await regenerateCheapDietPlan(userProfile);
               const newPlan = { ...fitnessPlan, diet };
               setFitnessPlan(newPlan);
               localStorage.setItem(STORAGE_KEY, JSON.stringify({ userProfile, fitnessPlan: newPlan }));
             } catch(err: any) { 
               openAlert("Gagal", err.message); 
             }
             finally { setIsRegeneratingDiet(false); }
          }}
          isRegeneratingDiet={isRegeneratingDiet}
          installPrompt={null}
          onInstallApp={() => {}}
        />
      )}

      {view === 'WEEKLY_CHECKIN' && (
        <WeeklyCheckin 
          weekCompleted={fitnessPlan?.weekNumber || 1}
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
            setView('DASHBOARD');
          }}
        />
      )}
    </div>
  );
};

export default App;

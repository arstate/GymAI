
import React, { useState, useEffect } from 'react';
import { FitnessPlan, DailyRoutine, UserProfile } from '../types';
import AiAssistant from './AiAssistant';
import { Play, Utensils, Calendar, Clock, Award, Info, CheckCircle, ChevronRight, Moon, Flame, RefreshCw, DollarSign, Download, Settings, Target, MessageCircle } from 'lucide-react';

interface Props {
  plan: FitnessPlan;
  user: UserProfile;
  onStartWorkout: (routine: DailyRoutine) => void;
  onReset: () => void;
  onFinishWeek: () => void;
  onRegenerateDiet: () => void;
  isRegeneratingDiet: boolean;
  installPrompt: any;
  onInstallApp: () => void;
}

const Dashboard: React.FC<Props> = ({ 
  plan, 
  user, 
  onStartWorkout, 
  onReset, 
  onFinishWeek,
  onRegenerateDiet,
  isRegeneratingDiet,
  installPrompt,
  onInstallApp
}) => {
  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  
  // Menentukan hari default: Cari hari pertama yang isCompleted-nya false
  const getFirstIncompleteDay = () => {
    const incomplete = plan.routines.find(r => !r.isCompleted);
    return incomplete ? incomplete.dayNumber : 1;
  };

  const [selectedDay, setSelectedDay] = useState<number>(getFirstIncompleteDay());

  // Pastikan saat plan berubah atau aplikasi di-refresh, selectedDay menyesuaikan
  useEffect(() => {
    setSelectedDay(getFirstIncompleteDay());
  }, [plan]);

  const currentRoutine = plan.routines.find(r => r.dayNumber === selectedDay);
  const currentDiet = plan.diet.find(d => d.dayNumber === selectedDay);

  const completedDaysCount = plan.routines.filter(r => r.isCompleted).length;
  const progressPercent = (completedDaysCount / 7) * 100;

  const weightDiff = user.targetWeight - user.weight;
  const isWeightLoss = weightDiff < 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 animate-fade-in relative">
      {/* AI Assistant Modal */}
      {showAiAssistant && currentDiet && currentRoutine && (
        <AiAssistant 
          user={user}
          currentDiet={currentDiet}
          currentRoutine={currentRoutine}
          onClose={() => setShowAiAssistant(false)}
        />
      )}

      {/* Floating Action Button for AI - Mobile View */}
      <button 
        onClick={() => setShowAiAssistant(true)}
        className="fixed bottom-24 right-4 z-50 p-4 bg-primary-600 text-white rounded-2xl shadow-2xl md:hidden animate-bounce hover:animate-none"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Header Profile Section */}
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center text-white text-2xl md:text-3xl shadow-xl shadow-primary-100 flex-shrink-0">
             {user.gender === 'Laki-laki' ? '👨' : '👩'}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Halo, {user.name.split(' ')[0]}!</h1>
            <p className="text-gray-400 font-medium text-xs md:text-sm">Minggu {plan.weekNumber} • {user.goal}</p>
          </div>
        </div>
        
        <div className="flex gap-2 self-end md:self-auto">
          <button 
            onClick={() => setShowAiAssistant(true)}
            className="hidden md:flex items-center gap-2 px-4 py-3 bg-primary-50 text-primary-600 font-bold rounded-2xl hover:bg-primary-100 transition shadow-sm border border-primary-100"
          >
            <MessageCircle className="w-5 h-5" /> Tanya AI
          </button>
          {installPrompt && (
            <button onClick={onInstallApp} className="p-2 md:p-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition">
              <Download className="w-5 h-5" />
            </button>
          )}
          <button onClick={onReset} className="p-2 md:p-3 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-red-500 hover:border-red-100 transition shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress & Target Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-2">Progres Mingguan</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl md:text-5xl font-black text-gray-900">{completedDaysCount}</span>
              <span className="text-gray-400 font-bold text-sm md:text-lg mb-1">/ 7 Hari Selesai</span>
            </div>
            <div className="w-full bg-gray-100 h-2 md:h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="mt-4 text-xs font-bold text-primary-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Target Minggu Ini: {isWeightLoss ? '-' : '+'}{user.weeklyTargetKg}kg
            </p>
          </div>
          <Flame className="absolute -right-10 -bottom-10 w-32 h-32 md:w-48 md:h-48 text-primary-50 opacity-[0.05] transform -rotate-12" />
        </div>
        
        <div className="bg-primary-600 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-primary-200 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-bold text-[9px] uppercase tracking-widest opacity-70 mb-1">BB Sekarang</h3>
                   <p className="text-2xl md:text-3xl font-black">{user.weight}<span className="text-xs opacity-70 ml-1">kg</span></p>
                </div>
                <div className="text-right">
                   <h3 className="font-bold text-[9px] uppercase tracking-widest opacity-70 mb-1">Target BB</h3>
                   <p className="text-2xl md:text-3xl font-black text-primary-100">{user.targetWeight}<span className="text-xs opacity-70 ml-1">kg</span></p>
                </div>
             </div>
             
             <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                <div className={`p-1 rounded-lg flex-shrink-0 ${isWeightLoss ? 'bg-orange-500' : 'bg-blue-500'}`}>
                   <Target className="w-3 h-3 text-white" />
                </div>
                <span className="text-[9px] md:text-[10px] font-bold">
                   Butuh {Math.abs(weightDiff)} kg lagi untuk {isWeightLoss ? 'turun' : 'naik'}
                </span>
             </div>
           </div>

           <button 
             onClick={onFinishWeek}
             className="w-full mt-4 md:mt-6 py-2 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] md:text-xs font-bold transition flex items-center justify-center gap-2 backdrop-blur-md relative z-10"
           >
             Update BB Mingguan <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Day Selector Navigation */}
      <div className="bg-white rounded-[1.5rem] p-1.5 mb-6 md:mb-8 shadow-sm border border-gray-100 flex overflow-x-auto no-scrollbar gap-1">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const routine = plan.routines.find(r => r.dayNumber === day);
          const isDone = routine?.isCompleted;
          const isActive = selectedDay === day;
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 min-w-[60px] md:min-w-[80px] py-3 md:py-4 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className={`text-[8px] md:text-[10px] font-bold uppercase mb-1 ${isActive ? 'text-primary-100' : 'text-gray-300'}`}>HARI</span>
              <span className="text-lg md:text-xl font-black">{day}</span>
              {isDone && !isActive && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1"></div>}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-6 md:mb-8">
        <button 
          onClick={() => setActiveTab('workout')}
          className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-2xl md:rounded-3xl font-bold transition-all flex items-center justify-center gap-2 md:gap-3 border ${activeTab === 'workout' ? 'bg-white border-primary-500 text-primary-600 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          <Calendar className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm md:text-base">Latihan Fisik</span>
        </button>
        <button 
          onClick={() => setActiveTab('diet')}
          className={`flex-1 py-3 md:py-4 px-4 md:px-6 rounded-2xl md:rounded-3xl font-bold transition-all flex items-center justify-center gap-2 md:gap-3 border ${activeTab === 'diet' ? 'bg-white border-orange-500 text-orange-600 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          <Utensils className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm md:text-base">Nutrisi</span>
        </button>
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'workout' && currentRoutine && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">{currentRoutine.title}</h3>
                    <p className="text-primary-600 font-bold text-[10px] md:text-xs tracking-wide uppercase mt-1">{currentRoutine.focusArea}</p>
                  </div>
                  {!currentRoutine.isRestDay && (
                    <div className={`flex items-center text-[10px] font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full ${currentRoutine.isCompleted ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                      {currentRoutine.isCompleted ? (
                        <><CheckCircle className="w-3.5 h-3.5 mr-2" /> SELESAI</>
                      ) : (
                        <><Clock className="w-3.5 h-3.5 mr-2" /> {currentRoutine.estimatedDurationMin} MENIT</>
                      )}
                    </div>
                  )}
                </div>

                {currentRoutine.isRestDay ? (
                  <div className="text-center py-8 md:py-12 px-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <Moon className="w-8 h-8 md:w-10 md:h-10 text-indigo-400" />
                    </div>
                    <h4 className="text-lg md:text-xl font-black text-gray-900 mb-2">Waktunya Recovery</h4>
                    <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-sm">
                      Tubuh Anda membangun otot saat beristirahat. Pastikan tidur yang cukup hari ini.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 md:gap-4 mb-8">
                      {currentRoutine.exercises.map((ex, i) => (
                        <div key={i} className="group flex items-center p-3 md:p-4 bg-gray-50/50 hover:bg-white hover:shadow-md rounded-2xl transition-all border border-transparent hover:border-gray-100 w-full">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xs md:text-sm font-black mr-4 flex-shrink-0 ${currentRoutine.isCompleted ? 'bg-green-100 text-green-600' : 'bg-white text-primary-600 shadow-sm'}`}>
                            {currentRoutine.isCompleted ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-gray-900 text-sm md:text-base mb-0.5">{ex.name}</h4>
                             <p className="text-[10px] md:text-xs text-gray-400">{ex.sets} Set • {ex.reps ? `${ex.reps} Repetisi` : `${ex.durationSeconds} Detik`}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors" />
                        </div>
                      ))}
                    </div>

                    {!currentRoutine.isCompleted ? (
                      <button 
                        onClick={() => onStartWorkout(currentRoutine)}
                        className="w-full py-4 md:py-5 bg-gray-900 text-white rounded-2xl md:rounded-[1.75rem] font-black hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                      >
                        <Play className="w-5 h-5 fill-current" /> MULAI LATIHAN HARI {selectedDay}
                      </button>
                    ) : (
                      <div className="w-full py-4 md:py-5 bg-green-50 text-green-600 rounded-2xl md:rounded-[1.75rem] font-black flex items-center justify-center gap-2 border border-green-100">
                        <CheckCircle className="w-5 h-5" /> PROGRAM HARI INI TUNTAS
                      </div>
                    )}
                  </>
                )}
            </div>
          </div>
        )}

        {activeTab === 'diet' && currentDiet && (
          <div className="space-y-6 animate-slide-up">
             <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500">
                    <Flame className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Target Energi</span>
                    <div className="text-2xl md:text-3xl font-black text-gray-900">{currentDiet.totalCalories} <span className="text-xs md:text-sm text-gray-400 font-bold">kcal</span></div>
                  </div>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                  <button 
                    onClick={() => setShowAiAssistant(true)}
                    className="flex-1 md:flex-none px-4 py-3 md:py-4 bg-primary-100 text-primary-700 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black hover:bg-primary-200 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> KONSULTASI AI
                  </button>
                  <button 
                    onClick={onRegenerateDiet}
                    disabled={isRegeneratingDiet}
                    className="flex-1 md:flex-none px-4 py-3 md:py-4 bg-orange-500 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isRegeneratingDiet ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                    RE-OPTIMALKAN
                  </button>
                </div>
             </div>

             <div className="flex flex-col gap-3 md:gap-4">
               {[
                 { label: 'Sarapan', data: currentDiet.meals.breakfast, icon: '🍳' },
                 { label: 'Makan Siang', data: currentDiet.meals.lunch, icon: '🍛' },
                 { label: 'Makan Malam', data: currentDiet.meals.dinner, icon: '🥗' },
                 { label: 'Cemilan 1', data: currentDiet.meals.snack1, icon: '🍎' },
                 ...(currentDiet.meals.snack2 ? [{ label: 'Cemilan 2', data: currentDiet.meals.snack2, icon: '🥜' }] : [])
               ].map((meal, idx) => (
                 <div key={idx} className="p-5 bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2rem] hover:shadow-lg transition-all flex items-start gap-4 w-full">
                    <div className="text-2xl md:text-3xl bg-gray-50 w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                      {meal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest">{meal.label}</span>
                        <span className="text-[9px] md:text-[10px] text-gray-400 font-bold">{meal.data.time}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm md:text-base mb-1">{meal.data.menu}</h4>
                      <div className="text-[10px] md:text-xs font-medium text-gray-400">{meal.data.calories} kcal</div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal icon for TrendingDown
const TrendingDown = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { FitnessPlan, DailyRoutine, UserProfile } from '../types';
import { Play, Utensils, Calendar, Clock, Award, Info, CheckCircle, ChevronRight, Moon, Flame, RefreshCw, DollarSign, Download, Settings, Target } from 'lucide-react';

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
  
  // Logika: Cari hari pertama yang belum selesai, jika semua selesai balik ke hari 1
  const firstIncompleteDay = plan.routines.find(r => !r.isCompleted)?.dayNumber || 1;
  const [selectedDay, setSelectedDay] = useState<number>(firstIncompleteDay);

  // Pastikan saat plan berubah (misal setelah refresh/load), selectedDay terupdate ke hari yang belum selesai
  useEffect(() => {
    const incomplete = plan.routines.find(r => !r.isCompleted)?.dayNumber;
    if (incomplete) {
      setSelectedDay(incomplete);
    }
  }, [plan.weekNumber]);

  const currentRoutine = plan.routines.find(r => r.dayNumber === selectedDay);
  const currentDiet = plan.diet.find(d => d.dayNumber === selectedDay);

  const completedDaysCount = plan.routines.filter(r => r.isCompleted).length;
  const progressPercent = (completedDaysCount / 7) * 100;

  const weightDiff = user.targetWeight - user.weight;
  const isWeightLoss = weightDiff < 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 animate-fade-in">
      {/* Header Profile Section */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-primary-100">
             {user.gender === 'Laki-laki' ? '👨' : '👩'}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Halo, {user.name.split(' ')[0]}!</h1>
            <p className="text-gray-400 font-medium text-sm">Minggu {plan.weekNumber} • {user.goal}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {installPrompt && (
            <button onClick={onInstallApp} className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition">
              <Download className="w-5 h-5" />
            </button>
          )}
          <button onClick={onReset} className="p-3 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-red-500 hover:border-red-100 transition shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Progres Mingguan</h3>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-5xl font-black text-gray-900">{completedDaysCount}</span>
              <span className="text-gray-400 font-bold text-lg mb-1">/ 7 Hari Selesai</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          <Flame className="absolute -right-10 -bottom-10 w-48 h-48 text-primary-50 opacity-[0.05] transform -rotate-12" />
        </div>
        
        <div className="bg-primary-600 rounded-[2.5rem] p-8 shadow-2xl shadow-primary-200 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">BB Sekarang</h3>
                   <p className="text-3xl font-black">{user.weight}<span className="text-sm opacity-70 ml-1">kg</span></p>
                </div>
                <div className="text-right">
                   <h3 className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">Target BB</h3>
                   <p className="text-3xl font-black text-primary-100">{user.targetWeight}<span className="text-sm opacity-70 ml-1">kg</span></p>
                </div>
             </div>
             
             <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                <div className={`p-1.5 rounded-lg ${isWeightLoss ? 'bg-orange-500' : 'bg-blue-500'}`}>
                   <Target className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-bold">
                   Butuh {Math.abs(weightDiff)} kg lagi untuk {isWeightLoss ? 'turun' : 'naik'}
                </span>
             </div>
           </div>

           <button 
             onClick={onFinishWeek}
             className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 backdrop-blur-md relative z-10"
           >
             Update BB Mingguan <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Day Selector Navigation */}
      <div className="bg-white rounded-[2rem] p-2 mb-8 shadow-sm border border-gray-100 flex overflow-x-auto no-scrollbar gap-1">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const routine = plan.routines.find(r => r.dayNumber === day);
          const isDone = routine?.isCompleted;
          const isActive = selectedDay === day;
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 min-w-[70px] py-4 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase mb-1 ${isActive ? 'text-primary-100' : 'text-gray-300'}`}>HARI</span>
              <span className="text-xl font-black">{day}</span>
              {isDone && !isActive && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1"></div>}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => setActiveTab('workout')}
          className={`flex-1 py-4 px-6 rounded-3xl font-bold transition-all flex items-center justify-center gap-3 border ${activeTab === 'workout' ? 'bg-white border-primary-500 text-primary-600 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          <Calendar className="w-5 h-5" /> Latihan Fisik
        </button>
        <button 
          onClick={() => setActiveTab('diet')}
          className={`flex-1 py-4 px-6 rounded-3xl font-bold transition-all flex items-center justify-center gap-3 border ${activeTab === 'diet' ? 'bg-white border-orange-500 text-orange-600 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          <Utensils className="w-5 h-5" /> Nutrisi Harian
        </button>
      </div>

      <div className="mb-8 bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex gap-5 items-start">
        <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-indigo-900 font-black text-sm mb-1 uppercase tracking-tight">Strategi Minggu Ini</h4>
          <p className="text-indigo-800 text-sm leading-relaxed opacity-80">{plan.overview}</p>
        </div>
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'workout' && currentRoutine && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">{currentRoutine.title}</h3>
                    <p className="text-primary-600 font-bold text-sm tracking-wide uppercase mt-1">{currentRoutine.focusArea}</p>
                  </div>
                  {!currentRoutine.isRestDay && (
                    <div className={`flex items-center text-xs font-bold px-4 py-2 rounded-full ${currentRoutine.isCompleted ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                      {currentRoutine.isCompleted ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> SELESAI</>
                      ) : (
                        <><Clock className="w-4 h-4 mr-2" /> {currentRoutine.estimatedDurationMin} MENIT</>
                      )}
                    </div>
                  )}
                </div>

                {currentRoutine.isRestDay ? (
                  <div className="text-center py-12 px-6">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Moon className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">Waktunya Recovery</h4>
                    <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Tubuh Anda membangun otot saat beristirahat. Pastikan tidur yang cukup dan tetap terhidrasi dengan baik hari ini.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-10">
                      {currentRoutine.exercises.map((ex, i) => (
                        <div key={i} className="group flex items-center p-4 bg-gray-50/50 hover:bg-white hover:shadow-md rounded-3xl transition-all border border-transparent hover:border-gray-100">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black mr-4 flex-shrink-0 ${currentRoutine.isCompleted ? 'bg-green-100 text-green-600' : 'bg-white text-primary-600 shadow-sm'}`}>
                            {currentRoutine.isCompleted ? <CheckCircle className="w-5 h-5" /> : i + 1}
                          </div>
                          <div className="flex-1">
                             <h4 className="font-bold text-gray-900 text-sm">{ex.name}</h4>
                             <p className="text-xs text-gray-400 mt-0.5">{ex.sets} Set • {ex.reps ? `${ex.reps} Repetisi` : `${ex.durationSeconds} Detik`}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors" />
                        </div>
                      ))}
                    </div>

                    {!currentRoutine.isCompleted ? (
                      <button 
                        onClick={() => onStartWorkout(currentRoutine)}
                        className="w-full py-5 bg-gray-900 text-white rounded-[1.75rem] font-black hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-gray-200"
                      >
                        <Play className="w-5 h-5 fill-current" /> MULAI LATIHAN HARI {selectedDay}
                      </button>
                    ) : (
                      <div className="w-full py-5 bg-green-50 text-green-600 rounded-[1.75rem] font-black flex items-center justify-center gap-2 border border-green-100">
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
             <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500">
                    <Flame className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-black tracking-widest">Target Energi</span>
                    <div className="text-3xl font-black text-gray-900">{currentDiet.totalCalories} <span className="text-sm text-gray-400">kcal</span></div>
                  </div>
                </div>

                <button 
                  onClick={onRegenerateDiet}
                  disabled={isRegeneratingDiet}
                  className="w-full md:w-auto px-6 py-4 bg-orange-500 text-white rounded-2xl text-xs font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:opacity-50"
                >
                  {isRegeneratingDiet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                  OPTIMALKAN MENU {user.dietBudget.split(' ')[0].toUpperCase()}
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { label: 'Sarapan', data: currentDiet.meals.breakfast, icon: '🍳' },
                 { label: 'Makan Siang', data: currentDiet.meals.lunch, icon: '🍛' },
                 { label: 'Makan Malam', data: currentDiet.meals.dinner, icon: '🥗' },
                 { label: 'Cemilan 1', data: currentDiet.meals.snack1, icon: '🍎' },
                 ...(currentDiet.meals.snack2 ? [{ label: 'Cemilan 2', data: currentDiet.meals.snack2, icon: '🥜' }] : [])
               ].map((meal, idx) => (
                 <div key={idx} className="p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-lg transition-all flex items-start gap-4">
                    <div className="text-3xl bg-gray-50 w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {meal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{meal.label}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{meal.data.time}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm truncate mb-1">{meal.data.menu}</h4>
                      <div className="text-xs font-medium text-gray-400">{meal.data.calories} kcal</div>
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

export default Dashboard;

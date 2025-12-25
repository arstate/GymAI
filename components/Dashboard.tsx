import React, { useState } from 'react';
import { FitnessPlan, DailyRoutine, UserProfile } from '../types';
import { Play, Utensils, Calendar, Clock, Award, Info, CheckCircle, ChevronRight, Moon, Lock, RefreshCw, DollarSign, Download } from 'lucide-react';

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
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1-7

  const currentRoutine = plan.routines.find(r => r.dayNumber === selectedDay);
  const currentDiet = plan.diet.find(d => d.dayNumber === selectedDay);

  // Check how many days are completed
  const completedDaysCount = plan.routines.filter(r => r.isCompleted).length;
  const isWeekDone = completedDaysCount >= 3; // Basic threshold or check if day 7 is done

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Minggu Ke-{plan.weekNumber}</h1>
          <p className="text-gray-500 text-sm mt-1">Halo {user.name}, semangat berproses!</p>
        </div>
        <div className="flex flex-col items-end w-full md:w-auto">
             <div className="flex gap-2 items-center mb-1">
                {installPrompt && (
                  <button 
                    onClick={onInstallApp}
                    className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-gray-700 transition"
                  >
                    <Download className="w-3 h-3" /> Install App
                  </button>
                )}
                <div className="bg-primary-50 px-4 py-2 rounded-full text-primary-700 font-bold text-sm">
                  {user.goal}
                </div>
             </div>
             <div className="text-xs text-gray-400">Berat Awal: {user.weight}kg</div>
        </div>
      </header>

      {/* Day Selector */}
      <div className="flex overflow-x-auto pb-4 mb-4 gap-3 no-scrollbar">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const routine = plan.routines.find(r => r.dayNumber === day);
          const isDone = routine?.isCompleted;
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center transition border relative overflow-hidden ${
                selectedDay === day 
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200' 
                  : isDone 
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isDone && selectedDay !== day && (
                <div className="absolute top-1 right-1">
                  <CheckCircle className="w-3 h-3 text-green-600 fill-current opacity-50" />
                </div>
              )}
              <span className="text-xs font-medium uppercase">Hari</span>
              <span className="text-xl font-bold">{day}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
        <div className="flex">
          <Info className="h-5 w-5 text-indigo-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-bold text-indigo-700 text-sm">Fokus Minggu Ini</h3>
            <p className="text-sm text-indigo-600 mt-1">{plan.overview}</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
        <button 
          onClick={() => setActiveTab('workout')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${activeTab === 'workout' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Calendar className="w-4 h-4" /> Latihan
        </button>
        <button 
          onClick={() => setActiveTab('diet')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${activeTab === 'diet' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Utensils className="w-4 h-4" /> Makanan
        </button>
      </div>

      {activeTab === 'workout' && currentRoutine && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{currentRoutine.title}</h3>
                  <p className="text-gray-500">{currentRoutine.focusArea}</p>
                </div>
                {!currentRoutine.isRestDay && (
                  <div className={`flex items-center text-sm px-3 py-1 rounded-full ${currentRoutine.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {currentRoutine.isCompleted ? (
                      <><CheckCircle className="w-4 h-4 mr-1" /> Selesai</>
                    ) : (
                      <><Clock className="w-4 h-4 mr-1" /> {currentRoutine.estimatedDurationMin} Menit</>
                    )}
                  </div>
                )}
              </div>

              {currentRoutine.isRestDay ? (
                <div className="text-center py-8">
                  <Moon className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Hari Istirahat</h4>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Tubuh Anda perlu pemulihan untuk tumbuh lebih kuat. Lakukan peregangan ringan atau jalan santai jika Anda mau.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-8">
                  {currentRoutine.exercises.map((ex, i) => (
                    <div key={i} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0 mt-1 ${currentRoutine.isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}`}>
                        {currentRoutine.isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-semibold text-gray-800">{ex.name}</h4>
                         <p className="text-xs text-gray-500 mt-1">{ex.sets} Set x {ex.reps ? `${ex.reps} Reps` : `${ex.durationSeconds} Detik`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!currentRoutine.isRestDay && (
                currentRoutine.isCompleted ? (
                   <button 
                    disabled
                    className="w-full py-4 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 opacity-90 cursor-default"
                  >
                    <CheckCircle className="w-5 h-5" /> Latihan Selesai
                  </button>
                ) : (
                  <button 
                    onClick={() => onStartWorkout(currentRoutine)}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                  >
                    <Play className="w-5 h-5 fill-current" /> Mulai Latihan Hari {selectedDay}
                  </button>
                )
              )}
          </div>
        </div>
      )}

      {activeTab === 'diet' && currentDiet && (
        <div className="space-y-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Utensils className="w-10 h-10 text-orange-200" />
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Kalori</span>
                  <div className="text-2xl font-bold text-gray-800">{currentDiet.totalCalories} kkal</div>
                </div>
              </div>

              <button 
                onClick={onRegenerateDiet}
                disabled={isRegeneratingDiet}
                className="w-full md:w-auto px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition flex items-center justify-center gap-2"
              >
                {isRegeneratingDiet ? (
                  <>Membuat Menu Baru...</>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" /> Ganti Menu Murah & Mudah
                  </>
                )}
              </button>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             {[
               { label: 'Sarapan', data: currentDiet.meals.breakfast },
               { label: 'Makan Siang', data: currentDiet.meals.lunch },
               { label: 'Makan Malam', data: currentDiet.meals.dinner },
               { label: 'Snack', data: currentDiet.meals.snack1 },
               ...(currentDiet.meals.snack2 ? [{ label: 'Snack 2', data: currentDiet.meals.snack2 }] : [])
             ].map((meal, idx) => (
               <div key={idx} className="p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wide bg-orange-50 px-2 py-1 rounded">
                      {meal.label}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                       <Clock className="w-3.5 h-3.5 mr-1" /> {meal.data.time}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">{meal.data.menu}</h4>
                  <p className="text-xs text-gray-400">{meal.data.calories} kkal</p>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Finish Week Logic */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Pengaturan & Progres</h4>
        <div className="space-y-3">
          <button 
            onClick={onFinishWeek}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            <CheckCircle className="w-5 h-5" /> Selesaikan Minggu {plan.weekNumber} & Lanjut
          </button>
          
          <button 
            onClick={onReset}
            className="w-full py-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition"
          >
            Reset Aplikasi Total
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
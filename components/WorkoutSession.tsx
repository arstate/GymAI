import React, { useState, useEffect } from 'react';
import { DailyRoutine, Exercise } from '../types';
import { ChevronRight, Clock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface Props {
  routine: DailyRoutine;
  onExit: () => void;
  onComplete: () => void;
}

const WorkoutSession: React.FC<Props> = ({ routine, onExit, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentExercise = routine.exercises[currentIndex];

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerActive) {
      setIsTimerActive(false);
      // If resting timer ends, go to next exercise
      if (isResting) {
        setIsResting(false);
        if (currentIndex < routine.exercises.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setIsCompleted(true);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer, isResting, currentIndex, routine.exercises.length]);

  const startRest = () => {
    setIsResting(true);
    setTimer(currentExercise.restSeconds || 30);
    setIsTimerActive(true);
  };

  const skipRest = () => {
    setTimer(0); // Trigger useEffect logic
  };

  const handleExerciseComplete = () => {
    if (currentIndex === routine.exercises.length - 1) {
      setIsCompleted(true);
    } else {
      startRest();
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary-600 text-white text-center">
        <CheckCircle className="w-24 h-24 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Latihan Selesai!</h1>
        <p className="text-xl mb-8 opacity-90">Kerja bagus! Anda selangkah lebih dekat dengan tujuan Anda.</p>
        <button 
          onClick={onComplete}
          className="bg-white text-primary-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <button onClick={onExit} className="p-2 hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-medium text-sm text-gray-400">
          {currentIndex + 1} / {routine.exercises.length} Gerakan
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        {isResting ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full animate-fade-in">
            <span className="text-primary-400 font-bold tracking-widest uppercase mb-4">Istirahat</span>
            <div className="text-8xl font-bold tabular-nums mb-8">{formatTime(timer)}</div>
            <p className="text-gray-400 mb-8 text-center max-w-xs">
              Selanjutnya: <span className="text-white font-semibold block mt-1">{routine.exercises[currentIndex + 1]?.name || "Selesai"}</span>
            </p>
            <button 
              onClick={skipRest}
              className="px-8 py-3 bg-gray-800 rounded-full text-white font-medium hover:bg-gray-700"
            >
              Lewati Istirahat
            </button>
          </div>
        ) : (
          <div className="w-full max-w-lg space-y-6 animate-fade-in pb-20">
            <div className="aspect-video bg-gray-800 rounded-2xl flex items-center justify-center overflow-hidden relative">
               <img 
                 src={`https://picsum.photos/800/450?random=${currentIndex}`} 
                 alt="Exercise illustration" 
                 className="w-full h-full object-cover opacity-50"
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white drop-shadow-lg text-center px-4">{currentExercise.name}</span>
               </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <h2 className="text-2xl font-bold">{currentExercise.name}</h2>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div className="bg-gray-800 px-4 py-2 rounded-lg text-center flex-1">
                  <span className="block text-2xl font-bold text-primary-400">{currentExercise.sets}</span>
                  <span className="text-xs text-gray-500 uppercase">Set</span>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg text-center flex-1">
                  <span className="block text-2xl font-bold text-primary-400">
                    {currentExercise.reps || formatTime(currentExercise.durationSeconds || 0)}
                  </span>
                  <span className="text-xs text-gray-500 uppercase">
                    {currentExercise.reps ? 'Repetisi' : 'Durasi'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary-300">
                  <AlertCircle className="w-4 h-4" /> Cara Melakukan
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {currentExercise.description}
                </p>
              </div>

              <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-900/50 mt-4">
                 <h3 className="font-semibold mb-1 text-orange-400 text-sm">💡 Pro Tip</h3>
                 <p className="text-gray-400 text-xs">{currentExercise.tips}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      {!isResting && (
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button 
            onClick={handleExerciseComplete}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
          >
            Selesai Set/Latihan <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutSession;
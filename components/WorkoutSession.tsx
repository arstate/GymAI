import React, { useState, useEffect, useRef } from 'react';
import { DailyRoutine, Exercise } from '../types';
import { ChevronRight, Clock, AlertCircle, CheckCircle, ArrowLeft, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

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
  
  // States for duration-based exercises
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentExercise = routine.exercises[currentIndex];
  const isTimedExercise = !!(currentExercise.durationSeconds && !currentExercise.reps);

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playAlarm = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const playBeep = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.5, time + 0.05);
      gain.gain.linearRampToValueAtTime(0, time + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.5);
    };

    const now = ctx.currentTime;
    playBeep(now);
    playBeep(now + 0.6);
    playBeep(now + 1.2);
  };

  // Timer logic for REST
  useEffect(() => {
    let interval: any;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerActive) {
      setIsTimerActive(false);
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

  // Timer logic for EXERCISE
  useEffect(() => {
    let interval: any;
    if (isExerciseActive && exerciseTimer > 0) {
      interval = setInterval(() => {
        setExerciseTimer((prev) => prev - 1);
      }, 1000);
    } else if (exerciseTimer === 0 && isExerciseActive) {
      setIsExerciseActive(false);
      playAlarm();
      setTimeout(() => {
        handleExerciseComplete();
      }, 1500); // Small delay to hear the alarm
    }
    return () => clearInterval(interval);
  }, [isExerciseActive, exerciseTimer]);

  // Reset exercise timer when exercise changes
  useEffect(() => {
    if (isTimedExercise) {
      setExerciseTimer(currentExercise.durationSeconds || 0);
      setIsExerciseActive(false);
    }
  }, [currentIndex, isTimedExercise]);

  const startExerciseTimer = () => {
    initAudio();
    setIsExerciseActive(true);
  };

  const pauseExerciseTimer = () => {
    setIsExerciseActive(false);
  };

  const startRest = () => {
    setIsResting(true);
    setTimer(currentExercise.restSeconds || 30);
    setIsTimerActive(true);
  };

  const skipRest = () => {
    setTimer(0);
    setIsTimerActive(true);
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
        <div className="animate-bounce">
          <CheckCircle className="w-24 h-24 mb-6" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Latihan Selesai!</h1>
        <p className="text-xl mb-8 opacity-90">Kerja bagus! Anda selangkah lebih dekat dengan tujuan Anda.</p>
        <button 
          onClick={onComplete}
          className="bg-white text-primary-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10">
        <button onClick={onExit} className="p-2 hover:bg-gray-800 rounded-full transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Sesi Latihan</span>
          <span className="font-bold text-sm text-primary-400">
            {currentIndex + 1} / {routine.exercises.length} Gerakan
          </span>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        {isResting ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full animate-fade-in text-center">
            <div className="mb-8 relative">
              <div className="w-48 h-48 rounded-full border-4 border-primary-500/20 flex items-center justify-center">
                <div className="text-7xl font-black tabular-nums text-primary-400">{formatTime(timer)}</div>
              </div>
              <RotateCcw className="absolute -top-2 -right-2 text-gray-700 w-8 h-8 animate-spin-slow" />
            </div>
            <span className="text-primary-400 font-bold tracking-widest uppercase mb-2">Waktu Istirahat</span>
            <p className="text-gray-400 mb-8 max-w-xs">
              Tarik napas dalam... Selanjutnya: <span className="text-white font-semibold block mt-1 text-lg">{routine.exercises[currentIndex + 1]?.name || "Selesai"}</span>
            </p>
            <button 
              onClick={skipRest}
              className="px-10 py-4 bg-gray-800 rounded-2xl text-white font-bold hover:bg-gray-700 transition active:scale-95"
            >
              Lewati Istirahat
            </button>
          </div>
        ) : (
          <div className="w-full max-w-lg space-y-6 animate-fade-in pb-32">
            <div className="aspect-video bg-gray-800 rounded-3xl flex items-center justify-center overflow-hidden relative shadow-2xl border border-gray-700">
               <img 
                 src={`https://picsum.photos/800/450?fitness,workout&random=${currentIndex}`} 
                 alt="Exercise illustration" 
                 className="w-full h-full object-cover opacity-40"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
               <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-3xl font-black text-white drop-shadow-lg">{currentExercise.name}</span>
               </div>
            </div>

            {/* Timer UI for Timed Exercises */}
            {isTimedExercise && (
              <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl border border-primary-500/30 text-center shadow-lg">
                <div className={`text-8xl font-black tabular-nums mb-6 transition-colors duration-500 ${exerciseTimer <= 10 && exerciseTimer > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {formatTime(exerciseTimer)}
                </div>
                
                <div className="flex gap-4 justify-center">
                  {!isExerciseActive ? (
                    <button 
                      onClick={startExerciseTimer}
                      className="flex-1 max-w-[200px] py-4 bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-500 transition active:scale-95 shadow-lg shadow-primary-900/20"
                    >
                      <Play className="w-6 h-6 fill-current" /> {exerciseTimer === currentExercise.durationSeconds ? "Mulai Latihan" : "Lanjutkan"}
                    </button>
                  ) : (
                    <button 
                      onClick={pauseExerciseTimer}
                      className="flex-1 max-w-[200px] py-4 bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-500 transition active:scale-95 shadow-lg shadow-orange-900/20"
                    >
                      <Pause className="w-6 h-6 fill-current" /> Jeda
                    </button>
                  )}
                  <button 
                    onClick={() => setExerciseTimer(currentExercise.durationSeconds || 0)}
                    className="p-4 bg-gray-700 text-gray-300 rounded-2xl hover:bg-gray-600 transition"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </div>
                {isExerciseActive && (
                   <p className="mt-4 text-xs text-primary-400 font-bold animate-pulse flex items-center justify-center gap-2">
                     <Volume2 className="w-3 h-3" /> Alarm akan berbunyi saat selesai
                   </p>
                )}
              </div>
            )}

            <div>
              <div className="flex gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-2xl text-center flex-1 border border-gray-700/50">
                  <span className="block text-3xl font-black text-primary-400">{currentExercise.sets}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Set</span>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-2xl text-center flex-1 border border-gray-700/50">
                  <span className="block text-3xl font-black text-primary-400">
                    {currentExercise.reps || formatTime(currentExercise.durationSeconds || 0)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {currentExercise.reps ? 'Repetisi' : 'Target Waktu'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-primary-300 text-sm uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" /> Cara Melakukan
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {currentExercise.description}
                  </p>
                </div>

                <div className="bg-orange-900/10 p-5 rounded-2xl border border-orange-900/30">
                   <h3 className="font-bold mb-2 text-orange-400 text-xs uppercase tracking-wider flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                     Tips Pro
                   </h3>
                   <p className="text-gray-400 text-sm italic">"{currentExercise.tips}"</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      {!isResting && (
        <div className="fixed bottom-0 left-0 right-0 p-6 border-t border-gray-800 bg-gray-900/80 backdrop-blur-xl z-20">
          <div className="max-w-lg mx-auto">
            {!isTimedExercise ? (
              <button 
                onClick={handleExerciseComplete}
                className="w-full py-5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-primary-900/20 flex items-center justify-center gap-3 group"
              >
                Selesai Latihan <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              // For timed exercises, show "Next" only if they want to skip the timer
              <button 
                onClick={handleExerciseComplete}
                className="w-full py-4 text-gray-500 font-bold text-sm hover:text-white transition"
              >
                Lewati Timer & Lanjut
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutSession;
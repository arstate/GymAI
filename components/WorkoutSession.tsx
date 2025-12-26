
import React, { useState, useEffect, useRef } from 'react';
import { DailyRoutine, Exercise } from '../types';
import { ChevronRight, Clock, AlertCircle, CheckCircle, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';

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
  
  // Latihan dianggap berbasis TIMER jika durationSeconds ada dan > 0
  const isTimedExercise = !!(currentExercise.durationSeconds && currentExercise.durationSeconds > 0);

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
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExerciseActive, exerciseTimer]);

  // RESET TIMER SAAT GANTI LATIHAN
  useEffect(() => {
    setIsExerciseActive(false);
    if (isTimedExercise) {
      setExerciseTimer(currentExercise.durationSeconds || 0);
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
        <CheckCircle className="w-20 h-20 mb-6 animate-bounce" />
        <h1 className="text-3xl font-bold mb-4">Latihan Selesai!</h1>
        <p className="text-lg mb-8 opacity-90">Program hari ini sudah tuntas.</p>
        <button 
          onClick={onComplete}
          className="bg-white text-primary-600 px-8 py-3 rounded-full font-bold shadow-xl"
        >
          Simpan Progres
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="p-3 md:p-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10 flex-shrink-0">
        <button onClick={onExit} className="p-2 hover:bg-gray-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">GERAKAN</span>
          <span className="font-bold text-sm text-primary-400">
            {currentIndex + 1} / {routine.exercises.length}
          </span>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Content - Optimized for Landscape with Scroll */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          {isResting ? (
            <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-primary-500/20 flex items-center justify-center mb-6">
                <div className="text-5xl md:text-7xl font-black tabular-nums text-primary-400">{formatTime(timer)}</div>
              </div>
              <span className="text-primary-400 font-bold tracking-widest uppercase mb-2 text-xs">Istirahat</span>
              <p className="text-gray-400 mb-6 text-sm">
                Selanjutnya: <span className="text-white font-semibold">{routine.exercises[currentIndex + 1]?.name}</span>
              </p>
              <button 
                onClick={skipRest}
                className="px-8 py-3 bg-gray-800 rounded-2xl text-white font-bold hover:bg-gray-700 transition text-sm"
              >
                Lanjutkan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in items-start">
              {/* Media Section */}
              <div className="space-y-4">
                <div className="aspect-video bg-gray-800 rounded-2xl md:rounded-3xl flex items-center justify-center overflow-hidden relative shadow-2xl border border-gray-700">
                   <img 
                     src={`https://picsum.photos/800/450?fitness,gym&random=${currentIndex}`} 
                     alt="Workout" 
                     className="w-full h-full object-cover opacity-40"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                   <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-xl md:text-2xl font-black text-white">{currentExercise.name}</span>
                   </div>
                </div>

                {/* Exercise Controls for Timed Workout */}
                {isTimedExercise && (
                  <div className="bg-gray-800/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-primary-500/30 text-center shadow-lg">
                    <div className={`text-6xl md:text-7xl font-black tabular-nums mb-4 ${exerciseTimer <= 5 && isExerciseActive ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {formatTime(exerciseTimer)}
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      {!isExerciseActive ? (
                        <button 
                          onClick={startExerciseTimer}
                          className="flex-1 max-w-[150px] py-3 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                        >
                          <Play className="w-4 h-4 fill-current" /> {exerciseTimer === currentExercise.durationSeconds ? "Mulai" : "Lanjut"}
                        </button>
                      ) : (
                        <button 
                          onClick={pauseExerciseTimer}
                          className="flex-1 max-w-[150px] py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                        >
                          <Pause className="w-4 h-4 fill-current" /> Jeda
                        </button>
                      )}
                      <button 
                        onClick={() => setExerciseTimer(currentExercise.durationSeconds || 0)}
                        className="p-3 bg-gray-700 text-gray-300 rounded-xl"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl text-center border border-gray-700/50">
                    <span className="block text-2xl md:text-3xl font-black text-primary-400">{currentExercise.sets}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Set</span>
                  </div>
                  <div className="bg-gray-800/50 p-3 md:p-4 rounded-xl text-center border border-gray-700/50">
                    <span className="block text-2xl md:text-3xl font-black text-primary-400">
                      {currentExercise.reps || formatTime(currentExercise.durationSeconds || 0)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                      {currentExercise.reps ? 'Repetisi' : 'Target Waktu'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                  <h3 className="font-bold mb-2 flex items-center gap-2 text-primary-300 text-xs uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4" /> Instruksi
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                    {currentExercise.description}
                  </p>
                </div>

                <div className="bg-orange-900/10 p-4 rounded-xl border border-orange-900/30">
                   <p className="text-gray-400 text-xs italic">"{currentExercise.tips}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls - Fixed at Bottom */}
      {!isResting && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 border-t border-gray-800 bg-gray-900/90 backdrop-blur-xl z-20 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3">
            {!isTimedExercise ? (
              <button 
                onClick={handleExerciseComplete}
                className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3"
              >
                Gerakan Selesai <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleExerciseComplete}
                className="w-full py-3 text-gray-500 font-bold text-xs hover:text-white transition"
              >
                Lewati Timer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutSession;

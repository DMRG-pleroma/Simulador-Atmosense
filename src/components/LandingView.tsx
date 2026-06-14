import React, { useState, useEffect } from "react";
import { Sparkles, Sprout, ArrowUp, Droplet } from "lucide-react";

interface LandingViewProps {
  onStart: () => void;
}

export default function LandingView({ onStart }: LandingViewProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "Plataforma de inteligência agrometeorológica.";

  useEffect(() => {
    let currentText = "";
    let currentIndex = 0;
    
    // Pequeno atraso antes de começar a digitar
    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (currentIndex < fullText.length) {
          currentText += fullText[currentIndex];
          setDisplayedText(currentText);
          currentIndex++;
        } else {
          clearInterval(intervalId);
        }
      }, 40);
      
      return () => clearInterval(intervalId);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleStart = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onStart();
    }, 700);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-slate-200 text-slate-900 transition-transform duration-700 ease-[cubic-bezier(0.8,0,0.2,1)] overflow-y-auto sm:overflow-hidden ${isLeaving ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="min-h-full flex flex-col items-center justify-center p-3 sm:p-6">
        <div className="bg-slate-50 border-b-4 border-slate-300 shadow-2xl w-full max-w-4xl rounded-3xl sm:rounded-[2.5rem] flex flex-col items-center justify-between sm:justify-center text-center px-4 py-8 sm:px-6 md:py-16 relative overflow-hidden min-h-[90vh] sm:min-h-0">
          
          {/* Decoração sutil de fundo do card */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-60"></div>

          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="relative z-10 w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 bg-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-8 shadow-xl shadow-emerald-500/30 transform hover:-translate-y-1 transition-transform cursor-default shrink-0">
              <Sprout className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 text-white" />
            </div>
            
            <h1 className="relative z-10 text-4xl sm:text-5xl md:text-7xl font-black mb-6 sm:mb-8 tracking-tighter text-slate-900 leading-none">
              Atmo<span className="text-emerald-700">Sense</span>
            </h1>
            
            <div className="relative z-10 w-full max-w-2xl text-center space-y-4 sm:space-y-6 mb-8 sm:mb-10">
              <h2 className="text-base sm:text-xl md:text-3xl font-black text-slate-800 tracking-tight leading-snug min-h-[1.5em]">
                {displayedText}<span className="animate-pulse inline-block w-2 bg-emerald-500 h-[1em] ml-1 align-baseline rounded-sm"></span>
              </h2>
              
              <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-100 p-4 sm:p-5 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm text-left relative overflow-hidden group hover:border-emerald-200 transition-colors">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <p className="text-xs sm:text-sm md:text-lg text-slate-600 font-bold leading-relaxed sm:leading-relaxed">
                    Economize até <strong className="text-[#E2725B] font-black text-sm sm:text-base md:text-xl">100%</strong> de recursos hídricos em períodos chuvosos, utilizando o supercomputador global de previsão. Preserve até <strong className="text-emerald-700 font-black text-sm sm:text-base md:text-xl">65%</strong> na seca com algoritmos de VPD ("sede da atmosfera").
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-emerald-50 text-emerald-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      <span className="truncate">FAO-56 Integrado</span>
                    </span>
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-sky-50 text-sky-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-sky-200">
                      <Droplet className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      <span className="truncate">Rega Inteligente</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleStart}
              className="relative z-10 group flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 sm:px-8 py-3.5 sm:py-5 rounded-full font-black text-xs sm:text-sm md:text-base uppercase tracking-widest hover:bg-emerald-500 transition-all duration-300 shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1 w-full sm:w-auto"
            >
              <span>Iniciar Sistema</span>
              <div className="bg-emerald-700/50 rounded-full p-1.5 sm:p-2 group-hover:bg-white group-hover:text-emerald-600 transition-colors shrink-0">
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-1 transition-transform" />
              </div>
            </button>
          </div>

          <div className="mt-8 sm:mt-0 sm:absolute sm:bottom-6 left-0 right-0 text-center font-mono text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest px-4 w-full">
            Versão de Produção • IA Baseada em Microclima
          </div>
        </div>
      </div>
    </div>
  );
}

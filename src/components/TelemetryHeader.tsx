import { Sprout, Layers, Activity, HelpCircle, BookOpen, Settings } from "lucide-react";
import { TelemetryData, SystemOutputs } from "../types";

interface TelemetryHeaderProps {
  inputs: TelemetryData;
  outputs: SystemOutputs;
  activeTab: "scientific_logic" | "simulator" | "documentation";
  setActiveTab: (tab: "scientific_logic" | "simulator" | "documentation") => void;
  isSimulating: boolean;
}

export default function TelemetryHeader({
  inputs,
  outputs,
  activeTab,
  setActiveTab,
  isSimulating
}: TelemetryHeaderProps) {
  
  const getConnectionStatusColor = () => {
    if (inputs.cloggedValve || inputs.brokenSoilSensor) return "bg-rose-500 shadow-rose-500/50";
    if (outputs.valveState === "ABERTA") return "bg-cyan-400 shadow-cyan-400/50 animate-pulse";
    return "bg-emerald-400 shadow-emerald-400/50 animate-pulse";
  };

  return (
    <header className="w-full bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-5 md:p-6 mb-8 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background futuristic grid overlay - light mode */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
        {/* Logo and Device Status */}
        <div className="flex items-center gap-5 w-full lg:w-auto px-2">
          <div className="p-3 bg-emerald-600 rounded-2xl border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-sans">
              Atmo<span className="animate-s-pulse font-mono tracking-tight text-emerald-600">S</span><span className="text-emerald-600">ense</span>
            </h1>
            <p className="text-xs font-black text-slate-500 mt-1 tracking-widest uppercase flex items-center gap-2">
              Agricultura de Precisão Sustentável
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1 inline-block"></span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Totalmente responsivo para celulares */}
        <div className="bg-slate-100 rounded-[1.25rem] p-2 border-2 border-slate-200 flex flex-row items-center gap-2 w-full lg:w-auto shadow-inner">
          {/* Aba 1: Dashboard (Simulador e APIs) */}
          <button
            id="tab-simulator"
            onClick={() => setActiveTab("simulator")}
            className={`flex justify-center items-center gap-2 px-3 sm:px-6 py-3 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer sm:w-auto ${
              activeTab === "simulator"
                ? "flex-[2] sm:flex-none bg-slate-900 text-[#34d399] border-2 border-[#34d399] shadow-xl shadow-slate-900/50 scale-100"
                : "flex-1 sm:flex-none bg-slate-200 text-slate-800 md:hover:text-white md:hover:bg-slate-800 md:hover:scale-105 active:bg-slate-300 active:scale-95 shadow-sm"
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${activeTab === "simulator" ? "block" : "hidden sm:block"}`}>Dashboard</span>
          </button>

          {/* Aba 2: Conceito T&D (Lógica Científica) */}
          <button
            id="tab-scientific-logic"
            onClick={() => setActiveTab("scientific_logic")}
            className={`flex justify-center items-center gap-2 px-3 sm:px-5 py-3 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer sm:w-auto ${
              activeTab === "scientific_logic"
                ? "flex-[2] sm:flex-none bg-emerald-600 text-white border border-emerald-500 shadow-xl shadow-emerald-600/30 scale-100"
                : "flex-1 sm:flex-none text-slate-600 md:hover:text-emerald-700 md:hover:bg-emerald-50 md:hover:scale-105 active:bg-emerald-100 active:scale-95"
            }`}
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${activeTab === "scientific_logic" ? "block" : "hidden sm:block"}`}>Conceito</span>
          </button>

          {/* Aba 3: Arquitetura (Documentação Técnica) */}
          <button
            id="tab-documentation"
            onClick={() => setActiveTab("documentation")}
            className={`flex justify-center items-center gap-2 px-3 sm:px-5 py-3 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer sm:w-auto ${
              activeTab === "documentation"
                ? "flex-[2] sm:flex-none bg-orange-500 text-white border border-orange-400 shadow-xl shadow-orange-500/30 scale-100"
                : "flex-1 sm:flex-none text-slate-600 md:hover:text-orange-600 md:hover:bg-orange-50 md:hover:scale-105 active:bg-orange-100 active:scale-95"
            }`}
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${activeTab === "documentation" ? "block" : "hidden sm:block"}`}>Arquitetura</span>
          </button>
        </div>

      </div>
    </header>
  );
}

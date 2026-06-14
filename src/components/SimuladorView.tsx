import React, { useState } from "react";
import { createPortal } from "react-dom";
import { 
  Heart, ShieldAlert, Thermometer, Wind, Sun, Clock, 
  CheckCircle, Flame, Droplet, AlertTriangle, Compass, 
  MapPin, Layers, Sparkles, Sprout, TrendingUp, Zap, Info,
  Terminal as TerminalIcon, Filter, Trash2, Maximize2, X
} from "lucide-react";
import { TelemetryData, SystemOutputs, ScenarioResult, DailySimulationPoint, TelemetryLog } from "../types";

// Importações do Chart.js e react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line, Chart } from 'react-chartjs-2';

// Registro de elementos no Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SimuladorViewProps {
  // Dados dos sliders de campo
  inputs: TelemetryData;
  setInputs: React.Dispatch<React.SetStateAction<TelemetryData>>;
  outputs: SystemOutputs;
  triggerManualTrigger: () => void;
  addSystemLog: (msg: string, level: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "SYSTEM", category: "SENSOR" | "VALVULA" | "LOGICA" | "ENERGIA") => void;
  climatizeSensors: () => void;
  location: {
    lat: number;
    lon: number;
    city: string;
    loading: boolean;
    error: string | null;
    stationName?: string;
    isFallback?: boolean;
  };
  
  // Parâmetros do balanço hídrico FAO-56 climático
  scenarioResult: ScenarioResult | null;
  gardenArea: number;
  setGardenArea: (val: number) => void;
  soilType: string;
  setSoilType: (val: string) => void;
  cultureKey: string;
  setCultureKey: (val: string) => void;
  timerMode: "interval" | "weekday";
  setTimerMode: (val: "interval" | "weekday") => void;
  dumbInterval: number;
  setDumbInterval: (val: number) => void;
  selectedDays: number[];
  setSelectedDays: (days: number[]) => void;
  methodVal: string;
  setMethodVal: (val: string) => void;
  
  // Métricas acumuladas calculadas
  traditionalLitersAccumulated: number;
  atmoSenseLitersAccumulated: number;
  stressDaysCount: { smart: number; traditional: number };

  // Terminal Logs Props Integrado
  logs: TelemetryLog[];
  clearLogs: () => void;
}

export default function SimuladorView({
  inputs,
  setInputs,
  outputs,
  addSystemLog,
  climatizeSensors,
  location,
  scenarioResult,
  gardenArea,
  setGardenArea,
  soilType,
  setSoilType,
  cultureKey,
  setCultureKey,
  timerMode,
  setTimerMode,
  dumbInterval,
  setDumbInterval,
  selectedDays,
  setSelectedDays,
  traditionalLitersAccumulated,
  atmoSenseLitersAccumulated,
  stressDaysCount,
  logs,
  clearLogs
}: SimuladorViewProps) {

  // Filtros de log internos do terminal
  const [filterCategory, setFilterCategory] = useState<"ALL" | "SENSOR" | "VALVULA" | "LOGICA" | "ENERGIA">("ALL");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "INFO" | "SUCCESS" | "WARN" | "ERROR" | "SYSTEM">("ALL");

  // Chart expansion modals
  const [isSoilChartExpanded, setIsSoilChartExpanded] = useState(false);
  const [isWaterChartExpanded, setIsWaterChartExpanded] = useState(false);
  const [isWeatherChartExpanded, setIsWeatherChartExpanded] = useState(false);

  // Toggle dias da semana para o timer mecânico
  const toggleDumbDay = (dayIdx: number) => {
    if (selectedDays.includes(dayIdx)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayIdx));
      }
    } else {
      setSelectedDays([...selectedDays, dayIdx].sort());
    }
  };

  const weekdaysList = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 }
  ];

  // Cálculo de Porcentagem economizada
  const economyPercent = traditionalLitersAccumulated > 0 
    ? Math.round(((traditionalLitersAccumulated - atmoSenseLitersAccumulated) / traditionalLitersAccumulated) * 100) 
    : 0;

  // Clima real de 36 dias (30 passados e 6 previstos)
  const graphPoints: DailySimulationPoint[] = scenarioResult?.points || [];

  const chartLabels = graphPoints.map(pt => {
    const dObj = new Date(pt.date + "T12:00:00");
    return `${dObj.getDate()}/${dObj.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}`;
  });

  // --- CONFIGURAÇÃO GRÁFICO 1: UMIDADE DE SOLO (CHART.JS) ---
  const soilChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'AtmoSense Automático (%)',
        data: graphPoints.map(pt => pt.moistureSmart),
        borderColor: '#15803d', // emerald-700
        backgroundColor: 'rgba(21, 128, 61, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: '#15803d',
        pointHoverRadius: 6,
      },
      {
        label: 'Timer Comercial (%)',
        data: graphPoints.map(pt => pt.moistureDumb),
        borderColor: '#E2725B', // terracotta
        borderDash: [5, 4],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.2,
        borderWidth: 2,
        pointBackgroundColor: '#E2725B',
      }
    ]
  };

  const soilChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#64748b', font: { family: 'Nunito', size: 11, weight: 'bold' } }
      },
      tooltip: {
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' },
      }
    },
    scales: {
      y: {
        min: 0,
        max: 110,
        ticks: { color: '#94a3b8', font: { size: 10, family: 'JetBrains Mono' } },
        grid: { color: 'rgba(226, 232, 240, 0.8)' } // slate-200
      },
      x: {
        ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono', weight: 'bold' } },
        grid: { display: false }
      }
    }
  };

  // --- CONFIGURAÇÃO GRÁFICO 2: GASTO ACUMULADO (CHART.JS) ---
  const waterChartData: any = {
    labels: chartLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Precipitação (mm)',
        data: graphPoints.map(pt => pt.rain),
        backgroundColor: '#93c5fd', // blue-300
        yAxisID: 'y1',
        barPercentage: 0.8,
      },
      {
        type: 'line',
        label: 'Consumo AtmoSense (L)',
        data: graphPoints.map(pt => pt.cumSmartLiters),
        borderColor: '#15803d',
        backgroundColor: 'rgba(21, 128, 61, 0.08)',
        fill: true,
        tension: 0.1,
        borderWidth: 3,
        pointBackgroundColor: '#15803d',
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Consumo Timer (L)',
        data: graphPoints.map(pt => pt.cumDumbLiters),
        borderColor: '#E2725B',
        backgroundColor: 'transparent',
        tension: 0.1,
        borderWidth: 2,
        pointBackgroundColor: '#E2725B',
        yAxisID: 'y',
      }
    ]
  };

  const waterChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#64748b', font: { family: 'Nunito', size: 11, weight: 'bold' } }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Consumo Acumulado (L)',
          color: '#64748b',
          font: { size: 11, family: 'Nunito', weight: 'bold' }
        },
        ticks: { color: '#94a3b8', font: { size: 10, family: 'JetBrains Mono' } },
        grid: { color: 'rgba(226, 232, 240, 0.8)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 80,
        title: {
          display: true,
          text: 'Chuva (mm)',
          color: '#3b82f6',
          font: { size: 11, family: 'Nunito', weight: 'bold' }
        },
        ticks: { color: '#93c5fd', font: { size: 10, family: 'JetBrains Mono' } },
        grid: { drawOnChartArea: false }
      },
      x: {
        ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono', weight: 'bold' } },
        grid: { display: false }
      }
    }
  };

  // --- CONFIGURAÇÃO GRÁFICO 3: CLIMA (CHART.JS) ---
  const weatherChartData: any = {
    labels: chartLabels,
    datasets: [
      {
        type: 'line',
        label: 'Temperatura Máx (°C)',
        data: graphPoints.map(pt => pt.tempMax),
        borderColor: '#f59e0b', // amber-500
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#f59e0b',
        yAxisID: 'yTemp',
      },
      {
        type: 'bar',
        label: 'Índice UV',
        data: graphPoints.map(pt => pt.uvIndex),
        backgroundColor: 'rgba(239, 68, 68, 0.4)', // red-500
        borderColor: '#ef4444',
        borderWidth: 1,
        yAxisID: 'yUv',
        barPercentage: 0.8,
      }
    ]
  };

  const weatherChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#64748b', font: { family: 'Nunito', size: 11, weight: 'bold' } }
      }
    },
    scales: {
      yTemp: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperatura (°C)',
          color: '#f59e0b',
          font: { size: 11, family: 'Nunito', weight: 'bold' }
        },
        ticks: { color: '#94a3b8', font: { size: 10, family: 'JetBrains Mono' } },
        grid: { color: 'rgba(226, 232, 240, 0.8)' }
      },
      yUv: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 15,
        title: {
          display: true,
          text: 'UV Máx',
          color: '#ef4444',
          font: { size: 11, family: 'Nunito', weight: 'bold' }
        },
        ticks: { color: '#ef4444', font: { size: 10, family: 'JetBrains Mono' } },
        grid: { drawOnChartArea: false }
      },
      x: {
        ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono', weight: 'bold' } },
        grid: { display: false }
      }
    }
  };

  // Filtros de Logs logic
  const filteredLogs = logs.filter(log => {
    const matchesCat = filterCategory === "ALL" || log.category === filterCategory;
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    return matchesCat && matchesLevel;
  });

  const getLogColorByLevelDark = (level: TelemetryLog["level"]) => {
    switch (level) {
      case "INFO": return "text-zinc-300";
      case "SUCCESS": return "text-[#34d399]";
      case "WARN": return "text-amber-400";
      case "ERROR": return "text-[#fb7185] animate-pulse";
      case "SYSTEM": return "text-sky-400";
    }
  };

  const getBadgeStyleByLevelDark = (level: TelemetryLog["level"]) => {
    switch (level) {
      case "INFO": return "bg-zinc-800 text-zinc-400 border border-zinc-700";
      case "SUCCESS": return "bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30";
      case "WARN": return "bg-amber-400/20 text-amber-400 border border-amber-400/30";
      case "ERROR": return "bg-[#fb7185]/20 text-[#fb7185] border border-[#fb7185]/30";
      case "SYSTEM": return "bg-sky-400/20 text-sky-400 border border-sky-400/30";
    }
  };

  const getValveBadgeStyle = () => {
    if (outputs.valveState === "ABERTA") {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)] animate-pulse";
    }
    if (outputs.valveState === "BLOQUEADA") {
      return "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(248,113,113,0.15)]";
    }
    return "bg-slate-800 text-slate-400 border-slate-700";
  };

  const getVpdStatusColor = () => {
    switch (outputs.vpdStatus) {
      case "MUITO_BAIXO": return "text-cyan-400";
      case "IDEAL_PROPAGACAO": case "IDEAL_VEGETATIVO": return "text-emerald-400";
      case "ALTO": return "text-amber-400";
      case "CRITICO": return "text-rose-400";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SEÇÃO 1: SINTONIZADOR GEOGRÁFICOS DAS APIS REAIS */}
      <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl hover:-translate-y-1 transition-transform">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
          <div className="p-4 bg-emerald-100 rounded-2xl border-2 border-emerald-300 text-emerald-800 shadow-inner shrink-0 hidden sm:block">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xl:flex-row xl:items-center gap-2 sm:gap-3">
              <span className="text-sm font-black text-slate-500 font-mono uppercase tracking-widest break-words whitespace-normal leading-tight">Estação Local Sintonizada</span>
              <span className={`shrink-0 font-mono text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-md border uppercase tracking-widest leading-none shadow-sm flex items-center gap-1.5 w-max max-w-full overflow-hidden ${location.isFallback ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 animate-pulse'}`}>
                <span className={`shrink-0 w-2 h-2 rounded-full ${location.isFallback ? 'bg-amber-500' : 'bg-emerald-500'}`}></span> 
                <span className="truncate">{location.isFallback ? 'OPEN-METEO API ONLINE' : 'ENSEMBLE GFS+AIFS ONLINE'}</span>
              </span>
            </div>
            {location.loading ? (
              <div className="h-6 bg-slate-200 rounded-md w-48 mt-2 animate-pulse"></div>
            ) : (
              <div className="mt-2 flex flex-col xl:flex-row xl:items-center gap-2">
                <p className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2 break-words">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#E2725B] shrink-0" />
                  <span className="line-clamp-2">{location.city}</span>
                </p>
                <span className="text-xs sm:text-sm text-slate-500 font-mono font-bold bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 w-fit shrink-0 mt-1 xl:mt-0">({location.lat.toFixed(4)}, {location.lon.toFixed(4)})</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto border-t-2 md:border-t-0 md:border-l-2 border-slate-100 pt-5 md:pt-0 md:pl-10 justify-between">
          <div className="text-left md:text-right">
            <span className="text-xs text-slate-500 block font-mono uppercase tracking-widest font-black">BÚSSOLA AGROMETEOROLÓGICA</span>
            <span className="text-lg text-emerald-800 font-black block mt-1 font-mono tracking-tight text-right w-full">Previsão de 35 Dias</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-100 p-3 rounded-2xl border-2 border-emerald-200 shadow-sm shrink-0">
            <span className="w-4 h-4 rounded-full bg-emerald-600 animate-ping absolute ml-0.5"></span>
            <span className="w-4 h-4 rounded-full bg-emerald-600 relative z-10 m-0.5"></span>
            <span className="text-[11px] text-emerald-900 font-black font-mono tracking-widest w-max px-1">TEMPO REAL</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: PARÂMETROS BIOLÓGICOS DO SOLO & CULTURA (FAO-56) */}
      <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-5">
          <div className="p-3 bg-[#FFFAEB] border-2 border-amber-200 rounded-2xl text-amber-700">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
              Parâmetros Agronômicos Locais (FAO-56)
            </h3>
            <p className="text-sm font-bold text-slate-600 mt-1">
              Testes interativos simulados localmente usando restrições físicas de solo e plantação para a geolocalização conectada.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Campo 1: Área de Cultivo */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow transition-all">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Área da Horta</label>
              <span className="text-sm font-mono font-black text-emerald-800 bg-emerald-100/50 px-2.5 py-1 rounded-lg border border-emerald-200">{gardenArea} m²</span>
            </div>
            <div className="py-2">
              <input 
                type="range" 
                min="10" 
                max="1500" 
                step="10" 
                value={gardenArea} 
                onChange={(e) => setGardenArea(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-1 hover:h-3 transition-all"
              />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-2 block">Converte mm para litros físicos.</span>
          </div>

          {/* Campo 2: Tipo de Solo */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow transition-all">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Constituição do Solo</span>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="mt-2 w-full bg-slate-50 border-2 border-slate-200 text-sm font-medium text-slate-800 rounded-xl p-2 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="aleatorio">Aleatório (Inmet)</option>
              <option value="arenoso">Arenoso</option>
              <option value="siltoso">Franco-Siltoso</option>
              <option value="argiloso">Argiloso Pesado</option>
            </select>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-2 block">Regula a infiltração.</span>
          </div>

          {/* Campo 3: Tipo de Cultura */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow transition-all">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Cultura Alvo</span>
            <select
              value={cultureKey}
              onChange={(e) => setCultureKey(e.target.value)}
              className="mt-2 w-full bg-slate-50 border-2 border-slate-200 text-sm font-medium text-slate-800 rounded-xl p-2 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="60-80">Folhosas (Kc=1.00)</option>
              <option value="50-75">Fruto (Kc=1.05)</option>
              <option value="40-80">Frutíferas (Kc=0.85)</option>
              <option value="30-90">Relvados (Kc=0.75)</option>
              <option value="60-120">Cereais (Kc=1.20)</option>
              <option value="80-130">Banana/Cana (Kc=1.25)</option>
            </select>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-2 block">Taxa evapotranspiração Kc.</span>
          </div>

          {/* Campo 4: Temporizador Comercial */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow transition-all relative overflow-hidden">
            <div className="flex justify-between items-center mb-1 relative z-10">
              <span className="text-xs font-black text-[#E2725B] uppercase tracking-wider">Timer Mecânico</span>
              <div className="flex border-2 border-slate-200 rounded-lg bg-slate-50 p-0.5">
                <button 
                  onClick={() => setTimerMode("interval")} 
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors ${timerMode === "interval" ? "bg-red-50 text-[#E2725B]" : "text-slate-500 hover:bg-slate-50"}`}
                >Ciclo</button>
                <button 
                  onClick={() => setTimerMode("weekday")} 
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors ${timerMode === "weekday" ? "bg-red-50 text-[#E2725B]" : "text-slate-500 hover:bg-slate-50"}`}
                >Agenda</button>
              </div>
            </div>

            {timerMode === "interval" ? (
              <div className="mt-2 flex items-center justify-between gap-1 bg-slate-50 p-1.5 rounded-xl border-2 border-slate-200 relative z-10">
                <span className="text-xs font-bold text-slate-500 pl-2 uppercase">A cada</span>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={dumbInterval} 
                  onChange={(e) => setDumbInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-slate-50 border-2 border-slate-100 p-1 text-center font-mono text-sm font-black text-[#E2725B] rounded-lg outline-none focus:border-red-200"
                />
                <span className="text-xs font-bold text-slate-500 pr-2 uppercase">dias</span>
              </div>
            ) : (
              <div className="mt-2 flex gap-1 justify-between relative z-10">
                {weekdaysList.map((wd) => {
                  const isSel = selectedDays.includes(wd.value);
                  return (
                    <button
                      key={wd.value}
                      onClick={() => toggleDumbDay(wd.value)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border-2 transition-all ${
                        isSel 
                          ? "bg-red-50 border-red-200 text-[#E2725B] shadow-inner" 
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                      }`}
                    >
                      {wd.label[0]}
                    </button>
                  );
                })}
              </div>
            )}
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-2 block relative z-10">Controle passivo e rígido.</span>
          </div>
        </div>
      </div>

      {/* METRICAS DE VISÃO REAL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Economia de Água */}
        <div className="bg-emerald-600 border-2 border-emerald-400 rounded-3xl p-6 flex flex-col justify-center shadow-xl hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500 text-white">
            <Droplet className="w-16 h-16" />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs text-emerald-100 uppercase tracking-widest font-mono font-bold block">Volume Conservado</span>
              <span className="text-4xl font-black text-white mt-1 block tracking-tight">
                {Math.max(0, traditionalLitersAccumulated - atmoSenseLitersAccumulated).toLocaleString("pt-BR")} <span className="text-lg font-bold text-emerald-200 uppercase tracking-widest">Litros</span>
              </span>
            </div>
            <div className="text-right bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-sm font-black font-mono shadow-sm">
              +{economyPercent}%
            </div>
          </div>
        </div>

        {/* Estresse Evitado */}
        <div className="bg-orange-500 border-2 border-orange-400 rounded-3xl p-6 flex flex-col justify-center shadow-xl hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500 text-white">
            <Sun className="w-16 h-16" />
          </div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs text-orange-100 uppercase tracking-widest font-mono font-bold block">Dias Secos Evitados</span>
              <span className="text-4xl font-black text-white mt-1 block tracking-tight">
                {Math.max(0, stressDaysCount.traditional - stressDaysCount.smart)} <span className="text-lg font-bold text-orange-200 uppercase tracking-widest">Dias</span>
              </span>
            </div>
            <div className="text-xs text-orange-900 text-left leading-relaxed font-bold bg-orange-100 p-3 rounded-xl border-2 border-orange-200 uppercase tracking-wider shadow-sm">
              Atmo: <span className="font-black">{stressDaysCount.smart}d</span> <br />
              Comum: <span className="font-black opacity-60 line-through">{stressDaysCount.traditional}d</span>
            </div>
          </div>
        </div>

        {/* Gasto Total de Água AtmoSense */}
        <div className="bg-sky-600 border-2 border-sky-400 rounded-3xl p-6 flex flex-col justify-center shadow-xl hover:shadow-2xl hover:shadow-sky-500/40 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500 text-white">
            <Layers className="w-16 h-16" />
          </div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs text-sky-100 uppercase tracking-widest font-mono font-bold block">Gasto Inteligente</span>
              <span className="text-4xl font-black text-white mt-1 block tracking-tight">
                {atmoSenseLitersAccumulated.toLocaleString("pt-BR")} <span className="text-lg font-bold text-sky-200 uppercase tracking-widest">L</span>
              </span>
            </div>
            <div className="text-[10px] text-sky-900 text-left font-bold uppercase tracking-widest bg-sky-100 p-3 rounded-xl border-2 border-sky-200 shadow-sm">
              Comum: <br />
              <span className="text-red-600 text-sm font-black font-mono">{traditionalLitersAccumulated.toLocaleString("pt-BR")}L</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: GRÁFICOS COMPACTOS TOTALMENTE ADAPTADOS PARA CELULARES (CHART.JS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD GRÁFICO 1 */}
        <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="mb-6 flex justify-between items-start border-b-2 border-slate-100 pb-5">
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-widest font-mono flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Sprout className="shrink-0 w-8 h-8 text-emerald-700 bg-emerald-100 p-1.5 rounded-xl border-2 border-emerald-200 block" />
                <span className="leading-tight break-words whitespace-normal">Previsão de Umidade do Solo (%)</span>
              </h4>
              <p className="text-sm font-bold text-slate-600 mt-2">
                Simulado matemático de Evapotranspiração FAO-56.
              </p>
            </div>
            <button onClick={() => setIsSoilChartExpanded(true)} className="p-3 bg-slate-50 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border-2 border-slate-200 transition-colors shadow-sm cursor-pointer hover:-translate-y-1">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="h-56 sm:h-72 min-w-[600px] sm:min-w-0 w-full relative">
              {graphPoints.length > 0 ? (
                <Line data={soilChartData} options={soilChartOptions} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-emerald-600 font-mono bg-emerald-50 rounded-xl border border-emerald-100 animate-pulse">
                  Sincronizando malha atmosférica Ensemble...
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 text-xs font-black text-slate-500 text-center uppercase tracking-widest bg-slate-100 p-2 rounded-lg">
            Linha pontilhada representa o murchamento no temporizador cego.
          </div>
        </div>

        {/* CARD GRÁFICO 2 */}
        <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="mb-6 flex justify-between items-start border-b-2 border-slate-100 pb-5">
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-widest font-mono flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <TrendingUp className="shrink-0 w-8 h-8 text-[#0284c7] bg-sky-100 p-1.5 rounded-xl border-2 border-sky-200 block" />
                <span className="leading-tight break-words whitespace-normal">Consumo Irrigado vs Chuva Oficial</span>
              </h4>
              <p className="text-sm font-bold text-slate-600 mt-2">
                Acumulado comparativo L/mm evidenciando os choques termodinâmicos.
              </p>
            </div>
            <button onClick={() => setIsWaterChartExpanded(true)} className="p-3 bg-slate-50 rounded-xl text-slate-500 hover:bg-sky-50 hover:text-[#0284c7] hover:border-sky-300 border-2 border-slate-200 transition-colors shadow-sm cursor-pointer hover:-translate-y-1">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="h-64 sm:h-80 min-w-[600px] sm:min-w-0 w-full relative">
              {graphPoints.length > 0 ? (
                <Chart type="line" data={waterChartData} options={waterChartOptions} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-sky-600 font-mono bg-sky-50 rounded-xl border border-sky-100 animate-pulse">
                  Lendo dados agrometeorológicos sintonizados...
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 text-xs font-black text-slate-500 text-center uppercase tracking-widest bg-slate-100 p-2 rounded-lg">
            AtmoSense equilibra e retém a rega com base nas chuvas.
          </div>
        </div>

      </div>

      {/* CARD GRÁFICO 3: CLIMA EXTENDIDO */}
      <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl mt-6">
        <div className="mb-6 flex justify-between items-start border-b-2 border-slate-100 pb-5">
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-widest font-mono flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Sprout className="shrink-0 w-8 h-8 text-amber-700 bg-amber-100 p-1.5 rounded-xl border-2 border-amber-200 block" />
              <span className="leading-tight break-words whitespace-normal">Radiação UV e Temperatura Máxima</span>
            </h4>
            <p className="text-sm font-bold text-slate-600 mt-2">
              Índice UV Extremo bloqueia a rega para evitar escaldadura térmica pela gota de água.
            </p>
          </div>
          <button onClick={() => setIsWeatherChartExpanded(true)} className="p-3 bg-slate-50 rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 border-2 border-slate-200 transition-colors shadow-sm cursor-pointer hover:-translate-y-1">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <div className="h-64 sm:h-80 min-w-[600px] sm:min-w-0 w-full relative">
            {graphPoints.length > 0 ? (
              <Chart type="line" data={weatherChartData} options={weatherChartOptions} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-amber-600 font-mono bg-amber-50 rounded-xl border border-amber-100 animate-pulse">
                Lendo dados agrometeorológicos sintonizados...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals para os gráficos expandidos */}
      {isWeatherChartExpanded && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 transition-all" onClick={() => setIsWeatherChartExpanded(false)}>
          <div className="bg-slate-50 rounded-3xl w-full max-w-5xl p-4 md:p-8 border border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsWeatherChartExpanded(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm cursor-pointer z-10">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest pr-12">Radiação UV e Temperatura</h2>
            <div className="w-full overflow-x-auto pb-2 custom-scrollbar flex-1 min-h-0">
              <div className="h-[50vh] md:h-[60vh] min-h-[300px] min-w-[600px] sm:min-w-0 w-full relative">
                <Chart type="line" data={weatherChartData} options={weatherChartOptions} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isSoilChartExpanded && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 transition-all" onClick={() => setIsSoilChartExpanded(false)}>
          <div className="bg-slate-50 rounded-3xl w-full max-w-5xl p-4 md:p-8 border border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsSoilChartExpanded(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm cursor-pointer z-10">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest pr-12">Previsão de Umidade do Solo</h2>
            <div className="w-full overflow-x-auto pb-2 custom-scrollbar flex-1 min-h-0">
              <div className="h-[50vh] md:h-[60vh] min-h-[300px] min-w-[600px] sm:min-w-0 w-full relative">
                <Line data={soilChartData} options={soilChartOptions} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isWaterChartExpanded && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 transition-all" onClick={() => setIsWaterChartExpanded(false)}>
          <div className="bg-slate-50 rounded-3xl w-full max-w-5xl p-4 md:p-8 border border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsWaterChartExpanded(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm cursor-pointer z-10">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 uppercase tracking-widest pr-12">Consumo vs Chuva</h2>
            <div className="w-full overflow-x-auto pb-2 custom-scrollbar flex-1 min-h-0">
              <div className="h-[50vh] md:h-[60vh] min-h-[300px] min-w-[600px] sm:min-w-0 w-full relative">
                <Chart type="line" data={waterChartData} options={waterChartOptions} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SEÇÃO 5: CONSOLE DE SISTEMA (OPERAÇÕES E TELEMETRIA DA PLATAFORMA ATMOSENSE) */}
      <div className="bg-zinc-900 border-b-4 border-zinc-950 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col space-y-6 mt-12 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-[#E2725B] w-full h-1.5"></div>
        {/* Cabeçalho do Terminal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 border-b-2 border-zinc-800 pb-5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-zinc-800 rounded-xl border-2 border-zinc-700 shrink-0 w-max">
              <TerminalIcon className="text-[#34d399] w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-widest text-zinc-100 font-mono leading-tight">
                Console de Sistema
              </h2>
              <p className="text-xs sm:text-sm font-bold text-zinc-400 mt-1">Logs Operacionais do AtmoSense</p>
            </div>
          </div>

          <button
            onClick={clearLogs}
            className="shrink-0 flex justify-center items-center gap-2 px-4 py-3 sm:px-5 hover:bg-rose-500/10 border-2 border-zinc-700 hover:border-rose-500 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-400 hover:text-rose-400 transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Limpar Console</span>
          </button>
        </div>

        {/* Filtros rápidos horizontais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-800 p-4 rounded-2xl border-2 border-zinc-700 text-sm">
          {/* Categoria */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-zinc-500 shrink-0 hidden sm:block" />
            <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px] shrink-0">Categ:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="bg-zinc-900 border-2 border-zinc-700 py-2 px-2 rounded-xl text-sm text-zinc-300 font-mono font-bold outline-none focus:border-[#34d399] transition-colors shadow-inner flex-1 min-w-0 cursor-pointer w-full text-ellipsis"
            >
              <option value="ALL">Todas</option>
              <option value="SENSOR">Sensores</option>
              <option value="VALVULA">Eletroválvula</option>
              <option value="LOGICA">Sintonizador</option>
              <option value="ENERGIA">Solar/Energia</option>
            </select>
          </div>

          {/* Nível de Criticidade */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px] shrink-0">Nível:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="bg-zinc-900 border-2 border-zinc-700 py-2 px-2 rounded-xl text-sm text-zinc-300 font-mono font-bold outline-none focus:border-[#34d399] transition-colors shadow-inner flex-1 min-w-0 cursor-pointer w-full text-ellipsis"
            >
              <option value="ALL">Qualquer Nível</option>
              <option value="INFO">Informação (Info)</option>
              <option value="SUCCESS">Sucesso (Success)</option>
              <option value="WARN">Avisos (Warn)</option>
              <option value="ERROR">Erros (Error)</option>
              <option value="SYSTEM">Sistema (System)</option>
            </select>
          </div>
        </div>

        {/* Frame do Console Terminal */}
        <div className="flex-1 min-h-[300px] max-h-[450px] overflow-y-auto custom-scrollbar-dark bg-zinc-950 rounded-2xl border-2 border-zinc-800 p-5 font-mono text-xs leading-relaxed select-text shadow-inner">
          <div className="space-y-2">
            <div className="text-zinc-600 border-b-2 border-zinc-800 pb-3 mb-3 font-bold uppercase tracking-wider text-[10px]">
              AtmoSense Engine Console [v2.4.120] - Inicializado.
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-16 font-bold flex flex-col items-center">
                <TerminalIcon className="w-10 h-10 mb-4 text-zinc-700" />
                Nenhum frame retornado nesta seletiva.
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-1.5 border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <span className="text-zinc-500 select-none font-bold">[{log.timestamp}]</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${getBadgeStyleByLevelDark(log.level)}`}>
                    {log.category}
                  </span>
                  <span className={`${getLogColorByLevelDark(log.level)} break-all flex-1 font-medium`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-600 font-mono font-bold mt-4 pt-4 border-t-2 border-zinc-800">
          <span>Sistema Ativo</span>
          <span>Buffer: {logs.length}/500 eventos em fila</span>
        </div>

      </div>

    </div>
  );
}

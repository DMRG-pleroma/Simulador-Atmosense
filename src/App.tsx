import { useState, useEffect, useRef } from "react";
import { 
  runAtmoSenseLogic, 
  calculateDewPoint, 
  calculateVPD, 
  calculateET0,
  runFaoScenarioSimulation 
} from "./utils";
import { TelemetryData, SystemOutputs, TelemetryLog, ScenarioResult } from "./types";
import TelemetryHeader from "./components/TelemetryHeader";
import ScientificLogicView from "./components/ScientificLogicView";
import SimuladorView from "./components/SimuladorView";
import DocumentacaoView from "./components/DocumentacaoView";
import LandingView from "./components/LandingView";
import { HelpCircle, Sparkles, Sprout, ShieldAlert, CheckCircle, Lightbulb, X } from "lucide-react";

interface LocationState {
  lat: number;
  lon: number;
  city: string;
  loading: boolean;
  error: string | null;
  stationName?: string;
  isFallback?: boolean;
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<"scientific_logic" | "simulator" | "documentation">("simulator");
  const [dismissedFallback, setDismissedFallback] = useState(false);
  const [dismissedTip, setDismissedTip] = useState(false);

  // 1. Estado Central de Geolocalização e Meteorologia do Usuário
  const [location, setLocation] = useState<LocationState>({
    lat: -23.5505,
    lon: -46.6333,
    city: "São Paulo (Cidade de Referência)",
    loading: true,
    error: null
  });

  // Configurações Agronômicas Avançadas da Fazenda (FAO-56)
  const [gardenArea, setGardenArea] = useState<number>(250); // m²
  const [soilType, setSoilType] = useState<string>("arenoso"); // arenoso, siltoso, argiloso
  const [cultureKey, setCultureKey] = useState<string>("80-130"); // hortaliça de fruto, folhosa, etc
  const [timerMode, setTimerMode] = useState<"interval" | "weekday">("interval");
  const [dumbInterval, setDumbInterval] = useState<number>(7); // irrigar a cada X dias
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Segunda, quarta, sexta
  const [methodVal, setMethodVal] = useState<string>("2-6"); // tipo de bocal de aspersão (vazão)

  const [apiWeatherData, setApiWeatherData] = useState<any>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);

  // 2. Estado Central dos Sensores de Campo (Inputs)
  const [inputs, setInputs] = useState<TelemetryData>({
    soilMoisture: 48,
    airTemperature: 24,
    relativeHumidity: 62,
    uvIndex: 3,
    timeOfDay: "14:30",
    brokenSoilSensor: false,
    cloggedValve: false
  });

  // 3. Estado das decisões do ESP32 (Outputs)
  const [outputs, setOutputs] = useState<SystemOutputs>(() => runAtmoSenseLogic(inputs));

  // 4. Buffer de logs de telemetria do sistema
  const [logs, setLogs] = useState<TelemetryLog[]>([]);

  // 5. Métricas de Impacto Acumulado dinâmicas e sem placeholders (calculadas a partir do clima real)
  const [traditionalLiters, setTraditionalLiters] = useState(48200);   // Gasto sem inteligência
  const [atmoSenseLiters, setAtmoSenseLiters] = useState(22680);       // Gasto inteligente AtmoSense
  const [stressDays, setStressDays] = useState({ smart: 0, traditional: 8 });

  // Guarda a última leitura climática para evitar logs infinitos redundantes ao mover slider
  const lastLoggedInputs = useRef<string>("");

  // Handler para adicionar log manualmente do sistema
  const addSystemLog = (
    message: string, 
    level: TelemetryLog["level"] = "INFO", 
    category: TelemetryLog["category"] = "LOGICA"
  ) => {
    const timestamp = inputs.timeOfDay;
    const newLog: TelemetryLog = {
      id: Math.random().toString(36).substring(2, 7).toUpperCase(),
      timestamp,
      message,
      level,
      category
    };
    setLogs(prev => [newLog, ...prev].slice(0, 500)); // Limita o console a 500 logs para performance
  };

  // Efeito 1: Busca Geolocalização e Meteorologia Real ao montar o App
  useEffect(() => {
    let isMounted = true;
    
    // Lógica INMET:
    // Geolocalização -> Estação INMET mais próxima -> Dados históricos (30 dias) + 5 adiante -> site
    const fetchWeather = async (lat: number, lon: number, cityName: string) => {
      try {
        // 1. Solicitamos ECMWF (Físico), GFS e AIFS (Inteligência Artificial) simultaneamente
        const models = "ecmwf_ifs04,gfs_seamless,ecmwf_aifs025";
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum,et0_fao_evapotranspiration,uv_index_max&past_days=30&forecast_days=6&timezone=America%2FSao_Paulo&models=${models}`;
    
        const response = await fetch(apiUrl);
    
        if (!response.ok) {
          throw new Error(`Erro na API Meteorológica: Status ${response.status}`);
        }
    
        const rawData = await response.json();
    
        // 2. Função Auxiliar de Consenso: Tira a média dos modelos para cada dia, ignorando falhas
        const calculateConsensus = (keyBase: string) => {
          const arrEcmwf = rawData.daily[`${keyBase}_ecmwf_ifs04`] || [];
          const arrGfs = rawData.daily[`${keyBase}_gfs_seamless`] || [];
          const arrAifs = rawData.daily[`${keyBase}_ecmwf_aifs025`] || [];
          
          return rawData.daily.time.map((_: any, index: number) => {
            let sum = 0;
            let count = 0;
    
            if (arrEcmwf[index] !== null && arrEcmwf[index] !== undefined) { sum += arrEcmwf[index]; count++; }
            if (arrGfs[index] !== null && arrGfs[index] !== undefined) { sum += arrGfs[index]; count++; }
            if (arrAifs[index] !== null && arrAifs[index] !== undefined) { sum += arrAifs[index]; count++; }
    
            return count > 0 ? Number((sum / count).toFixed(2)) : 0;
          });
        };
    
        // 3. Monta o "Supermodelo"
        const consensusData = {
          daily: {
            time: rawData.daily.time,
            temperature_2m_max: calculateConsensus("temperature_2m_max"),
            precipitation_sum: calculateConsensus("precipitation_sum"),
            et0_fao_evapotranspiration: calculateConsensus("et0_fao_evapotranspiration"),
            uv_index_max: calculateConsensus("uv_index_max")
          }
        };
    
        if (isMounted) {
          setApiWeatherData(consensusData);
          setLocation({
            lat,
            lon,
            city: cityName,
            loading: false,
            error: null,
            stationName: "Ensemble Multi-Modelo",
            isFallback: false
          });
          
          addSystemLog(`Mapeamento de Consenso Atmosférico (Ensemble) estabelecido para ${cityName} fundindo GFS e IA (AIFS).`, "SUCCESS", "LOGICA");
        }
      } catch (e) {
        console.error("Erro na integração do Ensemble Climático:", e);
        const errorMessage = e instanceof Error ? e.message : "Desconhecido";
        
        addSystemLog(`Falha na captação de Ensemble Climático: ${errorMessage}. Aplicando Fallback de Segurança de Software.`, "ERROR", "LOGICA");
        
        const mockTimes: string[] = [];
        const mockTemp: number[] = [];
        const mockRain: number[] = [];
        const mockEt0: number[] = [];
        const mockUv: number[] = [];
        
        let loopDate = new Date();
        loopDate.setDate(loopDate.getDate() - 30);
        
        for (let i = 0; i < 35; i++) {
          const dateStr = loopDate.toISOString().split("T")[0];
          mockTimes.push(dateStr);
          mockTemp.push(Math.round((24 + Math.sin(i / 5) * 5 + Math.random() * 2) * 10) / 10);
          mockRain.push(Math.random() > 0.85 ? Math.round(Math.random() * 12 * 10) / 10 : 0);
          mockEt0.push(Math.round((3.0 + Math.sin(i / 10) * 1) * 10) / 10);
          mockUv.push(Math.random() > 0.5 ? 6 : 3);
          loopDate.setDate(loopDate.getDate() + 1);
        }

        if (isMounted) {
          setApiWeatherData({
            daily: {
              time: mockTimes,
              temperature_2m_max: mockTemp,
              precipitation_sum: mockRain,
              et0_fao_evapotranspiration: mockEt0,
              uv_index_max: mockUv
            }
          });
          setLocation({
            lat,
            lon,
            city: `${cityName} (Modo de Contingência)`,
            loading: false,
            error: "Instabilidade nas APIs meteorológicas."
          });
        }
      }
    };

    const getIpLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const d = await res.json();
        if (d && d.latitude && d.longitude) {
          const name = d.city ? `${d.city}, ${d.region_code || d.country_name}` : "Sua Região (IP)";
          fetchWeather(d.latitude, d.longitude, name);
        } else {
          throw new Error("Dados de IP indisponíveis");
        }
      } catch (err) {
        fetchWeather(-24.9578, -53.4549, "Cascavel, PR (Pólo do Agronegócio)");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, "Sua Região (GPS)");
        },
        (err) => {
          getIpLocation();
        },
        { timeout: 7000 }
      );
    } else {
      getIpLocation();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Efeito 2: Executa re-simulação e atualiza métricas sempre que dados meteorológicos ou configurações agrícolas mudarem
  useEffect(() => {
    if (apiWeatherData) {
      const simPoints = runFaoScenarioSimulation(
        apiWeatherData,
        gardenArea,
        soilType,
        cultureKey,
        timerMode,
        dumbInterval,
        selectedDays,
        methodVal
      );
      setScenarioResult(simPoints);
      setTraditionalLiters(simPoints.totalDumbLiters);
      setAtmoSenseLiters(simPoints.totalSmartLiters);
      setStressDays({ smart: simPoints.smartStressDays, traditional: simPoints.dumbStressDays });
    }
  }, [apiWeatherData, gardenArea, soilType, cultureKey, timerMode, dumbInterval, selectedDays, methodVal]);

  // Efeito 3: Sincronização e recálculo reativo do simulador de firmware instantâneo
  useEffect(() => {
    const nextOutputs = runAtmoSenseLogic(inputs);
    
    // Identifica se alguma variável física crucial ou emergência transitou de estado para acionamentos
    const inputsString = `${inputs.brokenSoilSensor}_${inputs.cloggedValve}_${nextOutputs.valveState}_${nextOutputs.uvLockActive}_${nextOutputs.fungalLockActive}`;
    
    if (inputsString !== lastLoggedInputs.current) {
      if (nextOutputs.uvLockActive && !outputs.uvLockActive) {
        addSystemLog(`Mecanismos AtmoSense: Bloqueio contra escaldadura foliar ativado devido à UV excessiva (${inputs.uvIndex}).`, "WARN", "LOGICA");
      }
      if (nextOutputs.fungalLockActive && !outputs.fungalLockActive) {
        addSystemLog(`Mecanismos AtmoSense: Bloqueio anti-fungo instaurado pela proximidade crítica ao Ponto de Orvalho.`, "WARN", "LOGICA");
      }
      if (inputs.brokenSoilSensor && !lastLoggedInputs.current.includes("true_")) {
        addSystemLog(`Contingência (Hardware): Perda de conectividade com sonda de terra, instanciando sensor virtual preditivo.`, "ERROR", "SENSOR");
      }
      if (inputs.cloggedValve && !lastLoggedInputs.current.includes("_true_")) {
        addSystemLog(`Falha Crítica (Acionador): Cavitação ou entupimento reportado pelo horímetro secundário, válvula selada preventivamente.`, "ERROR", "VALVULA");
      }
      lastLoggedInputs.current = inputsString;
    }

    // Se a válvula acabou de rodar simulada, incrementa os consumos em tempo real ao vivo!
    if (nextOutputs.valveState === "ABERTA") {
      // Incrementa 4L por ciclo virtual para dar feedback dinâmico visual na horta
      setAtmoSenseLiters(prev => prev + 4);
    }

    // O timer rígido tradicional gasta de forma incondicional nos horários programados (ex: 08:00 ou 20:00)
    const [h, m] = inputs.timeOfDay.split(":").map(Number);
    if ((h === 8 && m === 0) || (h === 20 && m === 0)) {
      setTraditionalLiters(prev => prev + Math.round(gardenArea * 0.45)); // Volume proporcional à área 
      addSystemLog(
        `⏱ ALAVANCA TRADICIONAL DISPARADA: Timer cíclico injetador de ${Math.round(gardenArea * 0.45)} litros sem telemetria ambiental em tempo real.`,
        "WARN",
        "VALVULA"
      );
    }

    setOutputs(nextOutputs);
  }, [inputs]);

  // Função para climatizar os sliders com o clima real de "Hoje" da cidade do usuário obtida pela API!
  const climatizeSensors = () => {
    if (apiWeatherData && apiWeatherData.daily) {
      const daily = apiWeatherData.daily;
      const todayIndex = 30; // Índices: 0-29 histórico, 30 representa "hoje" real
      
      const tempToday = daily.temperature_2m_max[todayIndex] || 24;
      const uvToday = daily.uv_index_max[todayIndex] || 4;
      const rainToday = daily.precipitation_sum[todayIndex] || 0;
      
      // Mapeia valores meteorológicos de forma lógica e física coerente
      const moistureEst = rainToday > 8 ? 88 : rainToday > 1 ? 65 : 45;
      const humidityEst = rainToday > 0 ? 85 : 55;

      setInputs(prev => ({
        ...prev,
        airTemperature: Math.round(tempToday),
        uvIndex: Math.round(uvToday),
        soilMoisture: moistureEst,
        relativeHumidity: humidityEst
      }));
      
      addSystemLog(
        `CLIMATIZAÇÃO: Sensores analíticos sintonizados com o dia atual em ${location.city}: Temp ${tempToday}°C, UV: ${uvToday}, Chover: ${rainToday}mm.`,
        "SUCCESS",
        "SENSOR"
      );
    } else {
      // Valores médios agrobiológicos padrão de São Paulo
      setInputs(prev => ({
        ...prev,
        airTemperature: 24,
        uvIndex: 4,
        soilMoisture: 48,
        relativeHumidity: 60
      }));
      addSystemLog(
        "Aviso climático: Dados INMET em trânsito. Sliders calibrados para o clima padrão local.",
        "WARN",
        "SENSOR"
      );
    }
  };

  // Função para limpar histórico de logs
  const clearLogs = () => {
    setLogs([]);
    addSystemLog("Consoles de buffers liberados. Limpeza de logs executada com sucesso.", "SYSTEM", "LOGICA");
  };

  const isNight = (() => {
    const [h] = inputs.timeOfDay.split(":").map(Number);
    return h >= 18 || h < 6;
  })();

  // Mensagens consultivas de boas-vindas baseadas no sistema
  const getHelperTip = () => {
    if (inputs.brokenSoilSensor) {
      return "ALERTA SENSOR DE SOLO OFFLINE: O AtmoSense virtualizou o teor de umidade hídrica calculando o VPD e a Evapotranspiração (ET0) com base no clima atual da região. A cultura está protegida de secas mesmo sem o sensor!";
    }
    if (inputs.cloggedValve) {
      return "SISTEMA SEGURO CONTRA REFLUXO / CAVITAÇÃO: A válvula registrou fluxo zero de vazão física com sinal de abertura emitido. O AtmoSense desligou eletricamente a bomba d'água para preservar o motor de danos graves!";
    }
    if (outputs.uvLockActive) {
      return "PROTEÇÃO FOLHA SECA SENSÍVEL: Radiação solar ultravioleta está perigosa. Regar agora causaria choque térmico nas mudas e evaporação imediata da película hídrica. A rega está sob boicote biológico ativo.";
    }
    if (outputs.fungalLockActive) {
      return "PREVENÇÃO CONTRA FUNGO RADICULAR (Ponto de Orvalho crítico): A umidade relativa do ar atingiu níveis de saturação e a temperatura despencou. O AtmoSense barrou a rega para impedir a ascensão de ferrugem asiática.";
    }
    if (outputs.valveState === "ABERTA" && outputs.emergencyCoolingActive) {
      return "UMIDIFICAÇÃO CLIMÁTICA ATIVA: O ambiente está desértico (VPD Crítico). Iniciado pulso de atomização de 30 segundos nas folhagens apenas para resfriamento foliáceo por estresse de transpiração.";
    }
    return `Modelagem agroclimática AtmoSense em execução em ${location.city}. Sinta-se livre para alterar controles na aba Simulador.`;
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 flex flex-col justify-between font-sans custom-cursor-enabled transition-colors duration-500">
      
      {!hasStarted && (
        <LandingView onStart={() => setHasStarted(true)} />
      )}

      {/* Container Central */}
      <div className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 flex-1">
        
        {/* Superior: Header com Telemetria Dinâmica Solar e Abas de Navegação */}
        <TelemetryHeader 
          inputs={inputs} 
          outputs={outputs} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isSimulating={outputs.valveState === "ABERTA"}
        />

        {/* Notificação Superior de Guia Inteligente de Biossegurança (Dicas Agro-Tec) */}
        {!location.loading && location.isFallback && !dismissedFallback && (
          <div className="relative bg-amber-50 border-b-4 border-amber-500/50 rounded-3xl p-5 flex items-start gap-4 shadow-xl transition-all duration-300">
            <button 
              onClick={() => setDismissedFallback(true)}
              className="absolute top-4 right-4 text-amber-500 hover:text-amber-700 transition-colors p-1"
              aria-label="Dispensar aviso"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-3 bg-amber-500 text-white rounded-2xl border-2 border-amber-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="text-amber-800 font-black text-[10px] md:text-sm uppercase tracking-widest leading-relaxed">
                Aviso: Mudança de Estação (Redundância INMET Ativada)
              </h3>
              <p className="text-amber-900 font-medium text-xs md:text-sm leading-relaxed mt-1">
                Aviso do Sistema: A estação do INMET mais próxima do seu local encontra-se temporariamente inoperante (ou retornando dados vazios/incompletos, como ocorre em algumas estações rurais). 
                O sistema AtmoSense iterou e está utilizando de forma secundária a estação oficial mais próxima disponível de <span className="font-bold underline">{location.stationName || "outra região"}</span> para suprir a deficiência de dados da estação principal. 
                <br/><br/>
                <span className="bg-amber-200 text-amber-900 px-2 py-1 rounded font-bold font-mono">DISCLAIMER:</span> Lembre-se de que no projeto, o fato do sistema usar uma previsão um pouco mais distante é <span className="font-bold">TOTALMENTE confirmado ou negado localmente e em tempo-real pelos sensores de umidade de solo</span>. Nenhuma planta morre de sede pelo erro da nuvem!
              </p>
            </div>
          </div>
        )}

        {!dismissedTip && (
          <div className="relative bg-slate-50 border-b-4 border-emerald-500/50 rounded-3xl p-5 flex items-start gap-4 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-emerald-500/20 hover:shadow-2xl interactive-btn">
            <button 
              onClick={() => setDismissedTip(true)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Dispensar dica"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-3 bg-emerald-500 rounded-2xl border-2 border-emerald-400 shrink-0 text-white shadow-inner transform transition-transform hover:rotate-12 hover:scale-110 duration-300">
              <Lightbulb className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 pr-6">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest font-mono bg-emerald-200/50 px-2 py-0.5 rounded-md">Dica Agronômica Dinâmica</span>
              <p className="text-sm text-slate-800 mt-2 leading-relaxed font-bold">
                {getHelperTip()}
              </p>
            </div>
          </div>
        )}

        {/* Seletora Principal de Abas / Seções */}
        <main key={activeTab} className="animate-page w-full min-h-[500px]">
          {activeTab === "scientific_logic" && (
            <ScientificLogicView 
              inputs={inputs} 
              outputs={outputs} 
            />
          )}

          {activeTab === "simulator" && (
            <SimuladorView 
              inputs={inputs} 
              setInputs={setInputs} 
              outputs={outputs}
              triggerManualTrigger={() => {}}
              addSystemLog={addSystemLog}
              climatizeSensors={climatizeSensors}
              location={location}
              scenarioResult={scenarioResult}
              gardenArea={gardenArea}
              setGardenArea={setGardenArea}
              soilType={soilType}
              setSoilType={setSoilType}
              cultureKey={cultureKey}
              setCultureKey={setCultureKey}
              timerMode={timerMode}
              setTimerMode={setTimerMode}
              dumbInterval={dumbInterval}
              setDumbInterval={setDumbInterval}
              selectedDays={selectedDays}
              setSelectedDays={setSelectedDays}
              methodVal={methodVal}
              setMethodVal={setMethodVal}
              traditionalLitersAccumulated={traditionalLiters}
              atmoSenseLitersAccumulated={atmoSenseLiters}
              stressDaysCount={stressDays}
              logs={logs}
              clearLogs={clearLogs}
            />
          )}

          {activeTab === "documentation" && (
            <DocumentacaoView />
          )}
        </main>

      </div>

      {/* FOOTER Estilo SpaceX */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-6 mt-12 w-full">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 font-mono">
          <div>
            <span className="text-slate-800 font-bold">AtmoSense Precision Agriculture</span> • © 2026. Todos os direitos reservados.
          </div>
          <div className="flex gap-6 text-[10px] tracking-widest uppercase">
            <span>Motor: AtmoSense Core</span>
            <span>Ambiente: Produção</span>
            <span>Estação: INMET Oficial</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

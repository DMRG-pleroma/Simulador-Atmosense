export interface TelemetryData {
  soilMoisture: number; // 0% a 100%
  airTemperature: number; // °C
  relativeHumidity: number; // %
  uvIndex: number; // 0 - 11+
  timeOfDay: string; // "HH:MM"
  
  // Falhas simuladas
  brokenSoilSensor: boolean;
  cloggedValve: boolean;
}

export interface SystemOutputs {
  valveState: "ABERTA" | "FECHADA" | "BLOQUEADA";
  irrigationFlow: number; // L/min (se aberta e não entupida: 12 L/min)
  dutyCycleMode: "Deep Sleep - Acordando a cada 30 min" | "Acordando a cada 10 min";
  dewPoint: number; // °C
  vpd: number; // kPa
  vpdStatus: "MUITO_BAIXO" | "IDEAL_PROPAGACAO" | "IDEAL_VEGETATIVO" | "ALTO" | "CRITICO";
  et0: number; // mm/h simulado
  
  // Detalhes de Travas e Fallbacks
  uvLockActive: boolean; // Trava contra choque térmico e efeito lupa
  fungalLockActive: boolean; // Trava de umidade noturna pró-fungos
  virtualWaterBalanceActive: boolean; // Sobrevivência sem sensor de solo
  watchdogTriggered: boolean; // Watchdog devido a falhas do sensor
  bombaCavitationWarning: boolean; // Alerta de fluxo zero com válvula aberta
  emergencyCoolingActive: boolean; // Rega de emergência por VPD extremo
  
  // Explicação de diagnóstico
  statusDescription: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: string; // Hora da leitura simulada
  message: string;
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "SYSTEM";
  category: "SENSOR" | "VALVULA" | "LOGICA" | "ENERGIA";
}

export interface DailySummary {
  day: string;
  soilMoisture: number;
  consumptionAtmoSense: number; // Litros economizados
  consumptionTraditional: number; // Litros gastos no modelo antigo (horário fixo sem inteligência)
  waterSaved: number;
  avgVpd: number;
}

export interface DailySimulationPoint {
  date: string;
  rain: number;
  et0: number;
  tempMax: number;
  uvIndex: number;
  drSmart: number;
  drDumb: number;
  moistureSmart: number; // 0 a 100%
  moistureDumb: number; // 0 a 100%
  irrigationSmart: number; // mm
  irrigationDumb: number; // mm
  cumSmartLiters: number;
  cumDumbLiters: number;
  percolationSmartLiters: number;
  percolationDumbLiters: number;
  stressSmart: boolean;
  stressDumb: boolean;
}

export interface ScenarioResult {
  points: DailySimulationPoint[];
  totalSmartLiters: number;
  totalDumbLiters: number;
  totalSavedLiters: number;
  percentSaved: number;
  totalSmartWasteLiters: number;
  totalDumbWasteLiters: number;
  smartStressDays: number;
  dumbStressDays: number;
  taw: number;
  raw: number;
}


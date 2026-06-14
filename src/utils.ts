import { TelemetryData, SystemOutputs, TelemetryLog, DailySimulationPoint, ScenarioResult } from "./types";

/**
 * Calcula o Ponto de Orvalho aproximado via temperatura e umidade relativa (Magnus-Tetens)
 */
export function calculateDewPoint(temp: number, rh: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

/**
 * Calcula o Déficit de Pressão de Vapor (VPD) em kPa
 */
export function calculateVPD(temp: number, rh: number): { vpd: number; status: SystemOutputs["vpdStatus"] } {
  // Pressão de vapor de saturação (e_s) em kPa
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  // Pressão real de vapor (e_a) em kPa
  const ea = es * (rh / 100);
  const vpd = Math.max(0, es - ea);

  let status: SystemOutputs["vpdStatus"] = "IDEAL_VEGETATIVO";
  if (vpd < 0.4) {
    status = "MUITO_BAIXO"; // Risco de fungos e transpiração estagnada
  } else if (vpd >= 0.4 && vpd < 0.8) {
    status = "IDEAL_PROPAGACAO"; // Ótimo para mudas jovens
  } else if (vpd >= 0.8 && vpd < 1.2) {
    status = "IDEAL_VEGETATIVO"; // Alta fotossíntese
  } else if (vpd >= 1.2 && vpd < 1.6) {
    status = "ALTO"; // Alerta de solo secando rápido
  } else {
    status = "CRITICO"; // Stress por desidratação (fechamento de estômatos)
  }

  return { vpd, status };
}

/**
 * Calcula a Evapotranspiração Real aproximada (mm/h) sob condições locais
 */
export function calculateET0(temp: number, rh: number, uv: number): number {
  // Constante empírica baseada na equação de Hargreaves para radiação solar estimada por UV
  // Se for noite (UV = 0), a evapotranspiração é ínfima (apenas vento e gradiente térmico básico)
  const radiationFactor = uv > 0 ? Math.sqrt(uv) * 0.12 : 0.01;
  const humidityFactor = Math.max(0.1, 1 - rh / 100);
  const tempFactor = Math.max(5, temp + 15);
  
  return parseFloat((0.0055 * tempFactor * radiationFactor * humidityFactor).toFixed(4));
}

/**
 * Executa as decisões lógicas do nó físico ESP32
 */
export function runAtmoSenseLogic(inputs: TelemetryData): SystemOutputs {
  const { soilMoisture, airTemperature, relativeHumidity, uvIndex, timeOfDay, brokenSoilSensor, cloggedValve } = inputs;

  const dewPoint = parseFloat(calculateDewPoint(airTemperature, relativeHumidity).toFixed(1));
  const { vpd, status: vpdStatus } = calculateVPD(airTemperature, relativeHumidity);
  const et0 = calculateET0(airTemperature, relativeHumidity, uvIndex);

  // Parse hora do dia para controle de comportamento fotovoltaico / ciclo do ESP32
  const [hoursStr, minutesStr] = timeOfDay.split(":");
  const hours = parseInt(hoursStr) || 12;
  const isNight = hours >= 18 || hours < 6;

  // 1. Modo de economia de energia do ESP32 (Duty Cycle)
  const dutyCycleMode: SystemOutputs["dutyCycleMode"] = isNight
    ? "Deep Sleep - Acordando a cada 30 min"
    : "Acordando a cada 10 min";

  // Inicializa estados de travas e alertas
  let uvLockActive = false;
  let fungalLockActive = false;
  let virtualWaterBalanceActive = false;
  let watchdogTriggered = false;
  let bombaCavitationWarning = false;
  let emergencyCoolingActive = false;

  // Determinar status de umidade para tomada de decisões
  let effectiveSoilMoisture = soilMoisture;

  // Se o sensor de solo quebrar, ativa "Balanço Hídrico Virtual"
  if (brokenSoilSensor) {
    virtualWaterBalanceActive = true;
    watchdogTriggered = true;
    
    // Virtualiza o solo usando o VPD e ET0 como referência: high VPD -> simula solo secando mais rápido
    // Estimativa teórica alternativa da umidade baseada no equilíbrio clima e umidade relativa do ar
    const equilibriumMoisture = Math.round(relativeHumidity * 0.6 + (35 - vpd * 10));
    effectiveSoilMoisture = Math.max(10, Math.min(90, equilibriumMoisture));
  }

  // Lógica de irrigação padrão (sem travas ativas)
  // Requer água se a umidade do solo estiver abaixo do limiar (40%)
  const needsWater = effectiveSoilMoisture < 40;

  // A. Verificação de Trava Solar / Efeito Lupa (UV alto)
  // Irrigar com sol escaldante causa queima de folhas e desperdício de água por evaporação imediata
  if (needsWater && uvIndex >= 7) {
    uvLockActive = true;
  }

  // B. Verificação de Trava Fúngica (Ponto de Orvalho iminente no fim de tarde / noite)
  // Se a temperatura do ar cai perto do ponto de orvalho, a planta está prestes a transpirar umidade líquida (orvalho).
  // Adicionar irrigação sob risco de gotejamento foliar eleva o índice de ferrugem asiática, oídio e fungos na raiz.
  const tempDiffToDewPoint = airTemperature - dewPoint;
  const isFungalTime = hours >= 17 || hours < 6;
  if (needsWater && isFungalTime && tempDiffToDewPoint <= 2.0) {
    fungalLockActive = true;
  }

  // C. Lógica de Rega Emergencial por VPD Crítico (Estresse térmico)
  // Planta perde muita água pelas folhas devido à secura do ar externa. Se não houver UV exagerado ou restrição severa,
  // fazemos um pulso de nebulização de 30s para resfriar, mesmo se o solo ainda estiver mediano.
  if (!needsWater && vpdStatus === "CRITICO" && uvIndex < 7 && !isNight) {
    emergencyCoolingActive = true;
  }

  // Determina o estado da válvula com base nas prioridades lógicas
  let valveState: SystemOutputs["valveState"] = "FECHADA";
  let statusDescription = "Condições ideais. Horta hidratada.";

  const anyLockActive = uvLockActive || fungalLockActive;

  if (cloggedValve) {
    // Alerta máximo de falha: bocal entupido ou registro fechado
    // Se a válvula idealmente abriria, mas não passa água, corta imediatamente o comando para evitar danos.
    valveState = "BLOQUEADA";
    bombaCavitationWarning = true;
    statusDescription = "ALERTA CRÍTICO: Pressão sem fluxo detectada. Bomba desligada pelo Watchdog de Fluxo.";
  } else if (anyLockActive) {
    valveState = "BLOQUEADA";
    if (uvLockActive && fungalLockActive) {
      statusDescription = "BLOQUEADO: Riscos combinados de Choque Térmico (Radiação UV Crítica) e Proliferação de Fungos (Condensação).";
    } else if (uvLockActive) {
      statusDescription = "BLOQUEADO: Proteção UV ativa. Evitando evapotranspiração instantânea e choque térmico (Efeito Lupa).";
    } else {
      statusDescription = "BLOQUEADO: Risco Fúngico Crítico. Temperatura do ar próxima do Ponto de Orvalho.";
    }
  } else if (needsWater) {
    valveState = "ABERTA";
    statusDescription = virtualWaterBalanceActive
      ? "IRRIGANDO (Segurança): Sensor físico inativo. Ativado Balanço Hídrico Virtual preditivo para rega calculada."
      : "IRRIGANDO: Umidade do solo abaixo do limite de conforto foliar.";
  } else if (emergencyCoolingActive) {
    valveState = "ABERTA";
    statusDescription = "UMIDIFICAÇÃO DE EMERGÊNCIA: Pulso ativo para resfriamento foliáceo por estresse de VPD extremo.";
  } else {
    // Solo hidratado, válvula fechada
    if (effectiveSoilMoisture > 75) {
      statusDescription = "RESERVA COMPLETA: Capacidade de retenção do solo em nível ideal (Capacidade de Campo).";
    } else {
      statusDescription = "MODO ESPERA: Teor hídrico seguro na zona de absorção radicular.";
    }
  }

  // Vazão nominal simulada: se aberta = 12 L/min, se bloqueada/fechada = 0 L/min
  const irrigationFlow = (valveState === "ABERTA") ? 12 : 0;

  return {
    valveState,
    irrigationFlow,
    dutyCycleMode,
    dewPoint,
    vpd,
    vpdStatus,
    et0,
    uvLockActive,
    fungalLockActive,
    virtualWaterBalanceActive,
    watchdogTriggered,
    bombaCavitationWarning,
    emergencyCoolingActive,
    statusDescription
  };
}

/**
 * Cria uma lista rica de mensagens de simulação de alteração do ESP32 para fins de ilustração de logs
 */
export function generateSmartLogs(inputs: TelemetryData, outputs: SystemOutputs, oldOutputs?: SystemOutputs): TelemetryLog[] {
  const logs: TelemetryLog[] = [];
  const timestamp = inputs.timeOfDay;
  const randId = () => Math.random().toString(36).substring(2, 7).toUpperCase();

  // Se o estado mudou ou há condições especiais, gera logs explicativos
  logs.push({
    id: randId(),
    timestamp,
    message: `Leituras de sensores validadas no console do simulador. Solo: ${inputs.soilMoisture}%, Temp: ${inputs.airTemperature}°C, UR: ${inputs.relativeHumidity}%, UV: ${inputs.uvIndex}`,
    level: "INFO",
    category: "SENSOR"
  });

  if (inputs.brokenSoilSensor) {
    logs.push({
      id: randId(),
      timestamp,
      message: `PERDA DE SINAL: Sensor analógico de umidade do solo desconectado. Acionando Watchdog de Segurança!`,
      level: "ERROR",
      category: "SENSOR"
    });
    logs.push({
      id: randId(),
      timestamp,
      message: `MODO SEGURANÇA: Balanço Hídrico Virtual ativo. Calculando evaporação estimada via VPD (${outputs.vpd.toFixed(2)} kPa).`,
      level: "WARN",
      category: "LOGICA"
    });
  }

  if (inputs.cloggedValve) {
    logs.push({
      id: randId(),
      timestamp,
      message: `ANOMALIA: Sinal de abertura de válvula emitido, mas sensor de fluxo registrou 0 L/min!`,
      level: "ERROR",
      category: "VALVULA"
    });
    logs.push({
      id: randId(),
      timestamp,
      message: `SISTEMA DE SEGURANÇA: Desligamento emergencial da bomba preventivo contra sobreaquecimento e cavitação.`,
      level: "WARN",
      category: "VALVULA"
    });
  } else {
    if (outputs.uvLockActive) {
      logs.push({
        id: randId(),
        timestamp,
        message: `TRAVA SOLAR ATIVADA: Índice UV em nível crítico (${inputs.uvIndex}). Risco de choque de temperatura foliar. Bloqueando rega.`,
        level: "WARN",
        category: "LOGICA"
      });
    }
    if (outputs.fungalLockActive) {
      logs.push({
        id: randId(),
        timestamp,
        message: `TRAVA DE UMIDADE EVITADA: Risco Fúngico Elevado. Temp (${inputs.airTemperature}°C) a apenas ${(inputs.airTemperature - outputs.dewPoint).toFixed(1)}°C do ponto de orvalho (${outputs.dewPoint}°C). Válvula selada.`,
        level: "WARN",
        category: "LOGICA"
      });
    }
    if (outputs.emergencyCoolingActive) {
      logs.push({
        id: randId(),
        timestamp,
        message: `ALERTA CLIMÁTICO: Umidade de ar crítica identificada. VPD em ${outputs.vpd.toFixed(2)} kPa. Nebulizando microclima para alívio térmico.`,
        level: "SUCCESS",
        category: "LOGICA"
      });
    }
    if (outputs.valveState === "ABERTA" && !outputs.emergencyCoolingActive) {
      logs.push({
        id: randId(),
        timestamp,
        message: `VÁLVULA ACIONADA: Teor de água do solo em declínio (${inputs.soilMoisture}%). Fluxo hidráulico nominal estabelecido em ${outputs.irrigationFlow} L/min.`,
        level: "SUCCESS",
        category: "VALVULA"
      });
    }
  }

  // Log de transição energética do microcontrolador
  const [hoursStr] = inputs.timeOfDay.split(":");
  const hours = parseInt(hoursStr) || 12;
  if (hours === 18 && (oldOutputs === undefined || oldOutputs.dutyCycleMode !== outputs.dutyCycleMode)) {
    logs.push({
      id: randId(),
      timestamp,
      message: `CREPÚSCULO DETECTADO: Sistema comutando para modo de contenção hídrica noturna.`,
      level: "SYSTEM",
      category: "ENERGIA"
    });
  } else if (hours === 6 && (oldOutputs === undefined || oldOutputs.dutyCycleMode !== outputs.dutyCycleMode)) {
    logs.push({
      id: randId(),
      timestamp,
      message: `ALVORADA: Dia iniciado. Sistema saindo de contenção noturna. Mapeamento algorítmico da rotina meteorológica reativado.`,
      level: "SYSTEM",
      category: "ENERGIA"
    });
  }

  return logs;
}

/**
 * Roda o cenário do modelo hidrológico FAO-56 sobre 36 dias de clima real do INMET
 * de forma a simular computacionalmente o impacto do AtmoSense vs Temporizador clássico.
 */
export function runFaoScenarioSimulation(
  apiData: any,
  area: number,
  inputSoilType: string,
  cultureKey: string,
  timerMode: "interval" | "weekday",
  dumbInterval: number,
  selectedDays: number[],
  methodVal: string
): ScenarioResult {
  // 1. Solo: Limites Físicos de Umidade Volumétrica (m³/m³)
  const soilPhysicsMap: Record<string, { fc: number; wp: number }> = {
    arenoso:  { fc: 0.12, wp: 0.04 }, // TAW = 80 mm por metro
    siltoso:  { fc: 0.28, wp: 0.13 }, // TAW = 150 mm/m
    argiloso: { fc: 0.38, wp: 0.22 }, // TAW = 160 mm/m
    auto:     { fc: 0.28, wp: 0.13 }
  };
  
  let soilType = inputSoilType;
  if (soilType === "aleatorio") {
    // Pick based on a deterministic hash of area or just default to something
    const options = ["arenoso", "siltoso", "argiloso"];
    soilType = options[area % 3];
  }
  
  const phys = soilPhysicsMap[soilType] || soilPhysicsMap["siltoso"];
  
  // 2. Cultura: Constantes de Desenvolvimento e Zona Radicular (FAO-56)
  const cropPhysicsMap: Record<string, { name: string; zr: number; p: number; kc: number }> = {
    "60-80": { name: "Hortaliças Folhosas", zr: 0.25, p: 0.40, kc: 1.00 },
    "50-75": { name: "Hortaliças de Frutos", zr: 0.40, p: 0.45, kc: 1.05 },
    "40-80": { name: "Pequenas Frutíferas / Comum", zr: 0.50, p: 0.50, kc: 0.85 },
    "30-90": { name: "Relvado / Pastagem", zr: 0.30, p: 0.60, kc: 0.75 },
    "60-120": { name: "Milho / Soja (Grãos)", zr: 0.60, p: 0.50, kc: 1.20 },
    "80-130": { name: "Banana / Cana (Alto Consumo)", zr: 0.80, p: 0.40, kc: 1.25 }
  };
  const crop = cropPhysicsMap[cultureKey] || cropPhysicsMap["40-80"];

  // 3. Cálculos de Capacidade Volumétrica Útil do Solo (FAO-56)
  const TAW = 1000 * (phys.fc - phys.wp) * crop.zr; // Total Available Water (mm)
  const RAW = crop.p * TAW;                        // Readily Available Water (mm)

  const daily = apiData?.daily;
  if (!daily || !daily.time) {
    // Retorna cenário vazio em caso de falha da API
    return {
      points: [],
      totalSmartLiters: 0,
      totalDumbLiters: 0,
      totalSavedLiters: 0,
      percentSaved: 0,
      totalSmartWasteLiters: 0,
      totalDumbWasteLiters: 0,
      smartStressDays: 0,
      dumbStressDays: 0,
      taw: TAW,
      raw: RAW
    };
  }

  const times: string[] = daily.time;
  const length = times.length;

  let DrSmart = 0.1 * TAW; // Começa drenado um pouco (10% depleção)
  let DrDumb = 0.1 * TAW;

  let totalSmartLiters = 0;
  let totalDumbLiters = 0;
  let totalSmartWasteLiters = 0;
  let totalDumbWasteLiters = 0;
  let smartStressDays = 0;
  let dumbStressDays = 0;

  const points: DailySimulationPoint[] = [];

  const methodMap: Record<string, number> = { "2-6": 4.0, "4-8": 6.0, "3-5": 4.0 };
  const designRate = methodMap[methodVal] || 4.0;
  let lastDumbIdx = -1;

  for (let i = 0; i < length; i++) {
    const date = times[i];
    const r = daily.precipitation_sum?.[i] || 0;
    const et0 = daily.et0_fao_evapotranspiration?.[i] || 2.5; 
    const uv = daily.uv_index_max?.[i] || 0;
    const tempMax = daily.temperature_2m_max?.[i] || 20;

    // A. Estresse e Transpiração Real (ETc)
    let KsSmart = 1.0;
    if (DrSmart > RAW) {
      KsSmart = Math.max(0, (TAW - DrSmart) / (TAW - RAW));
    }
    const ETcSmart = crop.kc * et0 * KsSmart;
    const isSmartStressed = KsSmart < 0.95;
    if (isSmartStressed) smartStressDays++;

    let KsDumb = 1.0;
    if (DrDumb > RAW) {
      KsDumb = Math.max(0, (TAW - DrDumb) / (TAW - RAW));
    }
    const ETcDumb = crop.kc * et0 * KsDumb;
    const isDumbStressed = KsDumb < 0.95;
    if (isDumbStressed) dumbStressDays++;

    // B. Decisão Smart (AtmoSense com controle preditivo)
    let irrigationSmart = 0;
    // Detecção se vai chover de forma forte no dia seguinte para economizar água
    const nextRain = (i < length - 1) ? (daily.precipitation_sum?.[i + 1] || 0) : 0;
    const modelPredictionDepletion = DrSmart + ETcSmart - r;

    // Se chover forte hoje, adia a rega total
    if (r > 3.0) {
      irrigationSmart = 0;
    } else if (modelPredictionDepletion >= RAW) {
      let runRega = true;
      // Previsão de Chuva Inteligente: se chover mais de 3mm amanhã, e o solo não estiver no limite crítico (85%), segura o disparo
      if (nextRain > 3.0 && DrSmart < (TAW * 0.85)) {
        runRega = false;
      }
      // Proteção de radiação UV extrema: se o UV passar de 8 e for aspersor/micro, evita irrigar no sol do meio-dia (efeito lupa e evaporação imediata das gotas no ar)
      const isSprinkler = methodVal === "4-8" || methodVal === "3-5";
      if (runRega && uv > 7 && isSprinkler && DrSmart < (TAW * 0.85)) {
        runRega = false;
      }

      if (runRega) {
        // Enche o solo de volta (repolariza Dr para zero)
        irrigationSmart = Math.max(0, modelPredictionDepletion);
      }
    }

    // C. Decisão Dumb (Temporizador Cíclico Tradicional)
    let irrigationDumb = 0;
    if (timerMode === "interval") {
      if (i % dumbInterval === 0) {
        const elapsed = dumbInterval;
        // Aplica uma lâmina fixa baseada na taxa do projeto acrescida de uma taxa de segurança do agricultor de 15% para redundância
        irrigationDumb = designRate * elapsed * 1.15;
      }
    } else {
      const dayOfWeek = new Date(date + "T12:00:00").getDay();
      if (selectedDays.includes(dayOfWeek)) {
        const elapsed = lastDumbIdx < 0 ? 1 : (i - lastDumbIdx);
        irrigationDumb = designRate * elapsed * 1.15;
        lastDumbIdx = i;
      }
    }

    // D. Evolução Física dos Estados (Dr = Root Zone Depletion)
    // Atualiza Smart
    DrSmart = DrSmart + ETcSmart - r - irrigationSmart;
    let smartPercolation = 0;
    if (DrSmart < 0) {
      smartPercolation = -DrSmart;
      DrSmart = 0;
    }
    if (DrSmart > TAW) {
      DrSmart = TAW;
    }

    // Atualiza Dumb
    DrDumb = DrDumb + ETcDumb - r - irrigationDumb;
    let dumbPercolation = 0;
    if (DrDumb < 0) {
      dumbPercolation = -DrDumb;
      DrDumb = 0;
    }
    if (DrDumb > TAW) {
      DrDumb = TAW;
    }

    // Conversão de mm de lâmina em Litros úteis para a horta inteira (Volume = Lâmina em mm * Área em m²)
    const smartLiters = irrigationSmart * area;
    const dumbLiters = irrigationDumb * area;
    const smartPercolationLiters = smartPercolation * area;
    const dumbPercolationLiters = dumbPercolation * area;

    totalSmartLiters += smartLiters;
    totalDumbLiters += dumbLiters;
    totalSmartWasteLiters += smartPercolationLiters;
    totalDumbWasteLiters += dumbPercolationLiters;

    const moistureSmart = parseFloat(((1 - DrSmart / TAW) * 100).toFixed(1));
    const moistureDumb = parseFloat(((1 - DrDumb / TAW) * 100).toFixed(1));

    points.push({
      date,
      rain: r,
      et0,
      tempMax,
      uvIndex: uv,
      drSmart: parseFloat(DrSmart.toFixed(2)),
      drDumb: parseFloat(DrDumb.toFixed(2)),
      moistureSmart,
      moistureDumb,
      irrigationSmart: parseFloat(irrigationSmart.toFixed(2)),
      irrigationDumb: parseFloat(irrigationDumb.toFixed(2)),
      cumSmartLiters: Math.round(totalSmartLiters),
      cumDumbLiters: Math.round(totalDumbLiters),
      percolationSmartLiters: Math.round(smartPercolationLiters),
      percolationDumbLiters: Math.round(dumbPercolationLiters),
      stressSmart: isSmartStressed,
      stressDumb: isDumbStressed
    });
  }

  const totalSavedLiters = Math.max(0, totalDumbLiters - totalSmartLiters);
  const percentSaved = totalDumbLiters > 0 ? parseFloat(((totalSavedLiters / totalDumbLiters) * 100).toFixed(1)) : 0;

  return {
    points,
    totalSmartLiters: Math.round(totalSmartLiters),
    totalDumbLiters: Math.round(totalDumbLiters),
    totalSavedLiters: Math.round(totalSavedLiters),
    percentSaved,
    totalSmartWasteLiters: Math.round(totalSmartWasteLiters),
    totalDumbWasteLiters: Math.round(totalDumbWasteLiters),
    smartStressDays,
    dumbStressDays,
    taw: parseFloat(TAW.toFixed(1)),
    raw: parseFloat(RAW.toFixed(1))
  };
}


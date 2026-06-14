import React from "react";
import { 
  BrainCircuit, ShieldCheck, 
  Sparkles, BookOpen,
  TrendingDown, TrendingUp, Droplet, Sun
} from "lucide-react";

interface ScientificLogicViewProps {
  inputs: any;
  outputs: any;
}

export default function ScientificLogicView({ inputs, outputs }: ScientificLogicViewProps) {
  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* SEÇÃO PRINCÍPIO ATMO-CIENTÍFICO */}
      <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b-2 border-slate-100">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border-2 border-emerald-500/20 shadow-sm shrink-0">
                <BrainCircuit className="w-6 h-6" />
              </span>
              <span className="text-xs font-black text-emerald-800 font-mono uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                METODOLOGIA DE PRECISÃO
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              A Lógica Científica do Atmo<span className="text-emerald-700 animate-s-pulse font-mono">S</span><span className="text-emerald-700">ense</span>
            </h2>
            <p className="text-sm md:text-base text-slate-700 max-w-3xl leading-relaxed font-bold">
              O AtmoSense sintoniza variáveis do clima em tempo real (obtidas de previsão unificada INMET) para controlar a água da raiz através de medições precisas, em vez de depender de temporizadores rígidos tradicionais ou de sensores simplórios. 
            </p>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-500/30 p-5 rounded-2xl shrink-0 w-full md:w-auto flex items-center gap-4 shadow-md hover:-translate-y-1 transition-transform cursor-default">
            <TrendingUp className="text-emerald-700 w-10 h-10 shrink-0" />
            <div>
              <span className="text-emerald-700 text-3xl font-black block font-sans tracking-tighter">+65%</span>
              <span className="text-xs text-emerald-800 uppercase font-black tracking-widest bg-emerald-200/50 px-2 rounded">Economia</span>
            </div>
          </div>
        </div>

        {/* COMPARANDO OS FILOSOFOS DE REGA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {/* Método 1: Temporizador Clássico (Incompetente) */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-lg hover:border-red-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="space-y-4">
              <div className="inline-flex max-w-full items-center gap-2 font-black text-xs uppercase tracking-widest text-[#E2725B] bg-red-50 w-fit px-3 py-1.5 rounded-lg border border-red-100">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2725B] group-hover:animate-ping"></span>
                Timer Comum
              </div>
              <h3 className="text-xl font-black text-slate-900 font-sans">Rápido e Estático</h3>
              <p className="text-sm text-slate-700 leading-relaxed font-bold">
                Dispara em horários fixos sem avaliar o solo ou clima. Se chover forte hoje, ele molha de qualquer forma, desperdiçando água e podendo prejudicar a planta.
              </p>
            </div>
            <div className="bg-red-100 border-l-4 border-[#E2725B] p-4 rounded-xl text-xs text-red-900 font-black mt-4 shadow-sm">
              Risco: Desperdício de água e apodrecimento.
            </div>
          </div>

          {/* Método 2: Sensor de Umidade Simples */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-lg hover:border-amber-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="space-y-4">
              <div className="inline-flex max-w-full items-center gap-2 font-black text-xs uppercase tracking-widest text-amber-700 bg-amber-50 w-fit px-3 py-1.5 rounded-lg border border-amber-100">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 group-hover:animate-ping"></span>
                Sensor Simples
              </div>
              <h3 className="text-xl font-black text-slate-900 font-sans">Reação Local</h3>
              <p className="text-sm text-slate-700 leading-relaxed font-bold">
                Rega apenas quando a umidade cai abaixo de um limite. Não possui previsão de chuva. Se o sensor sujar, corta o fornecimento e a planta morre silenciosamente.
              </p>
            </div>
            <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-xl text-xs text-amber-900 font-black mt-4 shadow-sm">
              Risco: Falta de previsão e falha de sensor.
            </div>
          </div>

          {/* Método 3: AtmoSense */}
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/30 group">
            <div className="absolute top-0 right-0 p-4 text-emerald-300 opacity-50 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-500">
              <Sparkles className="w-20 h-20" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="inline-flex max-w-full items-center gap-2 font-black text-xs uppercase tracking-widest text-emerald-900 bg-emerald-200 w-fit px-3 py-1.5 rounded-lg border border-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Sistema AtmoSense
              </div>
              <h3 className="text-xl font-black text-slate-900 font-sans">Previsão e Precisão</h3>
              <p className="text-sm text-slate-800 leading-relaxed font-bold">
                Sincroniza INMET com o solo para decidir. Evita rega se houver previsão de chuva forte, e aguarda o sol reduzir para não haver choque térmico, além de usar cálculos de evapotranspiração para virtualizações (ET0).
              </p>
            </div>
            <div className="bg-emerald-600 border-l-4 border-emerald-300 p-4 rounded-xl text-xs text-white font-black tracking-wide mt-4 shadow-lg flex items-center justify-between">
              <span>Resultado: Otimização corporativa.</span>
              <span className="bg-slate-50/20 px-2 py-1 rounded">100% Autônomo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between mt-8">
        <div className="space-y-6 md:space-y-8">
          <h4 className="text-xl font-black uppercase text-slate-900 tracking-widest flex items-center gap-3 border-b-2 border-slate-100 pb-5">
            <BookOpen className="w-8 h-8 text-emerald-700 p-1.5 bg-emerald-100 rounded-xl" />
            Algoritmos Matemáticos Utilizados
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-3xl flex flex-col justify-between hover:border-emerald-400 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-md">
              <div>
                <span className="text-sm text-emerald-800 font-black uppercase inline-block tracking-widest mb-4 bg-emerald-100 w-fit max-w-full px-3 py-1.5 rounded-lg border border-emerald-200">1. Ponto de Orvalho (T_d)</span>
                <p className="text-base text-slate-800 leading-relaxed font-bold">
                  Barreira de segurança termodinâmica. Bloqueia rega se a umidade do ar estiver próxima do ponto de condensação foliar, evitando fungos patógenos.
                </p>
              </div>
              <div className="mt-6 bg-[#f8fafc] py-5 px-4 rounded-2xl border-2 border-slate-200 text-center font-serif text-lg md:text-xl font-black text-slate-900 shadow-inner overflow-hidden flex items-center justify-center tracking-widest">
                <span className="whitespace-nowrap">T<sub>d</sub> ≈ T - <span className="inline-flex flex-col items-center align-middle mx-1 text-base md:text-lg leading-none pt-1"><span className="border-b-4 border-slate-900 px-1 pb-1">100 - RH</span><span className="px-1 pt-1">5</span></span></span>
              </div>
            </div>

            <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-3xl flex flex-col justify-between hover:border-amber-400 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-md">
              <div>
                <span className="text-sm text-amber-800 font-black uppercase inline-block tracking-widest mb-4 bg-amber-100 w-fit max-w-full px-3 py-1.5 rounded-lg border border-amber-200">2. Déficit de Pressão (VPD)</span>
                <p className="text-base text-slate-800 leading-relaxed font-bold">
                  Mede a "força de sucção" atmosférica. Se o ar está com baixa demanda evaporativa, a irrigação foliar é evitada para não desperdiçar um milímetro de água na transição de fase.
                </p>
              </div>
              <div className="mt-6 bg-[#f8fafc] py-5 px-4 rounded-2xl border-2 border-slate-200 text-center font-serif text-lg md:text-2xl font-black text-slate-900 shadow-inner overflow-hidden flex items-center justify-center tracking-widest">
                <span className="whitespace-nowrap">VPD = e<sub>s</sub> - e<sub>a</sub></span>
              </div>
            </div>

            <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-3xl flex flex-col justify-between hover:border-[#E2725B] transition-all hover:shadow-2xl hover:-translate-y-1 shadow-md">
              <div>
                <span className="text-sm text-[#E2725B] font-black uppercase inline-block tracking-widest mb-4 bg-[#FFF8F6] border border-[#E2725B]/20 w-fit max-w-full px-3 py-1.5 rounded-lg">3. Balanço Hídrico (FAO-56)</span>
                <p className="text-base text-slate-800 leading-relaxed font-bold">
                  Soma matemática do quanto a planta bebeu (ETc), equilibrada pelas chuvas oficiais INMET, para repor milimetricamente. A precisão em sua máxima excelência agronômica.
                </p>
              </div>
              <div className="mt-6 bg-[#f8fafc] py-5 px-4 rounded-2xl border-2 border-slate-200 text-center font-serif text-lg md:text-2xl font-black text-slate-900 shadow-inner overflow-hidden flex items-center justify-center tracking-widest">
                <span className="whitespace-nowrap">ET<sub>c</sub> = ET<sub>0</sub> × K<sub>c</sub></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETALHAMENTO DE BIOPROTEÇÃO DA FAZENDA */}
      <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-10 shadow-xl">
        <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 flex items-center gap-3 border-b-2 border-slate-100 pb-5 mb-8">
          <ShieldCheck className="w-8 h-8 text-emerald-700" />
          Travas Climáticas de Segurança (Bio-Resiliência)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
          <div className="bg-[#FFF8F6] border-2 border-[#E2725B]/20 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 group">
            <div className="flex gap-5 items-start mb-5">
              <div className="p-4 bg-[#E2725B] text-white rounded-2xl shadow-md shrink-0 group-hover:scale-110 transition-transform">
                <Sun className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <strong className="text-slate-900 block text-xl font-black tracking-tight">Efeito Lupa & Choque Térmico</strong>
                <span className="inline-block text-[10px] font-black bg-[#E2725B]/10 text-[#D9534F] px-3 py-1 rounded-lg uppercase tracking-widest border border-[#E2725B]/20">Bloqueio Protetivo UV</span>
              </div>
            </div>
            <p className="text-slate-800 font-bold text-base leading-relaxed bg-slate-50/70 p-5 rounded-2xl border border-white">
              Irrigar em momentos de radiação solar extrema (UV forte &gt; 7) causa evaporação iminente e queima irreversível das folhas pelo "efeito lupa" que as gotículas de água exercem sobre os cloroplastos vegetais. O sistema tranca a eletroválvula fisicamente até as nuvens retornarem ou a noite cair, reduzindo o índice para níveis passíveis de rega.
            </p>
          </div>

          <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1 group">
            <div className="flex gap-5 items-start mb-5">
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md shrink-0 group-hover:scale-110 transition-transform">
                <Droplet className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <strong className="text-slate-900 block text-xl font-black tracking-tight">Ferrugem e Fungos Patógenos</strong>
                <span className="inline-block text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg uppercase tracking-widest border border-emerald-200">Gatilho Algorítmico (T_d)</span>
              </div>
            </div>
            <p className="text-slate-800 font-bold text-base leading-relaxed bg-slate-50/70 p-5 rounded-2xl border border-white">
              Aplicações hídricas noturnas prolongadas em noites úmidas promovem ambientes ideais para microrganismos invasivos e oídio foliar crescerem exponencialmente. Ao avaliar o Ponto de Orvalho em conjunto à previsão INMET, nós trancamos o sistema ativamente, impedindo que a folha fique estagnada úmida e fria por mais de 5 horas ininterruptas.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

import React from "react";
import { 
  BookOpen, Terminal, Cpu, HardDrive, Network, Settings, 
  HelpCircle, ShieldCheck, Database, Layers, GitFork, Compass
} from "lucide-react";

export default function DocumentacaoView() {
  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* CAPA DA DOCUMENTAÇÃO */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-[0.03] p-6 select-none pointer-events-none text-emerald-800">
          <BookOpen className="w-48 h-48" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-1.5 font-bold text-xs tracking-widest text-[#E2725B] font-mono uppercase">
            <Settings className="w-3.5 h-3.5" />
            Manual Técnico & Especificações de Campo
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">
            Especificações de Integração Atmo<span className="text-emerald-700 font-mono">S</span><span className="text-emerald-700">ense</span>
          </h2>
          <p className="text-slate-600 font-medium text-sm md:text-base max-w-3xl leading-relaxed">
            Bem-vindo à central de referência do ecossistema AtmoSense. Este manual descreve o uso e o design logico do sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUNA ESQUERDA */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          
          <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-5">
              <div className="p-3 bg-orange-100 rounded-2xl border-2 border-orange-200">
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                  Referências Bibliográficas
                </h3>
                <p className="text-sm font-bold text-slate-600">Repertório científico expandido que fundamenta a excelência do sistema.</p>
              </div>
            </div>

            <ul className="list-disc pl-5 text-sm text-slate-700 font-bold leading-relaxed font-sans space-y-5">
              <li>
                <strong className="text-slate-900">ALLEN, R. G. et al. (1998)</strong> Crop evapotranspiration: Guidelines for computing crop water requirements. FAO Irrigation and drainage paper 56. Roma: FAO. <em className="text-slate-500 font-medium tracking-wide">(Base teórica absoluta para a equação de Penman-Monteith).</em>
              </li>
              <li>
                <strong className="text-slate-900">BERNARDO, S. (2006)</strong> Manual de Irrigação. 8ª Edição, Editora UFV. <em className="text-slate-500 font-medium tracking-wide">(Parâmetros de infiltração, capacidade de campo e profundidade efetiva do sistema radicular).</em>
              </li>
              <li>
                <strong className="text-slate-900">DOORENBOS, J.; KASSAM, A. H. (1994)</strong> Efeito da água no rendimento das culturas. Estudos FAO: Irrigação e Drenagem, 33. <em className="text-slate-500 font-medium tracking-wide">(Coeficientes de sensibilidade hídrica e penalização de produtividade).</em>
              </li>
              <li>
                <strong className="text-slate-900">EMBRAPA (2014)</strong> Manejo de irrigação inteligente: recomendações e uso de dados climáticos. Circular Técnica. <em className="text-slate-500 font-medium tracking-wide">(Adaptação de modelagem climática para biomas tropicais e subtropicais).</em>
              </li>
              <li>
                <strong className="text-slate-900">MONTEITH, J. L. (1965)</strong> Evaporation and environment. Symposia of the Society for Experimental Biology, v. 19, p. 205-234. <em className="text-slate-500 font-medium tracking-wide">(Fundamentos de termodinâmica da evaporação em superfícies vegetadas).</em>
              </li>
              <li>
                <strong className="text-slate-900">REICHARDT, K.; TIMM, L.C. (2012)</strong> Solo, Planta e Atmosfera: conceitos e aplicações. Barueri: Manole. <em className="text-slate-500 font-medium tracking-wide">(Física do solo e dinâmica do balanço hídrico na rizosfera).</em>
              </li>
            </ul>
          </div>

        </div>

        {/* COLUNA DIREITA */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          
          <div className="bg-slate-50 border-b-4 border-slate-300 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-5">
              <div className="p-3 bg-emerald-100 rounded-2xl border-2 border-emerald-300">
                <Compass className="w-8 h-8 text-emerald-700 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                  Integração de Sistemas de Clima
                </h3>
                <p className="text-sm font-bold text-slate-600">Como o AtmoSense sintoniza o tempo atmosferico em tempo real.</p>
              </div>
            </div>

            <p className="text-base text-slate-800 font-bold leading-relaxed font-sans">
              O aparelho do AtmoSense é programado para sempre perguntar aos serviços de internet sobre como está o tempo, dessa forma construímos a nossa previsão de retenção de água sem gastar sua internet ou água à toa:
            </p>

            <div className="space-y-4 font-sans mt-4">
              <div className="p-6 bg-[#f8fafc] rounded-2xl border-2 border-slate-200 space-y-3 shadow-inner hover:border-emerald-300 transition-colors">
                <strong className="text-emerald-800 text-lg block font-black flex items-center gap-2">
                  <Network className="w-5 h-5" /> 1. Previsão por Ensemble (Consenso Multimodelo)
                </strong>
                <p className="text-slate-800 text-base font-bold leading-relaxed">
                  Utiliza da arquitetura de inteligência climática de ponta onde não confiamos num único provedor físico. <br/><br/> <b className="text-emerald-900 bg-emerald-100 px-2 py-1 rounded font-mono text-sm tracking-widest uppercase">Fluxo Lógico Implementado:</b><br/> Georreferenciamento de precisão detecta a propriedade rural &rarr; Conecta à Open-Meteo para processar a malha atmosférica simultânea (ECMWF, GFS Seamless e IA AIFS) &rarr; Aplica algoritmo de consenso multimodelo nos 30 dias passados + 5 dias de sinótica futura &rarr; Exibe e simula curando nativamente os 35 dias de evapotranspiração no navegador, substituindo dependências pesadas e com resiliência a falhas de uma API única.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

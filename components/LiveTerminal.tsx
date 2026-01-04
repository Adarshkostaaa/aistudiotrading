
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Strategy } from '../types';
import { getLiveTradeSignal, getCooldownStatus } from '../services/gemini';
import { Terminal, Activity, X, Zap, Target, Shield, Clock, ZapOff, CheckCircle2, XCircle, Wallet, TrendingUp, TrendingDown, Microscope, PlayCircle, History, List, Settings2 } from 'lucide-react';

interface LiveTerminalProps {
  strategy: Strategy;
  onClose: () => void;
}

interface Log {
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'trade-win' | 'trade-loss';
}

interface TradeRecord {
  id: string;
  time: string;
  type: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  pnlPercent: number;
  pnlValue: number;
  outcome: 'WIN' | 'LOSS';
}

interface TradeState {
  isActive: boolean;
  entryPrice: number;
  type: 'BUY' | 'SELL';
  tpPercent: number; // Suggested by AI
  slPercent: number; // Suggested by AI
  entryTime: string;
  leverage: number;
  margin: number;
}

const LiveTerminal: React.FC<LiveTerminalProps> = ({ strategy, onClose }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'HISTORY'>('CONSOLE');
  const [price, setPrice] = useState(0);
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [signal, setSignal] = useState<'BUY' | 'SELL' | 'HOLD' | 'READY' | 'ERROR'>('READY');
  const [reason, setReason] = useState("Waiting for trade signal...");
  const [cooldownTime, setCooldownTime] = useState(0);
  
  // Paper Trading Account
  const [balance, setBalance] = useState(1000.00); 
  const [leverage, setLeverage] = useState(100);
  const [activeTrade, setActiveTrade] = useState<TradeState | null>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  // Fix: Use 'any' instead of NodeJS.Timeout to avoid namespace errors in browser environments.
  const autoTradeTimerRef = useRef<any>(null);
  
  const addLog = (message: string, type: Log['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-40), { time, message, type }]); 
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    ws.onopen = () => addLog("Binance Feed Online", "success");
    ws.onmessage = (event) => setPrice(parseFloat(JSON.parse(event.data).p));
    ws.onerror = () => addLog("Binance Feed Error", "error");
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const fetchMarketHistory = async (): Promise<string> => {
    try {
      const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=10');
      const data = await res.json();
      return data.map((k: any) => {
        const date = new Date(k[0]).toLocaleTimeString();
        return `${date} | O:${parseFloat(k[1]).toFixed(1)} H:${parseFloat(k[2]).toFixed(1)} L:${parseFloat(k[3]).toFixed(1)} C:${parseFloat(k[4]).toFixed(1)} V:${parseFloat(k[5]).toFixed(1)}`;
      }).join('\n');
    } catch (e) { return "Market data unavailable"; }
  };

  // Trade Execution & Monitoring
  useEffect(() => {
    if (!activeTrade || price === 0) return;

    const rawChange = (price - activeTrade.entryPrice) / activeTrade.entryPrice;
    const direction = activeTrade.type === 'BUY' ? 1 : -1;
    const pnlPercent = rawChange * direction * activeTrade.leverage * 100;
    const pnlValue = activeTrade.margin * (pnlPercent / 100);

    // AI DEFINED TP/SL hits
    const targetROI = activeTrade.tpPercent * activeTrade.leverage;
    const stopROI = activeTrade.slPercent * activeTrade.leverage;

    if (pnlPercent >= targetROI) {
      closeTrade(price, pnlPercent, pnlValue, 'WIN');
    } else if (pnlPercent <= -stopROI) {
      closeTrade(price, pnlPercent, pnlValue, 'LOSS');
    }
  }, [price, activeTrade]);

  const closeTrade = (exitPrice: number, pnlPct: number, pnlVal: number, outcome: 'WIN' | 'LOSS') => {
    if (!activeTrade) return;
    const newBalance = balance + pnlVal;
    const record: TradeRecord = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      type: activeTrade.type,
      entry: activeTrade.entryPrice,
      exit: exitPrice,
      pnlPercent: pnlPct,
      pnlValue: pnlVal,
      outcome
    };
    setBalance(newBalance);
    setHistory(prev => [record, ...prev]);
    addLog(`${outcome === 'WIN' ? 'TARGET' : 'STOP'} HIT: ${pnlPct.toFixed(2)}% ($${pnlVal.toFixed(2)})`, outcome === 'WIN' ? 'trade-win' : 'trade-loss');
    setActiveTrade(null);
    setSignal('READY');
  };

  const handleScan = async () => {
    if (activeTrade || isScanning || getCooldownStatus() > 0 || price === 0) return;
    setIsScanning(true);
    setSignal('READY');
    setReason("AI is reading candles...");
    try {
      const historyData = await fetchMarketHistory();
      const decision = await getLiveTradeSignal(strategy, price, historyData);
      if (decision.isRateLimited) {
        addLog("API Throttled", "error");
        setSignal('ERROR');
      } else {
        setSignal(decision.signal as any);
        setReason(decision.reasoning);
        if (decision.signal === 'BUY' || decision.signal === 'SELL') {
          setActiveTrade({
            isActive: true,
            type: decision.signal as 'BUY' | 'SELL',
            entryPrice: price,
            entryTime: new Date().toLocaleTimeString(),
            leverage,
            margin: balance,
            tpPercent: decision.tp_percent,
            slPercent: decision.sl_percent
          });
          addLog(`OPENED ${decision.signal} (${leverage}x) with TP:${decision.tp_percent}% SL:${decision.sl_percent}%`, 'info');
        } else {
          addLog(`Scanned: HOLD. ${decision.reasoning}`, 'info');
        }
      }
    } catch (e) { addLog("Scan Error", "error"); }
    finally { setIsScanning(false); }
  };

  // Auto-Trading Cycle
  useEffect(() => {
    if (isAutoTrading && !activeTrade && !isScanning && cooldownTime === 0) {
      const timer = setTimeout(handleScan, 15000);
      autoTradeTimerRef.current = timer;
      return () => clearTimeout(timer);
    }
  }, [isAutoTrading, activeTrade, isScanning, cooldownTime]);

  useEffect(() => {
    const timer = setInterval(() => setCooldownTime(getCooldownStatus()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const total = history.length;
    const wins = history.filter(h => h.outcome === 'WIN').length;
    return {
      winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0",
      total,
      wins,
      losses: total - wins
    };
  }, [history]);

  const currentPnL = activeTrade ? (() => {
    const raw = (price - activeTrade.entryPrice) / activeTrade.entryPrice;
    const dir = activeTrade.type === 'BUY' ? 1 : -1;
    return raw * dir * activeTrade.leverage * 100;
  })() : 0;

  return (
    <div className="bg-gray-950 border border-brand-500/20 rounded-xl overflow-hidden mt-6 shadow-2xl flex flex-col">
      {/* Account Dashboard */}
      <div className="bg-gray-900/80 p-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-black">Equity</span>
            <span className={`text-xl font-mono font-bold ${balance >= 1000 ? 'text-white' : 'text-red-400'}`}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-black">Win Rate</span>
            <span className="text-xl font-mono font-bold text-brand-400">{stats.winRate}%</span>
          </div>
        </div>

        <div className="flex-1 max-w-xs mx-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500 uppercase font-black">Leverage: {leverage}x</span>
            <Zap size={12} className="text-yellow-500" />
          </div>
          <input 
            type="range" min="1" max="125" step="1" 
            value={leverage} 
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsAutoTrading(!isAutoTrading)}
            className={`px-4 py-2 rounded font-bold text-xs flex items-center gap-2 transition-all ${
              isAutoTrading ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
           >
             {isAutoTrading ? <Activity size={14} className="animate-pulse" /> : <PlayCircle size={14} />}
             {isAutoTrading ? 'AUTO ON' : 'START AUTO'}
           </button>
           <button onClick={onClose} className="p-2 text-gray-600 hover:text-white"><X size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
        {/* Workspace - Tabs */}
        <div className="lg:col-span-2 flex flex-col border-r border-gray-800">
           <div className="flex border-b border-gray-800 bg-gray-900/40">
              <button 
                onClick={() => setActiveTab('CONSOLE')}
                className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'CONSOLE' ? 'text-brand-400 border-b border-brand-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Terminal size={12} /> Console
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'HISTORY' ? 'text-brand-400 border-b border-brand-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <History size={12} /> History ({history.length})
              </button>
           </div>

           <div className="flex-1 bg-black/40 overflow-y-auto max-h-[400px] font-mono text-[11px] p-4">
              {activeTab === 'CONSOLE' ? (
                <div ref={logsEndRef} className="space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-600">[{log.time}]</span>
                      <span className={
                        log.type === 'error' || log.type === 'trade-loss' ? 'text-red-400 font-bold' : 
                        log.type === 'trade-win' ? 'text-green-400 font-bold' : 
                        log.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                      }>{log.message}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <div className="text-gray-700 italic">No activity logs. Start scanning to begin.</div>}
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-[9px] text-gray-600 uppercase">
                    <tr className="border-b border-gray-800">
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Entry</th>
                      <th className="pb-2">Exit</th>
                      <th className="pb-2 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id} className="border-b border-gray-900/50 py-2">
                        <td className="py-2 text-gray-500">{h.time}</td>
                        <td className={h.type === 'BUY' ? 'text-green-500' : 'text-red-500'}>{h.type}</td>
                        <td className="text-white">${h.entry.toFixed(1)}</td>
                        <td className="text-white">${h.exit.toFixed(1)}</td>
                        <td className={`text-right font-bold ${h.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-700">No closed trades yet.</td></tr>}
                  </tbody>
                </table>
              )}
           </div>
        </div>

        {/* Right Panel - Active Trade or Manual Control */}
        <div className="p-6 bg-gray-900/30 flex flex-col justify-center gap-6">
          {activeTrade ? (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Active Position</label>
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeTrade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                   {activeTrade.type} {activeTrade.leverage}x
                 </span>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4 shadow-xl">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <div className="text-[9px] text-gray-500 uppercase">Entry</div>
                       <div className="text-sm font-mono font-bold text-white">${activeTrade.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                       <div className="text-[9px] text-gray-500 uppercase">Mark</div>
                       <div className={`text-sm font-mono font-bold ${price >= activeTrade.entryPrice ? 'text-green-400' : 'text-red-400'}`}>
                         ${price.toFixed(2)}
                       </div>
                    </div>
                 </div>

                 <div className="text-center py-4 bg-black/40 rounded border border-gray-700">
                    <div className={`text-4xl font-black font-mono leading-none ${currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold mt-2">Unrealized PnL</div>
                 </div>

                 <div className="space-y-1">
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden relative border border-gray-950">
                        <div className="absolute left-1/2 w-0.5 h-full bg-white z-10"></div>
                        <div 
                          className={`h-full transition-all duration-300 ${currentPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ 
                            width: `${Math.min(50, Math.abs(currentPnL) / 2)}%`, 
                            marginLeft: currentPnL >= 0 ? '50%' : undefined,
                            marginRight: currentPnL < 0 ? '50%' : undefined,
                            float: currentPnL < 0 ? 'right' : 'left'
                          }} 
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                       <span className="text-red-400">SL: -{(activeTrade.slPercent * activeTrade.leverage).toFixed(1)}%</span>
                       <span className="text-green-400">TP: +{(activeTrade.tpPercent * activeTrade.leverage).toFixed(1)}%</span>
                    </div>
                 </div>
              </div>

              <div className="p-3 bg-gray-900/50 rounded border border-gray-800">
                  <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">AI Logic:</span>
                  <p className="text-[11px] text-gray-300 italic leading-snug">"{reason}"</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={handleScan}
                disabled={isScanning || cooldownTime > 0}
                className={`w-full py-12 rounded-2xl font-black text-2xl flex flex-col items-center justify-center gap-3 transition-all border shadow-2xl active:scale-[0.98] ${
                    isScanning || cooldownTime > 0
                    ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-br from-brand-600 to-brand-700 text-white border-brand-500 shadow-brand-500/20 hover:from-brand-500 hover:to-brand-600'
                }`}
              >
                {isScanning ? <Activity className="animate-spin" size={40} /> : cooldownTime > 0 ? <Clock size={40} /> : <Microscope size={40} />}
                <span className="text-xs font-black tracking-widest">
                  {isScanning ? 'ANALYZING...' : cooldownTime > 0 ? `COOLING DOWN ${cooldownTime}S` : 'SCAN MARKET'}
                </span>
              </button>

              <div className="space-y-3">
                 <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase border-b border-gray-800 pb-1">
                    <span>Signal Status</span>
                    <span className={signal === 'READY' ? 'text-gray-600' : 'text-brand-400'}>{signal}</span>
                 </div>
                 <p className="text-[11px] text-gray-500 italic leading-snug text-center">
                    {reason}
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-900 border-t border-gray-800 p-3 flex justify-between items-center text-[10px] font-bold">
        <div className="flex items-center gap-4 text-gray-500">
           <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> BINANCE LIVE</span>
           <span className="flex items-center gap-1"><Shield size={10} /> 100% COLLATERALIZED</span>
        </div>
        <div className="text-brand-400 font-mono">
           BTC/USDT: ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

export default LiveTerminal;

import React, { useState, useEffect } from 'react';
import { Strategy, ViewState } from './types';
import { strategies } from './data/strategies';
import StrategyCard from './components/StrategyCard';
import BacktestChart from './components/BacktestChart';
import AIAnalysis from './components/AIAnalysis';
import LiveTerminal from './components/LiveTerminal';
import { LayoutDashboard, List, Trophy, Zap, ChevronLeft, Search, BarChart3, Settings } from 'lucide-react';

// Simple API Key Modal
const ApiKeyModal = ({ onSave }: { onSave: () => void }) => {
  return null; 
};

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStrategies, setFilteredStrategies] = useState(strategies);
  const [showLiveTerminal, setShowLiveTerminal] = useState(false);

  useEffect(() => {
    setFilteredStrategies(
      strategies.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.indicators.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  }, [searchTerm]);

  const handleStrategyClick = (s: Strategy) => {
    setSelectedStrategy(s);
    setShowLiveTerminal(false);
    setView(ViewState.STRATEGY_DETAIL);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-gray-800 bg-gray-900 flex-shrink-0 sticky top-0 h-screen flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
            <Zap className="text-brand-500" size={28} />
            <span className="ml-3 font-bold text-xl hidden lg:block tracking-tight">Scalp<span className="text-brand-500">Master</span></span>
          </div>
          
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setView(ViewState.DASHBOARD)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === ViewState.DASHBOARD ? 'bg-brand-500/10 text-brand-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <LayoutDashboard size={20} />
              <span className="ml-3 hidden lg:block">Dashboard</span>
            </button>
            <button 
              onClick={() => setView(ViewState.LEADERBOARD)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === ViewState.LEADERBOARD ? 'bg-brand-500/10 text-brand-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Trophy size={20} />
              <span className="ml-3 hidden lg:block">Leaderboard</span>
            </button>
            <button 
              onClick={() => setView(ViewState.AI_LAB)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === ViewState.AI_LAB ? 'bg-brand-500/10 text-brand-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <BotIcon />
              <span className="ml-3 hidden lg:block">AI Lab</span>
            </button>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center p-3 text-gray-500 hover:text-white cursor-pointer transition-colors">
            <Settings size={20} />
            <span className="ml-3 hidden lg:block text-sm">Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center text-gray-400 text-sm">
             <span className="hidden sm:inline">BTC/USDT 1m Scalping Database</span>
             <span className="mx-2 text-gray-600">|</span>
             <span className="text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Sync</span>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search strategy or indicator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-600"
            />
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          
          {/* DASHBOARD VIEW */}
          {view === ViewState.DASHBOARD && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Top Performing Strategies</h1>
                <p className="text-gray-400">Showing {filteredStrategies.length} strategies with >80% winrate on Bitcoin scalping.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStrategies.map((strategy) => (
                  <StrategyCard 
                    key={strategy.id} 
                    strategy={strategy} 
                    onClick={() => handleStrategyClick(strategy)}
                  />
                ))}
              </div>
            </>
          )}

          {/* LEADERBOARD VIEW */}
          {view === ViewState.LEADERBOARD && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-2xl font-bold">Global Leaderboard</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Strategy</th>
                      <th className="p-4">Win Rate</th>
                      <th className="p-4">Profit Factor</th>
                      <th className="p-4">Total Trades</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {strategies.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 font-mono text-gray-500">#{idx + 1}</td>
                        <td className="p-4 font-bold text-white">{s.name} <span className="text-gray-500 font-normal text-sm block">{s.author}</span></td>
                        <td className="p-4 text-brand-400 font-bold">{s.winRate}%</td>
                        <td className="p-4">{s.profitFactor}</td>
                        <td className="p-4">{s.trades}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => handleStrategyClick(s)}
                            className="text-brand-500 hover:text-brand-400 text-sm font-semibold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI LAB VIEW */}
          {view === ViewState.AI_LAB && (
             <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">AI Strategy Lab</h1>
                <p className="text-gray-400 mb-8">
                  Use Google's Gemini AI to discover new alpha. Generate experimental scalping strategies tailored for current market volatility.
                </p>
                <AIAnalysis mode="GENERATE" />
             </div>
          )}

          {/* STRATEGY DETAIL VIEW */}
          {view === ViewState.STRATEGY_DETAIL && selectedStrategy && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button 
                onClick={() => setView(ViewState.DASHBOARD)}
                className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="ml-1">Back to Dashboard</span>
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{selectedStrategy.name}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">Authored by {selectedStrategy.author}</span>
                          <span>•</span>
                          <span>Updated 12m ago</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-brand-500">{selectedStrategy.winRate}%</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Win Rate</div>
                      </div>
                    </div>

                    <BacktestChart data={selectedStrategy.equityCurve} />
                    
                    <div className="mt-8">
                      <h3 className="text-lg font-bold text-white mb-3">Strategy Logic</h3>
                      <p className="text-gray-400 leading-relaxed mb-4">
                        {selectedStrategy.description}
                      </p>
                      <h4 className="text-sm font-bold text-gray-300 mb-2 uppercase">Core Indicators</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStrategy.indicators.map(ind => (
                          <span key={ind} className="bg-gray-800 text-brand-200 border border-brand-900/30 px-3 py-1 rounded-md text-sm">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {showLiveTerminal && (
                    <LiveTerminal 
                      strategy={selectedStrategy} 
                      onClose={() => setShowLiveTerminal(false)} 
                    />
                  )}

                  {!showLiveTerminal && (
                    <AIAnalysis strategy={selectedStrategy} mode="ANALYZE" />
                  )}
                </div>

                {/* Sidebar Right Column */}
                <div className="space-y-6">
                   <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                      <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Performance Metrics</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                           <span className="text-gray-400">Total Trades</span>
                           <span className="font-mono text-white">{selectedStrategy.trades}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                           <span className="text-gray-400">Profit Factor</span>
                           <span className="font-mono text-green-400">{selectedStrategy.profitFactor}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                           <span className="text-gray-400">Avg Trade</span>
                           <span className="font-mono text-white">1m 12s</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                           <span className="text-gray-400">Drawdown</span>
                           <span className="font-mono text-red-400">-4.2%</span>
                        </div>
                      </div>
                      
                      {!showLiveTerminal && (
                        <button 
                          onClick={() => setShowLiveTerminal(true)}
                          className="w-full mt-6 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <BarChart3 size={18} />
                          Run Live Simulation
                        </button>
                      )}
                      
                      {showLiveTerminal && (
                         <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm text-center animate-pulse">
                           Live Execution Active
                         </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function BotIcon() {
  return (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

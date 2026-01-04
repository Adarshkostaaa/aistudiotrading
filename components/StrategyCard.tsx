import React from 'react';
import { Strategy } from '../types';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

interface StrategyCardProps {
  strategy: Strategy;
  onClick: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-850 border border-gray-750 rounded-xl p-5 cursor-pointer hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-brand-400 transition-colors">{strategy.name}</h3>
          <p className="text-gray-500 text-sm">by {strategy.author}</p>
        </div>
        <span className="bg-brand-500/10 text-brand-500 text-xs font-bold px-2 py-1 rounded border border-brand-500/20">
          {strategy.timeframe}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-950/50 p-2 rounded">
          <p className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1">
            <TrendingUp size={12} /> Win Rate
          </p>
          <p className="text-xl font-mono font-bold text-brand-400">{strategy.winRate}%</p>
        </div>
        <div className="bg-gray-950/50 p-2 rounded">
          <p className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1">
            <Activity size={12} /> Profit Factor
          </p>
          <p className="text-xl font-mono font-bold text-white">{strategy.profitFactor}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {strategy.indicators.slice(0, 3).map((ind, i) => (
          <span key={i} className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
            {ind}
          </span>
        ))}
        {strategy.indicators.length > 3 && (
          <span className="text-xs text-gray-500 px-1 py-1">+{strategy.indicators.length - 3} more</span>
        )}
      </div>
    </div>
  );
};

export default StrategyCard;


import React, { useState, useEffect } from 'react';
import { Strategy } from '../types';
import { analyzeStrategy, generateNewStrategyIdea, getCooldownStatus } from '../services/gemini';
import { Bot, Loader2, Sparkles, AlertCircle, Clock } from 'lucide-react';

interface AIAnalysisProps {
  strategy?: Strategy;
  mode: 'ANALYZE' | 'GENERATE';
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ strategy, mode }) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(getCooldownStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    let result = "";
    if (mode === 'ANALYZE' && strategy) {
      result = await analyzeStrategy(strategy);
    } else if (mode === 'GENERATE') {
      result = await generateNewStrategyIdea();
    }
    setContent(result);
    setLoading(false);
  };

  return (
    <div className="bg-gray-850 border border-gray-700 rounded-xl overflow-hidden mt-6">
      <div className="bg-gray-800/50 p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
          <Bot className="text-purple-400" />
          {mode === 'ANALYZE' ? 'Gemini AI Strategy Auditor' : 'Gemini Strategy Lab'}
        </h3>
        {!content && !loading && (
          <button 
            onClick={handleAction}
            disabled={cooldown > 0}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              cooldown > 0 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {cooldown > 0 ? (
              <>
                <Clock size={16} />
                Cooldown {cooldown}s
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {mode === 'ANALYZE' ? 'Audit This Strategy' : 'Generate New Strategy'}
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-6 min-h-[200px] flex items-center justify-center">
        {loading ? (
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4" />
            <p className="text-purple-300 animate-pulse">Consulting Gemini Neural Network...</p>
          </div>
        ) : content ? (
          <div className="w-full">
             <div className="prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed bg-gray-950/50 p-4 rounded-lg border border-gray-800">
                  {content}
                </pre>
             </div>
             <button 
              onClick={() => setContent(null)}
              className="mt-6 text-gray-400 hover:text-white text-sm underline transition-colors"
             >
               Clear Analysis
             </button>
          </div>
        ) : (
          <div className="text-center text-gray-500 max-w-md">
            {mode === 'ANALYZE' 
              ? <p>Click the button above to have Gemini AI analyze {strategy?.name}'s win rate, risk profile, and market viability.</p>
              : <p>Ask Gemini to invent a brand new, experimental high-win-rate scalping concept based on current market dynamics.</p>
            }
          </div>
        )}
      </div>
      
      <div className="bg-gray-900/50 p-3 flex items-start gap-2 text-xs text-gray-500 border-t border-gray-800">
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
        <p>AI-generated content is for educational purposes only. Global rate limits apply to shared API resources.</p>
      </div>
    </div>
  );
};

export default AIAnalysis;

import { Strategy } from '../types';

const generateEquityCurve = (winRate: number, trades: number, startEquity: number = 10000): { date: string; equity: number }[] => {
  let equity = startEquity;
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < trades; i++) {
    const date = new Date(now.getTime() - (trades - i) * 3600 * 1000); // Hourly intervals roughly
    const isWin = Math.random() * 100 < winRate;
    const change = isWin ? equity * 0.02 : -equity * 0.01; // 2:1 RR implied for simplicity or inverse for high winrate
    // High winrate scalping often has lower RR, e.g. 1:1 or 0.8:1
    // Let's adjust: 80% winrate usually means smaller wins, bigger losses or quick scalps.
    // Let's model 1% win, 1.5% loss but high frequency wins.
    const scalpWin = equity * 0.008;
    const scalpLoss = equity * 0.015;
    
    equity += isWin ? scalpWin : -scalpLoss;
    
    // Add some noise
    equity += (Math.random() - 0.5) * 50;

    data.push({
      date: date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0].substring(0,5),
      equity: Number(equity.toFixed(2))
    });
  }
  return data;
};

const strategiesList: Partial<Strategy>[] = [
  { name: "Order Block Sniper", author: "CryptoWizard_99", winRate: 88.5, indicators: ["Order Blocks", "RSI", "Volume"] },
  { name: "VWAP Reversion Scalp", author: "DeltaOne", winRate: 84.2, indicators: ["VWAP", "Bollinger Bands"] },
  { name: "Golden Pocket 1m", author: "FibMaster", winRate: 82.1, indicators: ["Fib Retracement", "Stochastic"] },
  { name: "EMA Cloud Breakout", author: "TrendSurfer", winRate: 81.5, indicators: ["EMA 9", "EMA 21", "EMA 50"] },
  { name: "Delta Divergence Trap", author: "FlowTrader", winRate: 89.2, indicators: ["CVD", "Open Interest", "Footprint"] },
  { name: "Asian Session Range", author: "TokyoDrift", winRate: 85.0, indicators: ["Session Range", "Liquidity Grabs"] },
  { name: "MacDivergence Pro", author: "OscillatorKing", winRate: 80.5, indicators: ["MACD", "RSI"] },
  { name: "Liquidity Sweep Reversal", author: "SmartMoneyConcept", winRate: 87.8, indicators: ["Fractals", "Volume Profile"] },
  { name: "Heikin Ashi Smoothed", author: "ZenTrader", winRate: 83.4, indicators: ["Heikin Ashi", "TMA"] },
  { name: "Momentum Box", author: "BoxTheory", winRate: 81.9, indicators: ["Darvas Box", "ADX"] },
  { name: "RSI 14/2 Cross", author: "MeanReverter", winRate: 86.1, indicators: ["RSI", "SMA"] },
  { name: "Ichimoku Cloud Edge", author: "CloudWalker", winRate: 82.7, indicators: ["Ichimoku Kinko Hyo"] },
  { name: "Bollinger Squeeze 1m", author: "VolHunter", winRate: 88.0, indicators: ["Bollinger Bands", "Keltner Channels"] },
  { name: "Parabolic SAR Trail", author: "StopHunter", winRate: 80.2, indicators: ["Parabolic SAR", "EMA 200"] },
  { name: "Volume Spread Analysis", author: "WyckoffDisciple", winRate: 85.5, indicators: ["Volume", "Spread"] },
  { name: "ATR Trailing Stop", author: "RiskManager", winRate: 81.0, indicators: ["ATR", "SuperTrend"] },
  { name: "Double Bottom Scalp", author: "PatternRecog", winRate: 83.2, indicators: ["Chart Patterns"] },
  { name: "CCI 100 Bounce", author: "ChannelSurfer", winRate: 84.8, indicators: ["CCI"] },
  { name: "Williams %R Overbought", author: "RangeTrader", winRate: 82.3, indicators: ["Williams %R"] },
  { name: "MFI Divergence", author: "MoneyFlow", winRate: 87.1, indicators: ["MFI", "VWAP"] },
  { name: "3-Bar Play", author: "PriceActionPure", winRate: 81.7, indicators: ["Candlestick Math"] },
  { name: "Gap Fill Strategy", author: "CME_Watcher", winRate: 89.5, indicators: ["Gaps", "Volume"] },
  { name: "Pivot Point Bounce", author: "FloorTrader", winRate: 83.9, indicators: ["Pivot Points Standard"] },
  { name: "Supply Demand Zones", author: "ZoneTrader", winRate: 86.4, indicators: ["Price Action"] },
  { name: "Gamma Scalp", author: "OptionsDesk", winRate: 88.8, indicators: ["Delta", "Gamma Exposure"] },
  { name: "Fair Value Gap", author: "ICT_Student", winRate: 85.2, indicators: ["FVG", "Imbalance"] },
  { name: "Session Open Break", author: "Ny_London", winRate: 80.8, indicators: ["Time"] },
  { name: "Turtle Soup", author: "OldSchool", winRate: 82.5, indicators: ["20 Day High/Low"] },
  { name: "Inside Bar Breakout", author: "VolatilityPlay", winRate: 84.0, indicators: ["Inside Bar"] },
  { name: "Correlation Arbitrage", author: "QuantFund", winRate: 91.2, indicators: ["ETH Correlation"] },
];

export const strategies: Strategy[] = strategiesList.map((s, i) => ({
  id: `strat-${i}`,
  name: s.name!,
  author: s.author!,
  winRate: s.winRate!,
  profitFactor: Number((1.5 + Math.random()).toFixed(2)),
  trades: Math.floor(Math.random() * 500) + 100,
  description: `A high-frequency scalping strategy focusing on ${s.indicators?.join(' and ')} to identify rapid price movements on the 1-minute timeframe. This strategy aims to capture small moves with high probability, utilizing tight stop losses and trailing profits based on volatility.`,
  timeframe: Math.random() > 0.5 ? "1m" : "5m",
  indicators: s.indicators!,
  equityCurve: generateEquityCurve(s.winRate!, 50),
  tags: ["Scalping", "Bitcoin", "High Winrate", ...s.indicators!]
})).sort((a, b) => b.winRate - a.winRate);

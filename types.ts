export interface Strategy {
  id: string;
  name: string;
  author: string; // "Pro Trader" name
  winRate: number; // Percentage
  profitFactor: number;
  trades: number;
  description: string;
  timeframe: string;
  indicators: string[];
  equityCurve: { date: string; equity: number }[];
  tags: string[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  STRATEGY_DETAIL = 'STRATEGY_DETAIL',
  LEADERBOARD = 'LEADERBOARD',
  AI_LAB = 'AI_LAB'
}

export interface GeminiAnalysisResponse {
  strengths: string[];
  weaknesses: string[];
  verdict: string;
  improvementTip: string;
}

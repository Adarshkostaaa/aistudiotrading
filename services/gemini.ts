import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Strategy } from '../types';

// Global state for rate management
let isGloballyThrottled = false;
let throttleExpiration = 0;
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 5000; 
const COOLDOWN_PERIOD = 65000;

let requestQueue = Promise.resolve();

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function managedApiCall<T>(fn: () => Promise<T>): Promise<T> {
  const currentRequest = requestQueue.then(async () => {
    const now = Date.now();
    if (isGloballyThrottled) {
      if (now < throttleExpiration) {
        const remaining = Math.ceil((throttleExpiration - now) / 1000);
        throw new Error(`COOLDOWN_ACTIVE:${remaining}`);
      } else {
        isGloballyThrottled = false;
      }
    }
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_REQUEST_GAP) {
      await delay(MIN_REQUEST_GAP - timeSinceLast);
    }
    try {
      const result = await fn();
      lastRequestTime = Date.now();
      return result;
    } catch (error: any) {
      const errStr = error.toString();
      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
        isGloballyThrottled = true;
        throttleExpiration = Date.now() + COOLDOWN_PERIOD;
      }
      throw error;
    }
  });
  requestQueue = currentRequest.then(() => {}).catch(() => {}); 
  return currentRequest;
}

export const getCooldownStatus = () => {
  if (!isGloballyThrottled) return 0;
  const remaining = Math.max(0, Math.ceil((throttleExpiration - Date.now()) / 1000));
  if (remaining === 0) isGloballyThrottled = false;
  return remaining;
};

export const analyzeStrategy = async (strategy: Strategy): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key missing.";
  const prompt = `Critique this BTC Scalping Strategy: ${strategy.name}. 
  Winrate: ${strategy.winRate}%. Indicators: ${strategy.indicators.join(', ')}.
  Provide logic breakdown, risks, and one advanced tip.`;
  try {
    const response = await managedApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
    }));
    return response.text || "Analysis unavailable.";
  } catch (error: any) {
    if (error.message?.startsWith("COOLDOWN_ACTIVE")) return `⚠️ System Cooling Down. Available in ${error.message.split(':')[1]}s.`;
    return "⚠️ Quota limited. Please wait a moment before re-auditing.";
  }
};

export const generateNewStrategyIdea = async (): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key missing.";
  try {
    const response = await managedApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: "Generate a unique 1m BTC scalping strategy concept based on volume delta and liquidity sweeps. Use Markdown."
    }));
    return response.text || "Generation failed.";
  } catch (error: any) {
    if (error.message?.startsWith("COOLDOWN_ACTIVE")) return `⚠️ System Cooling Down. Available in ${error.message.split(':')[1]}s.`;
    return "⚠️ API Busy. Strategy generation is currently throttled.";
  }
};

export const getLiveTradeSignal = async (strategy: Strategy, currentPrice: number, marketHistory: string): Promise<{ signal: string; confidence: string; reasoning: string; tp_percent: number; sl_percent: number; isRateLimited?: boolean }> => {
  const ai = getClient();
  if (!ai) return { signal: "ERROR", confidence: "LOW", reasoning: "API Key missing", tp_percent: 0.15, sl_percent: 0.1 };

  const prompt = `
  You are a High-Frequency Trading Algo. 
  Strategy: "${strategy.name}" using indicators: ${strategy.indicators.join(', ')}.
  Current Price: $${currentPrice}.
  Recent 1m Candles:
  ${marketHistory}
  
  TASK: Analyze for a 1m scalp entry.
  DECISION: SIGNAL: [BUY/SELL/HOLD].
  CONFIDENCE: [HIGH/MEDIUM/LOW].
  TP_PERCENT: [A recommended Take Profit percentage move from entry, e.g., 0.25].
  SL_PERCENT: [A recommended Stop Loss percentage move from entry, e.g., 0.15].
  REASON: Technical reason (max 10 words).
  `;

  try {
    const response = await managedApiCall<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
    }));
    
    const text = response.text || "";
    const signalMatch = text.match(/SIGNAL:\s*(BUY|SELL|HOLD)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);
    const tpMatch = text.match(/TP_PERCENT:\s*([\d.]+)/i);
    const slMatch = text.match(/SL_PERCENT:\s*([\d.]+)/i);
    const reasonMatch = text.match(/REASON:\s*(.*)/i);

    return {
      signal: signalMatch ? signalMatch[1].toUpperCase() : "HOLD",
      confidence: confidenceMatch ? confidenceMatch[1].toUpperCase() : "LOW",
      tp_percent: tpMatch ? parseFloat(tpMatch[1]) : 0.15,
      sl_percent: slMatch ? parseFloat(slMatch[1]) : 0.1,
      reasoning: reasonMatch ? reasonMatch[1] : "Monitoring..."
    };
  } catch (error: any) {
    return { 
      signal: "HOLD", 
      confidence: "LOW", 
      tp_percent: 0,
      sl_percent: 0,
      reasoning: error.message?.includes("COOLDOWN") ? "System Cooling Down..." : "API Quota Limit reached.",
      isRateLimited: true 
    };
  }
};
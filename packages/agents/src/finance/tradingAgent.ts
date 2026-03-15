import { z } from 'zod';
import type { Agent } from '@cheggie/shared';

export const TradingAgentConfigSchema = z.object({
  connector_id: z.string().uuid(),
  strategy: z.enum(['mean_reversion', 'momentum', 'arbitrage', 'custom']),
  symbols: z.array(z.string()).min(1),
  max_position_size_usd: z.number().positive(),
  risk_per_trade_pct: z.number().min(0.1).max(10),
  stop_loss_pct: z.number().min(0.1).max(50),
  take_profit_pct: z.number().min(0.1).max(200),
  max_daily_loss_usd: z.number().positive(),
  allowed_hours: z.object({ start: z.number().min(0).max(23), end: z.number().min(0).max(23) }).optional(),
  require_approval_for_live: z.boolean().default(true),
});

export type TradingAgentConfig = z.infer<typeof TradingAgentConfigSchema>;

export interface TradeSignal {
  symbol: string;
  direction: 'buy' | 'sell';
  quantity: number;
  price: number;
  order_type: 'market' | 'limit' | 'stop';
  confidence: number;
  rationale: string;
}

export interface TradingAgentTemplate {
  name: string;
  type: string;
  default_config: Partial<TradingAgentConfig>;
  model_policy: Agent['model_policy'];
  tool_allowlist: string[];
}

export const TRADING_AGENT_TEMPLATE: TradingAgentTemplate = {
  name: 'Trading Agent',
  type: 'trading',
  default_config: {
    strategy: 'momentum',
    symbols: [],
    max_position_size_usd: 1000,
    risk_per_trade_pct: 1,
    stop_loss_pct: 2,
    take_profit_pct: 4,
    max_daily_loss_usd: 500,
    require_approval_for_live: true,
  },
  model_policy: {
    allowed_models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022'],
    default_model: 'gpt-4o',
    max_tokens: 4096,
    temperature: 0.1,
    cost_limit_usd: 10,
  },
  tool_allowlist: [
    'get_market_data',
    'get_account_balance',
    'place_order',
    'cancel_order',
    'get_positions',
    'get_order_history',
  ],
};

export function validateTradingConfig(config: unknown): TradingAgentConfig {
  return TradingAgentConfigSchema.parse(config);
}

export function isWithinTradingHours(config: TradingAgentConfig): boolean {
  if (!config.allowed_hours) return true;
  const now = new Date();
  const currentHour = now.getUTCHours();
  const { start, end } = config.allowed_hours;
  if (start <= end) {
    return currentHour >= start && currentHour < end;
  }
  return currentHour >= start || currentHour < end;
}

export function calculatePositionSize(
  accountBalance: number,
  riskPct: number,
  stopLossPct: number,
  maxPositionSize: number
): number {
  const riskAmount = accountBalance * (riskPct / 100);
  const rawSize = riskAmount / (stopLossPct / 100);
  return Math.min(rawSize, maxPositionSize);
}

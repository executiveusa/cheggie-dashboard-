export type ConnectorType =
  | 'alpaca'
  | 'interactive_brokers'
  | 'td_ameritrade'
  | 'coinbase'
  | 'binance'
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'youtube'
  | 'custom';

export type ConnectorMode = 'paper' | 'live';
export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface Connector {
  id: string;
  tenant_id: string;
  type: ConnectorType;
  name: string;
  mode: ConnectorMode;
  status: ConnectorStatus;
  config_encrypted: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

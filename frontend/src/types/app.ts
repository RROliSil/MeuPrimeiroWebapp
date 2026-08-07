export interface AppItem {
  id: number;
  name: string;
  url: string;
  logo: string;
  position: number;
  created_at?: string;
}

export interface AppInput {
  name: string;
  url: string;
  logo: string;
}

export interface AppPingStatus {
  status: 'online' | 'offline' | 'checking';
  responseTimeMs?: number;
  statusCode?: number;
}


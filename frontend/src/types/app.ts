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

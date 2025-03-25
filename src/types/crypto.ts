export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h: number;
  price_change_percentage_5m?: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
  transaction_count_24h?: number;
  active_addresses_24h?: number;
  relative_volume?: number;
}

export interface FilterTemplate {
  id: string;
  name: string;
  description: string;
  filters: FilterSettings;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layouts: Record<string, ReactGridLayout.Layout[]>;
  createdAt: string;
  updatedAt: string;
}

export interface FilterSettings {
  minPrice: number;
  maxPrice: number;
  minPriceIncrease: number;
  maxPriceIncrease: number;
  minVolume24h: number;
  maxVolume24h: number;
  minPercentageChange24h: number;
  maxPercentageChange24h: number;
  minPercentageChange1h: number;
  maxPercentageChange1h: number;
  minMarketCap: number;
  maxMarketCap: number;
  minTransactionCount: number;
  maxTransactionCount: number;
  minActiveAddresses: number;
  maxActiveAddresses: number;
  minRelativeVolume: number;
  maxRelativeVolume: number;
  resultsLimit: number;
  sortBy: keyof CryptoStreamData;
  sortDirection: 'asc' | 'desc';
}

export interface ScannerFilters {
  minMarketCap: number;
  maxMarketCap: number;
  minPrice: number;
  maxPrice: number;
  minVolumeToMarketCapRatio: number;
  maxVolumeToMarketCapRatio: number;
}

export interface WebSocketMessage {
  TYPE: string;
  PRICE: number;
  VOLUME24HOUR: number;
  FROMSYMBOL: string;
  TOSYMBOL: string;
  CHANGEPCT24HOUR: number;
  CHANGEPCTHOUR: number;
  FLAGS: number;
  LASTUPDATE: number;
  MEDIAN: number;
  LASTVOLUME: number;
  LASTVOLUMETO: number;
  LASTTRADEID: string;
  VOLUMEDAY: number;
  VOLUMEDAYTO: number;
  VOLUME24HOURTO: number;
  OPENHOUR: number;
  HIGHHOUR: number;
  LOWHOUR: number;
  OPEN24HOUR: number;
  HIGH24HOUR: number;
  LOW24HOUR: number;
  MARKET_CAP?: number;
  TRANSACTION_COUNT?: number;
  ACTIVE_ADDRESSES?: number;
}

export interface CryptoStreamData {
  pair: string;
  price: number;
  volume24h: number;
  lastUpdated: string;
  percentageChange24h: number;
  percentageChange1h: number;
  high24h: number;
  marketCap?: number;
  transactionCount24h?: number;
  activeAddresses24h?: number;
  relativeVolume?: number;
}

export interface WebSocketAnalytics {
  totalPairs: number;
  activePairs: number;
  monitoredPairs: number;
  apiLimits: {
    maxRequestsPerSecond: number;
    maxPairsAllowed: number;
    currentPairsMonitored: number;
  };
  lastUpdate: string;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  coverage: {
    total: number;
    current: number;
    percentage: number;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
  categories: string[];
  relevance_score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  coins: Array<{
    id: string;
    symbol: string;
    name: string;
  }>;
}

export interface NewsAlert {
  id: string;
  coin_id: string;
  symbol: string;
  name: string;
  news_id: string;
  title: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance_score: number;
  alert_time: string;
  created_at: string;
}
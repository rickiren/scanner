import { createClient } from '@supabase/supabase-js';
import { CryptoData, WebSocketMessage, CryptoStreamData, WebSocketAnalytics } from '../types/crypto';
import axios from 'axios';

// const CRYPTOCOMPARE_API_KEY = '322919b00018508b939c84d3f96fc10c7eaee7c28968f4df5703e660ba5e8452';
const CRYPTOCOMPARE_API_KEY = '2977588d3e7fceb77049aee9daecee03c5e660a9964dd718db768af539e4b6df';
const CRYPTOCOMPARE_WS_URL = 'wss://streamer.cryptocompare.com/v2?api_key=';
const CRYPTOCOMPARE_REST_URL = 'https://min-api.cryptocompare.com/data/top/totalvolfull';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const HEARTBEAT_INTERVAL = 5000;
const CONNECTION_CHECK_INTERVAL = 10000;
const MIN_VOLUME_FOR_ALERT = 1000;
const MIN_PRICE_INCREASE = 1;
const MIN_RELATIVE_VOLUME = 1.01;
const API_RATE_LIMIT = 30;
const MAX_PAIRS = 1000;
const BATCH_SIZE = 25;
const CONNECTION_TIMEOUT = 15000;
const SUBSCRIPTION_RETRY_DELAY = 3000;
const MAX_SUBSCRIPTION_RETRIES = 5;
const SUBSCRIPTION_BATCH_DELAY = 1000;
const RECONNECT_BACKOFF_MULTIPLIER = 1.5;
const PRICE_HISTORY_LENGTH = 300;
const HIGH_EXPIRY_MS = 24 * 60 * 60 * 1000;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

interface HighData {
  price: number;
  timestamp: string;
  volume24h: number;
}

class CryptoWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private subscriptionRetryTimeout: NodeJS.Timeout | null = null;
  private lastMessageTime: number = Date.now();
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private streamData: Map<string, CryptoStreamData> = new Map();
  private topCoins: string[] = [];
  private priceHistory: Map<string, number[]> = new Map();
  private volumeHistory: Map<string, { time: number; volume: number }[]> = new Map();
  private dailyHighs: Map<string, HighData> = new Map();
  private lastAnalyticsUpdate: number = Date.now();
  private connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private activeSubscriptions: Set<string> = new Set();
  private pendingSubscriptions: string[][] = [];
  private subscriptionRetries = 0;
  private isInitializing = false;
  private connectionPromise: Promise<void> | null = null;
  private isReconnecting = false;
  private lastPriceUpdate: Map<string, number> = new Map();
  private subscriptionQueue: string[][] = [];
  private isProcessingQueue = false;

  constructor() {
    this.initializeTopCoins();
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    this.testSupabaseConnection();
  }

  private async processSubscriptionQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this.ensureConnection();
      }

      while (this.subscriptionQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
        const batch = this.subscriptionQueue.shift();
        if (!batch) continue;

        try {
          const subscribeMsg = {
            "action": "SubAdd",
            "subs": batch
          };

          this.ws?.send(JSON.stringify(subscribeMsg));
          batch.forEach(sub => this.activeSubscriptions.add(sub));
          console.log(`✅ Subscribed to ${batch.length} pairs`);

          await new Promise(resolve => setTimeout(resolve, SUBSCRIPTION_BATCH_DELAY));
        } catch (error) {
          console.error('Error processing subscription batch:', error);
          this.subscriptionQueue.push(batch);
          throw error;
        }
      }
    } catch (error) {
      console.error('Subscription queue processing error:', error);
      if (this.subscriptionRetries < MAX_SUBSCRIPTION_RETRIES) {
        this.subscriptionRetries++;
        await new Promise(resolve => setTimeout(resolve, SUBSCRIPTION_RETRY_DELAY * this.subscriptionRetries));
        await this.processSubscriptionQueue();
      } else {
        console.log('Max subscription retries reached, reconnecting...');
        this.subscriptionRetries = 0;
        await this.reconnect();
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private prepareBatches() {
    this.subscriptionQueue = [];
    const batchSize = Math.min(BATCH_SIZE, Math.floor(API_RATE_LIMIT / 2));
    
    for (let i = 0; i < this.topCoins.length; i += batchSize) {
      const batch = this.topCoins.slice(i, i + batchSize);
      this.subscriptionQueue.push(batch.map(coin => `5~CCCAGG~${coin}~USD`));
    }
  }

  private setupConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(() => {
      const now = Date.now();
      
      if (now - this.lastMessageTime > CONNECTION_CHECK_INTERVAL) {
        console.log('No recent messages, checking connection...');
        
        let staleSubscriptions = false;
        this.lastPriceUpdate.forEach((timestamp, symbol) => {
          if (now - timestamp > CONNECTION_CHECK_INTERVAL) {
            console.log(`Stale data for ${symbol}, last update: ${new Date(timestamp).toLocaleTimeString()}`);
            staleSubscriptions = true;
          }
        });

        if (staleSubscriptions || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.log('Connection appears stale, initiating reconnect...');
          this.cleanup();
          this.reconnect();
        }
      }
    }, CONNECTION_CHECK_INTERVAL);
  }

  private async testSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('high_of_day_alerts').select('*').limit(1);
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
      } else {
        console.log('✅ Supabase connection test successful');
      }

      const { data: priceData, error: priceError } = await supabase
        .from('price_history')
        .select('id')
        .limit(1);

      if (priceError) {
        console.error('❌ Price history table test failed:', priceError);
      } else {
        const count = await supabase
          .from('price_history')
          .select('*', { count: 'exact', head: true });
          
        console.log('✅ Price history table accessible, count:', count.count || 0);
      }
    } catch (error) {
      console.error('❌ Supabase connection test error:', error);
    }
  }

  private handleOnline() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Network connection restored, reconnecting...');
    this.reconnect();
  }

  private handleOffline() {
    console.log('Network connection lost, cleaning up...');
    this.cleanup();
  }

  private async initializeTopCoins() {
    if (this.isInitializing) {
      console.log('Already initializing, skipping...');
      return;
    }
    
    this.isInitializing = true;
    console.log('Starting coin initialization...');

    try {
      const batches = Math.ceil(MAX_PAIRS / BATCH_SIZE);
      const allCoins: string[] = [];

      for (let i = 0; i < batches; i++) {
        if (!navigator.onLine) {
          throw new Error('No network connection');
        }

        const response = await axios.get(`${CRYPTOCOMPARE_REST_URL}`, {
          params: {
            limit: BATCH_SIZE,
            page: i,
            tsym: 'USD',
            api_key: CRYPTOCOMPARE_API_KEY
          },
          timeout: 10000
        });
        if (response.data.Data && Object.keys(response.data.Data).length) {
          const batchCoins = response.data.Data
            .filter((coin: any) => coin.RAW?.USD && coin.DISPLAY?.USD)
            .map((coin: any) => coin.CoinInfo.Name);
          
          allCoins.push(...batchCoins);
          console.log(`Batch ${i + 1}/${batches}: Added ${batchCoins.length} coins`);

          response.data.Data.forEach((coin: any) => {
            const raw = coin.RAW?.USD;
            if (raw) {
              const streamData: CryptoStreamData = {
                pair: `${coin.CoinInfo.Name}/USD`,
                price: raw.PRICE || 0,
                volume24h: raw.VOLUME24HOUR || 0,
                lastUpdated: new Date().toISOString(),
                percentageChange24h: raw.CHANGEPCT24HOUR || 0,
                percentageChange1h: raw.CHANGEPCTHOUR || 0,
                high24h: raw.HIGH24HOUR || raw.PRICE
              };
              this.streamData.set(streamData.pair, streamData);
              this.priceHistory.set(coin.CoinInfo.Name, [raw.PRICE]);
              this.volumeHistory.set(coin.CoinInfo.Name, [{
                time: Date.now(),
                volume: raw.VOLUME24HOUR || 0
              }]);
              this.dailyHighs.set(coin.CoinInfo.Name, {
                price: raw.HIGH24HOUR || raw.PRICE,
                timestamp: new Date().toISOString(),
                volume24h: raw.VOLUME24HOUR || 0
              });
              this.lastPriceUpdate.set(coin.CoinInfo.Name, Date.now());
            }
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.topCoins = allCoins;
      console.log(`✅ Initialization complete: Monitoring ${this.topCoins.length} coins`);
      console.log(`📊 Active pairs: ${this.streamData.size}`);
      console.log(`📈 Daily highs tracked: ${this.dailyHighs.size}`);
      
      this.prepareBatches();
      await this.ensureConnection();

    } catch (error) {
      console.error('Failed to fetch top coins:', error);
      // setTimeout(() => this.initializeTopCoins(), 5000);
    } finally {
      this.isInitializing = false;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        await this.connect();
        resolve();
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private async connect(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('No network connection');
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting, waiting...');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.cleanup();
    console.log('Connecting to CryptoCompare WebSocket...');
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${CRYPTOCOMPARE_WS_URL}${CRYPTOCOMPARE_API_KEY}`);
        this.connectionStatus = 'connecting';

        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }

        this.connectionTimeout = setTimeout(() => {
          console.log('Connection timeout, cleaning up...');
          this.cleanup();
          reject(new Error('Connection timeout'));
        }, CONNECTION_TIMEOUT);

        this.ws.onopen = () => {
          console.log('WebSocket connected to CryptoCompare');
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.reconnectDelay = INITIAL_RECONNECT_DELAY;
          this.connectionStatus = 'connected';
          this.setupHeartbeat();
          this.subscriptionRetries = 0;
          this.isReconnecting = false;
          this.lastMessageTime = Date.now();
          try {
            this.ws?.send(JSON.stringify({
              action: "AuthenticationRequest",
              apiKey: CRYPTOCOMPARE_API_KEY
            }));
          } catch (error) {
            console.error('Failed to send authentication:', error);
          }
          
          setTimeout(() => {
            this.processSubscriptionQueue().catch(console.error);
          }, 1000);
          
          resolve();
        };

        this.ws.onmessage = async (event) => {
          try {
            this.lastMessageTime = Date.now();
            const message = JSON.parse(event.data);
            
            if (message.TYPE === '500' && message.MESSAGE === 'INVALID_API_KEY') {
              console.error('Invalid API key:', message);
              this.cleanup();
              reject(new Error('Invalid API key'));
            } else if (message.TYPE === '5') {
              await this.processMessage(message);
            } else if (message.TYPE === '500' || message.MESSAGE === 'INVALID_SUB') {
              console.error('Invalid subscription:', message);
              const invalidSub = message.PARAMETER || message.SUB;
              if (invalidSub) {
                this.activeSubscriptions.delete(invalidSub);
              }
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.cleanup();
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
          this.cleanup();
          
          reject(new Error('Connection closed'));
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.cleanup();
        reject(error);
      }
    });
  }

  private setupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (!navigator.onLine) {
        console.log('No network connection, skipping heartbeat');
        return;
      }

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not ready, skipping heartbeat');
        return;
      }

      try {
        this.ws.send(JSON.stringify({
          "action": "Heartbeat"
        }));
        console.log('❤️ Heartbeat sent');
      } catch (error) {
        console.error('Error sending heartbeat:', error);
        this.cleanup();
        this.reconnect();
      }
    }, HEARTBEAT_INTERVAL);
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.subscriptionRetryTimeout) {
      clearTimeout(this.subscriptionRetryTimeout);
      this.subscriptionRetryTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
    this.activeSubscriptions.clear();
  }

  private async reconnect() {
    if (this.isReconnecting) {
      console.log('Already reconnecting, skipping...');
      return;
    }

    this.isReconnecting = true;
    this.connectionStatus = 'reconnecting';

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
      
      const jitter = Math.random() * 1000;
      this.reconnectDelay = Math.min(
        (this.reconnectDelay * RECONNECT_BACKOFF_MULTIPLIER) + jitter,
        MAX_RECONNECT_DELAY
      );
      
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      this.reconnectAttempts++;

      try {
        await this.connect();
        this.isReconnecting = false;
        this.setupConnectionCheck();
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        setTimeout(() => this.reconnect(), 10000);
      }
    } else {
      console.error('Max reconnection attempts reached, reinitializing...');
      this.reconnectAttempts = 0;
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      this.isReconnecting = false;
      setTimeout(() => this.initializeTopCoins(), 5000);
    }
  }

  private async processMessage(message: WebSocketMessage) {
    if (!message.FROMSYMBOL || !message.PRICE) return;

    const symbol = message.FROMSYMBOL;
    const currentPrice = message.PRICE;
    const volume24h = message.VOLUME24HOUR || 0;
    const now = new Date();

    this.lastPriceUpdate.set(symbol, Date.now());

    const pair = `${symbol}/USD`;
    const existingData = this.streamData.get(pair) || {
      pair,
      price: 0,
      volume24h: 0,
      lastUpdated: new Date().toISOString(),
      percentageChange24h: 0,
      percentageChange1h: 0,
      high24h: 0
    };

    const currentHigh = Math.max(
      existingData.high24h,
      message.HIGH24HOUR || 0,
      currentPrice
    );

    const streamData: CryptoStreamData = {
      ...existingData,
      price: currentPrice,
      volume24h: volume24h,
      lastUpdated: new Date().toISOString(),
      percentageChange24h: message.CHANGEPCT24HOUR || existingData.percentageChange24h,
      percentageChange1h: message.CHANGEPCTHOUR || existingData.percentageChange1h,
      high24h: currentHigh
    };

    this.streamData.set(pair, streamData);

    await this.checkHighOfDay(symbol, currentPrice, volume24h);
    
    try {
      console.log(`Storing price history for ${symbol}: $${currentPrice} (Volume: $${volume24h})`);
      const { data, error } = await supabase
        .from('price_history')
        .insert({
          coin_id: symbol.toLowerCase(),
          price: currentPrice,
          volume_24h: volume24h,
          timestamp: now.toISOString()
        })
        .select();

      if (error) {
        console.error('Error storing price history:', error);
      } else {
        console.log('✅ Price history stored successfully:', data);
      }
    } catch (error) {
      console.error('Failed to store price history:', error);
    }

    const prices = this.priceHistory.get(symbol) || [];
    prices.push(currentPrice);
    if (prices.length > PRICE_HISTORY_LENGTH) prices.shift();
    this.priceHistory.set(symbol, prices);

    const volumes = this.volumeHistory.get(symbol) || [];
    volumes.push({
      time: Date.now(),
      volume: volume24h
    });
    if (volumes.length > 60) volumes.shift();
    this.volumeHistory.set(symbol, volumes);

    await this.checkRunningUp(symbol, currentPrice, volume24h);

    const cryptoData: Partial<CryptoData> = {
      symbol: symbol.toLowerCase(),
      current_price: currentPrice,
      market_cap: currentPrice * volume24h,
      total_volume: volume24h,
      price_change_percentage_24h: message.CHANGEPCT24HOUR || 0,
      price_change_percentage_1h: message.CHANGEPCTHOUR || 0,
      high_24h: message.HIGH24HOUR || currentPrice,
      last_updated: new Date().toISOString()
    };

    if (this.isTopGainerCoin(cryptoData)) {
      await this.updateTopGainersTable(cryptoData);
    }
  }

  private async checkHighOfDay(symbol: string, currentPrice: number, volume24h: number) {
    const now = new Date();
    console.log(`\n[HOD Check] ${symbol}`);
    console.log(`  Current Price: $${currentPrice.toFixed(8)}`);
    console.log(`  24h Volume: $${volume24h.toLocaleString()}`);
    
    const highData = this.dailyHighs.get(symbol);
    if (!highData) {
      console.log(`  First data point for ${symbol}`);
      this.dailyHighs.set(symbol, {
        price: currentPrice,
        timestamp: now.toISOString(),
        volume24h
      });
      return;
    }

    const highTime = new Date(highData.timestamp).getTime();
    if (now.getTime() - highTime > HIGH_EXPIRY_MS) {
      console.log(`  Previous high expired for ${symbol}`);
      this.dailyHighs.set(symbol, {
        price: currentPrice,
        timestamp: now.toISOString(),
        volume24h
      });
      return;
    }

    const { price: previousHigh } = highData;
    const percentageIncrease = ((currentPrice - previousHigh) / previousHigh) * 100;

    if (currentPrice > previousHigh * (1 + MIN_PRICE_INCREASE / 100) && volume24h >= MIN_VOLUME_FOR_ALERT) {
      console.log(`\n🚨 HIGH OF DAY ALERT: ${symbol}`);
      console.log(`  New High: $${currentPrice.toFixed(8)} (Previous: $${previousHigh.toFixed(8)})`);
      console.log(`  Increase: ${percentageIncrease.toFixed(2)}%`);
      console.log(`  Volume: $${volume24h.toLocaleString()}\n`);
      
      try {
        const { data, error } = await supabase
          .from('high_of_day_alerts')
          .insert({
            coin_id: symbol.toLowerCase(),
            symbol: symbol.toLowerCase(),
            name: symbol,
            current_price: currentPrice,
            previous_high: previousHigh,
            percentage_above_high: percentageIncrease,
            volume_24h: volume24h,
            market_cap: currentPrice * volume24h,
            alert_time: now.toISOString(),
            is_confirmed: true
          })
          .select();

        if (error) {
          console.error('❌ Failed to insert HOD alert:', error);
        } else {
          console.log('✅ HOD alert created successfully:', data);
          this.dailyHighs.set(symbol, {
            price: currentPrice,
            timestamp: now.toISOString(),
            volume24h
          });
        }
      } catch (error) {
        console.error('❌ Error creating HOD alert:', error);
      }
    }
  }

  private async checkRunningUp(symbol: string, currentPrice: number, volume24h: number) {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const { data: historyData, error: historyError } = await supabase
        .from('price_history')
        .select('price, timestamp')
        .eq('coin_id', symbol.toLowerCase())
        .lt('timestamp', tenMinutesAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(1);

      if (historyError) {
        console.error('Error fetching price history:', historyError);
        return;
      }

      if (!historyData || historyData.length === 0) {
        await supabase
          .from('price_history')
          .insert({
            coin_id: symbol.toLowerCase(),
            price: currentPrice,
            volume_24h: volume24h,
            timestamp: new Date().toISOString()
          });
        return;
      }

      const oldPrice = historyData[0].price;
      const priceChange = ((currentPrice - oldPrice) / oldPrice) * 100;

      if (priceChange >= 1) {
        console.log(`\n🚀 RUNNING UP ALERT: ${symbol}`);
        console.log(`  Price Change: +${priceChange.toFixed(2)}%`);
        console.log(`  Current: $${currentPrice.toFixed(8)}`);
        console.log(`  Previous: $${oldPrice.toFixed(8)}`);
        console.log(`  Volume: $${volume24h.toLocaleString()}\n`);

        const { error: alertError } = await supabase
          .from('price_alerts')
          .insert({
            coin_id: symbol.toLowerCase(),
            symbol: symbol.toLowerCase(),
            name: symbol,
            current_price: currentPrice,
            initial_price: oldPrice,
            price_change_percent: priceChange,
            volume_24h: volume24h,
            market_cap: currentPrice * volume24h,
            time_frame: '10m',
            alert_time: new Date().toISOString()
          });

        if (alertError) {
          console.error('Error creating price alert:', alertError);
        }
      }
    } catch (error) {
      console.error('Error in running up check:', error);
    }
  }

  private isTopGainerCoin(data: Partial<CryptoData>): boolean {
    if (!data.symbol || !data.current_price || !data.market_cap || !data.total_volume) {
      return false;
    }

    const volumeMarketCapRatio = data.total_volume / data.market_cap;

    return (
      data.price_change_percentage_24h! >= 7 &&
      data.total_volume >= 500000 &&
      volumeMarketCapRatio >= 0.01
    );
  }

  private async updateTopGainersTable(data: Partial<CryptoData>) {
    try {
      const prices = this.priceHistory.get(data.symbol?.toUpperCase() || '') || [];
      const rsi24h = this.calculateRSI(prices, 24);
      
      const volumeMarketCapRatio = data.total_volume! / data.market_cap!;

      const { error } = await supabase.from('top_gainer_coins').upsert({
        coin_id: data.symbol,
        symbol: data.symbol,
        name: data.symbol?.toUpperCase(),
        current_price: data.current_price,
        market_cap: data.market_cap,
        total_volume: data.total_volume,
        price_change_24h: data.price_change_percentage_24h,
        volume_market_cap_ratio: volumeMarketCapRatio,
        rsi_24h: rsi24h,
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error updating top gainers table:', error);
      }
    } catch (error) {
      console.error('Failed to update top gainers table:', error);
    }
  }

  private calculateRSI(prices: number[], periods: number = 14): number {
    if (prices.length < periods + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= periods; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    const avgGain = gains / periods;
    const avgLoss = losses / periods;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  public getStreamData(): CryptoStreamData[] {
    return Array.from(this.streamData.values())
      .sort((a, b) => b.volume24h - a.volume24h);
  }

  public getAnalytics(): WebSocketAnalytics {
    return {
      totalPairs: this.topCoins.length,
      activePairs: this.activeSubscriptions.size,
      monitoredPairs: this.dailyHighs.size,
      apiLimits: {
        maxRequestsPerSecond: API_RATE_LIMIT,
        maxPairsAllowed: MAX_PAIRS,
        currentPairsMonitored: this.activeSubscriptions.size
      },
      lastUpdate: new Date(this.lastMessageTime).toISOString(),
      connectionStatus: this.connectionStatus,
      coverage: {
        total: MAX_PAIRS,
        current: this.activeSubscriptions.size,
        percentage: (this.activeSubscriptions.size / MAX_PAIRS) * 100
      }
    };
  }
}

const cryptoWebSocket = new CryptoWebSocket();
export default cryptoWebSocket;

export { cryptoWebSocket }
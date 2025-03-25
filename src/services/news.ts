import axios from 'axios';
import { NewsItem } from '../types/crypto';
import { createClient } from '@supabase/supabase-js';

const COINGECKO_API_KEY = 'CG-your-api-key'; // Replace with your API key
const COINGECKO_NEWS_URL = 'https://pro-api.coingecko.com/api/v3/news';
const NEWS_REFRESH_INTERVAL = 60000; // 1 minute
const RELEVANCE_THRESHOLD = 0.7;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

class NewsService {
  private lastFetchTime: number = 0;
  private newsCache: Map<string, NewsItem> = new Map();
  private activeCoins: Set<string> = new Set();
  private isInitialized: boolean = false;
  private fetchPromise: Promise<void> | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      await this.setupNewsTable();
      this.startNewsPolling();
      this.isInitialized = true;
      console.log('✅ News service initialized');
    } catch (error) {
      console.error('Failed to initialize news service:', error);
    }
  }

  private async setupNewsTable() {
    try {
      const { error } = await supabase.from('news_alerts').select('id').limit(1);
      
      if (error) {
        console.error('News alerts table not accessible:', error);
        throw error;
      }
      
      console.log('✅ News alerts table accessible');
    } catch (error) {
      console.error('Failed to setup news table:', error);
      throw error;
    }
  }

  public updateActiveCoins(coins: string[]) {
    this.activeCoins = new Set(coins.map(coin => coin.toLowerCase()));
  }

  private async fetchNewsWithRetry(retries = MAX_RETRIES): Promise<NewsItem[]> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/news', {
        params: {
          per_page: 50
        },
        timeout: 10000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid news data format');
      }

      return response.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        published_at: new Date(item.published_at).toISOString(),
        source: item.source,
        categories: item.categories || [],
        relevance_score: this.calculateRelevanceScore(item),
        sentiment: this.analyzeSentiment(item.title + ' ' + (item.description || '')),
        coins: this.extractCoinsFromNews(item)
      }));
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('Rate limit hit, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        if (retries > 0) {
          return this.fetchNewsWithRetry(retries - 1);
        }
      }
      console.error('Failed to fetch news:', error);
      return [];
    }
  }

  private calculateRelevanceScore(newsItem: any): number {
    const titleWords = newsItem.title.split(' ').length;
    const descriptionWords = (newsItem.description || '').split(' ').length;
    const contentLength = titleWords + descriptionWords;
    
    // Base score from content length (0.1 to 0.4)
    let score = Math.min(0.4, contentLength / 500);
    
    // Add score for having a description (0.2)
    if (newsItem.description && newsItem.description.length > 100) {
      score += 0.2;
    }
    
    // Add score for recognized source (0.2)
    const reputableSources = ['coingecko', 'cointelegraph', 'coindesk', 'bloomberg', 'reuters'];
    if (reputableSources.some(source => newsItem.source.toLowerCase().includes(source))) {
      score += 0.2;
    }
    
    // Add score for having categories (0.2)
    if (newsItem.categories && newsItem.categories.length > 0) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private extractCoinsFromNews(newsItem: any): Array<{ id: string; symbol: string; name: string }> {
    const coins: Array<{ id: string; symbol: string; name: string }> = [];
    const text = `${newsItem.title} ${newsItem.description || ''} ${newsItem.categories?.join(' ') || ''}`.toLowerCase();

    // Extract mentioned coins
    this.activeCoins.forEach(coinId => {
      if (text.includes(coinId)) {
        coins.push({
          id: coinId,
          symbol: coinId,
          name: coinId.toUpperCase()
        });
      }
    });

    return coins;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = new Set([
      'bull', 'bullish', 'surge', 'soar', 'gain', 'rally', 'jump',
      'breakthrough', 'milestone', 'partnership', 'adoption', 'launch',
      'success', 'positive', 'growth', 'support', 'strong', 'boost',
      'upgrade', 'improve', 'win', 'achieve', 'advance', 'progress'
    ]);

    const negativeWords = new Set([
      'bear', 'bearish', 'crash', 'plunge', 'drop', 'fall', 'decline',
      'risk', 'warning', 'concern', 'issue', 'problem', 'hack', 'scam',
      'fraud', 'negative', 'weak', 'dump', 'sell-off', 'correction',
      'delay', 'suspend', 'halt', 'investigation', 'lawsuit', 'fine'
    ]);

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.has(word)) positiveCount++;
      if (negativeWords.has(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private async processNewsItem(news: NewsItem) {
    const relevantCoins = news.coins.filter(coin => 
      this.activeCoins.has(coin.id.toLowerCase())
    );

    if (relevantCoins.length === 0 || news.relevance_score < RELEVANCE_THRESHOLD) {
      return;
    }

    for (const coin of relevantCoins) {
      try {
        // Check if we already have this news alert
        const { data: existing } = await supabase
          .from('news_alerts')
          .select('id')
          .eq('news_id', news.id)
          .eq('coin_id', coin.id)
          .single();

        if (existing) {
          continue; // Skip if already exists
        }

        const { error } = await supabase
          .from('news_alerts')
          .insert({
            coin_id: coin.id.toLowerCase(),
            symbol: coin.symbol.toLowerCase(),
            name: coin.name,
            news_id: news.id,
            title: news.title,
            url: news.url,
            sentiment: news.sentiment,
            relevance_score: news.relevance_score,
            alert_time: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to create news alert:', error);
        } else {
          console.log(`✅ Created news alert for ${coin.symbol}: ${news.title}`);
        }
      } catch (error) {
        console.error(`Failed to process news for ${coin.symbol}:`, error);
      }
    }
  }

  private async startNewsPolling() {
    const pollNews = async () => {
      try {
        const now = Date.now();
        if (now - this.lastFetchTime < NEWS_REFRESH_INTERVAL) {
          return;
        }

        if (this.fetchPromise) {
          await this.fetchPromise;
          return;
        }

        this.fetchPromise = (async () => {
          console.log('📰 Fetching latest news...');
          const news = await this.fetchNewsWithRetry();
          console.log(`📰 Found ${news.length} news items`);
          
          for (const item of news) {
            if (!this.newsCache.has(item.id)) {
              this.newsCache.set(item.id, item);
              await this.processNewsItem(item);
            }
          }

          // Clean old cache entries
          const cacheExpiryTime = now - (24 * 60 * 60 * 1000); // 24 hours
          for (const [id, item] of this.newsCache.entries()) {
            if (new Date(item.published_at).getTime() < cacheExpiryTime) {
              this.newsCache.delete(id);
            }
          }

          this.lastFetchTime = now;
          this.fetchPromise = null;
        })();

        await this.fetchPromise;
      } catch (error) {
        console.error('News polling error:', error);
        this.fetchPromise = null;
      }
    };

    // Initial poll
    await pollNews();

    // Start polling interval
    setInterval(pollNews, NEWS_REFRESH_INTERVAL);
  }
}

const newsService = new NewsService();
export default newsService;
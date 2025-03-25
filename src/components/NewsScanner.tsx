import React from 'react';
import { useQuery } from 'react-query';
import { createClient } from '@supabase/supabase-js';
import { NewsAlert } from '../types/crypto';
import { Newspaper, AlertTriangle, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface NewsScannerProps {
  onSymbolSelect: (symbol: string) => void;
}

const NewsScanner: React.FC<NewsScannerProps> = ({ onSymbolSelect }) => {
  const { data: alerts, isLoading, error } = useQuery<NewsAlert[]>(
    'newsAlerts',
    async () => {
      const { data, error } = await supabase
        .from('news_alerts')
        .select('*')
        .order('alert_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    {
      refetchInterval: 10000,
      retry: 3
    }
  );

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
            <div className="h-6 bg-gray-700 rounded w-48"></div>
          </div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-400 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Connection Error</h2>
        </div>
        <p className="text-gray-400">Failed to fetch news alerts. Please check your connection.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold">Crypto News Scanner</h2>
      </div>
      
      <div className="space-y-4">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getSentimentIcon(alert.sentiment)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => onSymbolSelect(`${alert.symbol.toUpperCase()}USDT`)}
                      className="text-sm font-medium bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      {alert.symbol.toUpperCase()}
                    </button>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(alert.alert_time), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-medium mb-2">{alert.title}</h3>
                  <div className="flex items-center gap-2">
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      Read More
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-sm text-gray-400">
                      Relevance: {(alert.relevance_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent news alerts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsScanner;
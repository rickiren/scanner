import React from 'react';
import { useQuery } from 'react-query';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface PriceAlert {
  id: string;
  symbol: string;
  current_price: number;
  initial_price: number;
  price_change_percent: number;
  volume_24h: number;
  market_cap: number;
  time_frame: '5m' | '10m' | '1h';
  alert_time: string;
}

const RunningUpScanner: React.FC<{ onSymbolSelect: (symbol: string) => void }> = ({ onSymbolSelect }) => {
  const { data: alerts, isLoading, error } = useQuery<PriceAlert[]>(
    'priceAlerts',
    async () => {
      try {
        const { data, error } = await supabase
          .from('price_alerts')
          .select('*')
          .eq('time_frame', '10m')
          .order('alert_time', { ascending: false })
          .limit(30);

        if (error) {
          console.error('Error fetching price alerts:', error);
          throw new Error(error.message);
        }

        return data || [];
      } catch (error) {
        console.error('Failed to fetch price alerts:', error);
        throw error;
      }
    },
    {
      refetchInterval: 2000,
      staleTime: 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      onError: (err) => {
        console.error('Query error:', err);
      }
    }
  );

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
        <p className="text-gray-400">Failed to fetch price alerts. Please check your connection.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold">Running Up Scanner</h2>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>10m Window</span>
        </div>
      </div>
      
      <div className="scanner-table-container">
        <table className="scanner-table">
          <thead>
            <tr>
              <th className="text-right">Time</th>
              <th className="text-left">Symbol</th>
              <th className="text-right">Price</th>
              <th className="text-right">Volume</th>
              <th className="text-right">Market Cap</th>
              <th className="text-right">Vol/MCap</th>
              <th className="text-right">Change %</th>
              <th className="text-center">Strategy</th>
            </tr>
          </thead>
          <tbody>
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="cursor-pointer"
                  onClick={() => onSymbolSelect(`${alert.symbol.toUpperCase()}USDT`)}
                >
                  <td className="text-right text-gray-400">
                    {new Date(alert.alert_time).toLocaleTimeString()}
                  </td>
                  <td className="font-medium">{alert.symbol.toUpperCase()}</td>
                  <td className="text-right">
                    ${alert.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="text-right">
                    ${alert.volume_24h.toLocaleString()}
                  </td>
                  <td className="text-right market-cap-value">
                    ${alert.market_cap.toLocaleString()}
                  </td>
                  <td className="text-right">
                    {((alert.volume_24h / alert.market_cap) * 100).toFixed(2)}%
                  </td>
                  <td className="text-right text-green-400">
                    +{alert.price_change_percent.toFixed(2)}%
                  </td>
                  <td className="text-center">
                    <span className="strategy-badge surge">
                      <Clock className="w-3 h-3" />
                      10m Surge
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-400">
                  No price alerts detected
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RunningUpScanner;
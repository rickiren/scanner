import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface TradingViewWidgetProps {
  symbol: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol }) => {
  const container = useRef<HTMLDivElement>(null);
  const [containerId] = useState(`tradingview_${Math.random().toString(36).substring(7)}`);
  const widgetRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatSymbol = (rawSymbol: string): string => {
    let formatted = rawSymbol.replace(/USDT$/, '');
    formatted = formatted.replace(/\/(USD|USDT)$/, '');
    formatted = formatted.replace('/', '');
    if (!formatted.endsWith('USDT')) {
      formatted = `${formatted}USDT`;
    }
    return formatted;
  };

  const createWidget = (formattedSymbol: string) => {
    if (!container.current) return;

    if (widgetRef.current) {
      try {
        const existingWidget = document.getElementById(containerId);
        if (existingWidget && existingWidget.parentNode) {
          existingWidget.parentNode.removeChild(existingWidget);
        }
      } catch (e) {
        console.error('Error during widget cleanup:', e);
      }
      widgetRef.current = null;
    }

    const widgetContainer = document.createElement('div');
    widgetContainer.id = containerId;
    container.current.innerHTML = '';
    container.current.appendChild(widgetContainer);

    try {
      widgetRef.current = new window.TradingView.widget({
        width: '100%',
        height: '100%',
        symbol: formattedSymbol,
        interval: '5',
        timezone: 'exchange',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#131722',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerId,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        withdateranges: true,
        save_image: true,
        show_interval_dialog: true,
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        toolbar_height: 50,
        studies: [
          'MAExp@tv-basicstudies',  // 9 EMA
          'MAExp@tv-basicstudies',  // 50 EMA
          'MACD@tv-basicstudies',   // MACD
          'VWAP@tv-basicstudies'    // VWAP
        ],
        studies_overrides: {
          "MAExp@tv-basicstudies.length": 9,
          "MAExp@tv-basicstudies.linewidth": 2,
          "MAExp@tv-basicstudies.plottype": "line",
          "MAExp@tv-basicstudies.color": "#f7c148",
          "MAExp@tv-basicstudies.1.length": 50,
          "MAExp@tv-basicstudies.1.linewidth": 2,
          "MAExp@tv-basicstudies.1.plottype": "line",
          "MAExp@tv-basicstudies.1.color": "#4c9ffe"
        },
        time_frames: [
          { text: "1m", resolution: "1" },
          { text: "5m", resolution: "5" },
          { text: "15m", resolution: "15" },
          { text: "1h", resolution: "60" },
          { text: "1D", resolution: "D" }
        ],
        disabled_features: [
          'use_localstorage_for_settings',
          'header_symbol_search',
          'symbol_search_hot_key'
        ],
        enabled_features: [
          'header_widget',
          'header_toolbar_chart_type',
          'header_toolbar_intervals',
          'header_interval_dialog_button',
          'show_interval_dialog_on_key_press',
          'create_volume_indicator_by_default',
          'volume_force_overlay',
          'header_fullscreen_button'
        ],
        charts_storage_url: 'https://saveload.tradingview.com',
        client_id: 'tradingview.com',
        user_id: 'public_user',
        autosize: true,
        loading_screen: { backgroundColor: "#1e222d" },
        library_path: 'https://s3.tradingview.com/tv.js',
        custom_css_url: 'https://s3.tradingview.com/chart.css',
        overrides: {
          "mainSeriesProperties.candleStyle.upColor": "#089981",
          "mainSeriesProperties.candleStyle.downColor": "#f23645",
          "mainSeriesProperties.candleStyle.wickUpColor": "#089981",
          "mainSeriesProperties.candleStyle.wickDownColor": "#f23645",
          "mainSeriesProperties.candleStyle.borderUpColor": "#089981",
          "mainSeriesProperties.candleStyle.borderDownColor": "#f23645",
          "paneProperties.background": "#1e222d",
          "paneProperties.vertGridProperties.color": "#2a2e39",
          "paneProperties.horzGridProperties.color": "#2a2e39",
          "scalesProperties.textColor": "#b2b5be",
          "scalesProperties.lineColor": "#2a2e39",
          "symbolWatermarkProperties.color": "rgba(0, 0, 0, 0.00)"
        }
      });

      setError(null);
    } catch (e) {
      console.error('Error creating TradingView widget:', e);
      setError('Failed to load trading chart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    let isMounted = true;

    const loadWidget = () => {
      if (!isMounted || !container.current) return;
      
      setIsLoading(true);
      setError(null);
      
      const formattedSymbol = formatSymbol(symbol);
      createWidget(formattedSymbol);
    };

    if (!window.TradingView) {
      scriptElement = document.createElement('script');
      scriptElement.src = 'https://s3.tradingview.com/tv.js';
      scriptElement.async = true;
      scriptElement.onload = loadWidget;
      document.head.appendChild(scriptElement);
    } else {
      loadWidget();
    }

    return () => {
      isMounted = false;
      
      if (scriptElement && document.head.contains(scriptElement)) {
        document.head.removeChild(scriptElement);
      }

      if (container.current) {
        try {
          container.current.innerHTML = '';
        } catch (e) {
          console.error('Error cleaning up container:', e);
        }
      }

      widgetRef.current = null;
    };
  }, [symbol]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {symbol} Chart
        </h2>
      </div>
      <div className="relative flex-1 min-h-[500px] max-h-[800px]">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="mb-2">{error}</p>
              <p className="text-sm">Try searching for a different trading pair</p>
            </div>
          </div>
        ) : (
          <div 
            ref={container} 
            className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
            style={{
              aspectRatio: '16/9',
              maxWidth: '100%',
              margin: '0 auto'
            }}
          />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingViewWidget;
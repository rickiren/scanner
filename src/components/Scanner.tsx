import React, { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { createClient } from '@supabase/supabase-js';
import { CryptoStreamData, LayoutTemplate } from '../types/crypto';
import { ArrowUpCircle, TrendingUp, Zap, AlertCircle, AlertTriangle, Save, RotateCcw, Layout, Monitor, Newspaper, Maximize2, Minimize2, Plus, BookOpen, Edit, Trash2, X } from 'lucide-react';
import cryptoWebSocket from '../services/websocket';
import { MarketDataTable } from './MarketDataTable';
import TradingViewWidget from './TradingViewWidget';
import HighOfDayScanner from './HighOfDayScanner';
import RunningUpScanner from './RunningUpScanner';
import NewsScanner from './NewsScanner';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { LayoutTemplateModal } from './LayoutTemplateModal';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

const breakpoints = { xxl: 1600, xl: 1200, lg: 996, md: 768, sm: 480, xs: 0 };
const cols = { xxl: 24, xl: 24, lg: 12, md: 8, sm: 4, xs: 2 };

interface ChartWidget {
  id: string;
  symbol?: string;
}

interface ScannerWidget {
  id: string;
  type: string;
}

const generateDefaultLayouts = () => {
  const baseLayout = [
    { i: 'market-data', x: 0, y: 0, w: 16, h: 12, minW: 8, minH: 6, isResizable: true, isDraggable: true },
    { i: 'trading-view-1', x: 16, y: 0, w: 8, h: 16, minW: 6, minH: 8, isResizable: true, isDraggable: true },
    { i: 'running-up-1', x: 0, y: 12, w: 16, h: 8, minW: 8, minH: 6, isResizable: true, isDraggable: true },
    { i: 'high-of-day-1', x: 0, y: 20, w: 16, h: 8, minW: 6, minH: 6, isResizable: true, isDraggable: true },
    { i: 'news-scanner', x: 0, y: 28, w: 24, h: 8, minW: 8, minH: 6, isResizable: true, isDraggable: true }
  ];

  return {
    xxl: baseLayout.map(item => ({ ...item })),
    xl: baseLayout.map(item => ({
      ...item,
      w: Math.min(item.w, cols.xl),
      x: item.x % cols.xl
    })),
    lg: baseLayout.map(item => ({
      ...item,
      w: Math.min(Math.floor(item.w / 2), cols.lg),
      x: item.x % cols.lg
    })),
    md: baseLayout.map(item => ({
      ...item,
      w: Math.min(item.w, cols.md),
      x: 0
    })),
    sm: baseLayout.map(item => ({
      ...item,
      w: cols.sm,
      x: 0
    })),
    xs: baseLayout.map(item => ({
      ...item,
      w: cols.xs,
      x: 0
    }))
  };
};

interface ScannerProps {
  showTemplates: boolean;
  onShowTemplatesChange: (show: boolean) => void;
}

const Scanner: React.FC<ScannerProps> = ({ showTemplates, onShowTemplatesChange }) => {
  const [streamData, setStreamData] = useState<CryptoStreamData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [chartWidgets, setChartWidgets] = useState<ChartWidget[]>([
    { id: 'trading-view-1', symbol: 'BTCUSDT' }
  ]);
  const [scannerWidgets, setScannerWidgets] = useState<ScannerWidget[]>([
    { id: 'running-up-1', type: 'running-up' },
    { id: 'high-of-day-1', type: 'high-of-day' }
  ]);
  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('scannerLayouts');
      if (savedLayouts) {
        const parsed = JSON.parse(savedLayouts);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
      return generateDefaultLayouts();
    } catch (error) {
      console.error('Error loading layouts:', error);
      return generateDefaultLayouts();
    }
  });
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [maximizedWidget, setMaximizedWidget] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LayoutTemplate | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<LayoutTemplate | null>(null);

  const { data: templates = [], refetch: refetchTemplates } = useQuery<LayoutTemplate[]>(
    'layoutTemplates',
    async () => {
      const { data, error } = await supabase
        .from('layout_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  );

  const handleSymbolSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setChartWidgets(prev => prev.map(widget => ({ ...widget, symbol })));
  }, []);

  useEffect(() => {
    const handleAddChart = () => {
      addChartWidget();
    };

    window.addEventListener('addChart', handleAddChart);
    return () => window.removeEventListener('addChart', handleAddChart);
  }, []);

  useEffect(() => {
    const handleAddScanner = (event: CustomEvent<{ type: string }>) => {
      const type = event.detail.type;
      const count = scannerWidgets.filter(w => w.type === type).length + 1;
      const newId = `${type}-${count}`;
      
      setScannerWidgets(prev => [...prev, { id: newId, type }]);
      
      const updatedLayouts = { ...layouts };
      Object.keys(updatedLayouts).forEach(breakpoint => {
        const breakpointCols = cols[breakpoint as keyof typeof cols];
        const existingLayouts = updatedLayouts[breakpoint] || [];
        
        let maxY = 0;
        existingLayouts.forEach(layout => {
          const layoutBottom = layout.y + layout.h;
          maxY = Math.max(maxY, layoutBottom);
        });
        
        const newLayout = {
          i: newId,
          x: 0,
          y: maxY + 1,
          w: Math.min(16, breakpointCols),
          h: 8,
          minW: 6,
          minH: 6
        };
        
        updatedLayouts[breakpoint] = [...existingLayouts, newLayout];
      });
      
      setLayouts(updatedLayouts);
      localStorage.setItem('scannerLayouts', JSON.stringify(updatedLayouts));
    };

    window.addEventListener('addScanner', handleAddScanner as EventListener);
    return () => window.removeEventListener('addScanner', handleAddScanner as EventListener);
  }, [scannerWidgets, layouts]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      try {
        const data = cryptoWebSocket.getStreamData();
        setStreamData(data);
        setError(null);
      } catch (err) {
        console.error('Stream data error:', err);
        setError('Failed to update market data');
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const onLayoutChange = useCallback((currentLayout: ReactGridLayout.Layout[], allLayouts: any) => {
    if (!isDragging && !isResizing) {
      setLayouts(allLayouts);
      localStorage.setItem('scannerLayouts', JSON.stringify(allLayouts));
    }
  }, [isDragging, isResizing]);

  const onDragStart = useCallback((layouts: ReactGridLayout.Layout[], oldItem: ReactGridLayout.Layout, newItem: ReactGridLayout.Layout, placeholder: ReactGridLayout.Layout, event: MouseEvent, element: HTMLElement) => {
    setIsDragging(true);
  }, []);

  const onDragStop = useCallback((layouts: ReactGridLayout.Layout[], oldItem: ReactGridLayout.Layout, newItem: ReactGridLayout.Layout, placeholder: ReactGridLayout.Layout, event: MouseEvent, element: HTMLElement) => {
    setIsDragging(false);
    setLayouts(prevLayouts => {
      const updatedLayouts = {
        ...prevLayouts,
        [currentBreakpoint]: layouts
      };
      localStorage.setItem('scannerLayouts', JSON.stringify(updatedLayouts));
      return updatedLayouts;
    });
  }, [currentBreakpoint]);

  const onResizeStart = useCallback((layouts: ReactGridLayout.Layout[], oldItem: ReactGridLayout.Layout, newItem: ReactGridLayout.Layout, placeholder: ReactGridLayout.Layout, event: MouseEvent, element: HTMLElement) => {
    setIsResizing(true);
  }, []);

  const onResizeStop = useCallback((layouts: ReactGridLayout.Layout[], oldItem: ReactGridLayout.Layout, newItem: ReactGridLayout.Layout, placeholder: ReactGridLayout.Layout, event: MouseEvent, element: HTMLElement) => {
    setIsResizing(false);
    setLayouts(prevLayouts => {
      const updatedLayouts = {
        ...prevLayouts,
        [currentBreakpoint]: layouts
      };
      localStorage.setItem('scannerLayouts', JSON.stringify(updatedLayouts));
      return updatedLayouts;
    });
  }, [currentBreakpoint]);

  const onBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  const resetLayout = useCallback(() => {
    const defaultLayouts = generateDefaultLayouts();
    setLayouts(defaultLayouts);
    localStorage.setItem('scannerLayouts', JSON.stringify(defaultLayouts));
    setMaximizedWidget(null);
    setActiveTemplate(null);
    setChartWidgets([{ id: 'trading-view-1', symbol: 'BTCUSDT' }]);
  }, []);

  const toggleMaximize = (widgetId: string) => {
    if (maximizedWidget === widgetId) {
      setMaximizedWidget(null);
    } else {
      setMaximizedWidget(widgetId);
    }
  };

  const getWidgetStyle = (widgetId: string) => {
    if (maximizedWidget && maximizedWidget !== widgetId) {
      return { display: 'none' };
    }
    return {};
  };

  const addChartWidget = useCallback(() => {
    const newId = `trading-view-${chartWidgets.length + 1}`;
    const newWidget = { id: newId, symbol: selectedSymbol };
    
    setChartWidgets(prev => [...prev, newWidget]);
    
    const updatedLayouts = { ...layouts };
    Object.keys(updatedLayouts).forEach(breakpoint => {
      const breakpointCols = cols[breakpoint as keyof typeof cols];
      const existingLayouts = updatedLayouts[breakpoint] || [];
      
      let maxY = 0;
      existingLayouts.forEach(layout => {
        const layoutBottom = layout.y + layout.h;
        maxY = Math.max(maxY, layoutBottom);
      });
      
      const newLayout = {
        i: newId,
        x: 0,
        y: maxY + 1,
        w: Math.min(8, breakpointCols),
        h: 16,
        minW: 6,
        minH: 8
      };
      
      updatedLayouts[breakpoint] = [...existingLayouts, newLayout];
    });
    
    setLayouts(updatedLayouts);
    localStorage.setItem('scannerLayouts', JSON.stringify(updatedLayouts));
  }, [chartWidgets.length, selectedSymbol, layouts]);

  const removeWidget = (widgetId: string) => {
    if (widgetId.includes('running-up') || widgetId.includes('high-of-day')) {
      setScannerWidgets(prev => prev.filter(w => w.id !== widgetId));
    }
    else if (widgetId.includes('trading-view')) {
      setChartWidgets(prev => prev.filter(w => w.id !== widgetId));
    }
    
    const updatedLayouts = { ...layouts };
    Object.keys(updatedLayouts).forEach(breakpoint => {
      updatedLayouts[breakpoint] = updatedLayouts[breakpoint].filter(
        layout => layout.i !== widgetId
      );
    });
    setLayouts(updatedLayouts);
    localStorage.setItem('scannerLayouts', JSON.stringify(updatedLayouts));
  };

  const handleSaveTemplate = async (template: Omit<LayoutTemplate, 'id' | 'createdAt' | 'updatedAt'>, templateId?: string) => {
    try {
      if (templateId) {
        const { error } = await supabase
          .from('layout_templates')
          .update({
            name: template.name,
            description: template.description,
            layouts: template.layouts,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('layout_templates')
          .insert(template);

        if (error) throw error;
      }

      refetchTemplates();
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleLoadTemplate = (template: LayoutTemplate) => {
    const chartIds = new Set<string>();
    Object.values(template.layouts).forEach(layoutArray => {
      layoutArray.forEach(layout => {
        if (layout.i.startsWith('trading-view-')) {
          chartIds.add(layout.i);
        }
      });
    });

    const newChartWidgets = Array.from(chartIds).map(id => ({ id, symbol: selectedSymbol }));
    
    setChartWidgets(newChartWidgets);
    setLayouts(template.layouts);
    localStorage.setItem('scannerLayouts', JSON.stringify(template.layouts));
    setActiveTemplate(template);
    onShowTemplatesChange(false);
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  const handleEditTemplate = (template: LayoutTemplate, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const { error } = await supabase
        .from('layout_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      if (activeTemplate?.id === templateId) {
        setActiveTemplate(null);
      }
      
      refetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const renderWidget = (id: string, title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <div key={id} className="widget" style={getWidgetStyle(id)}>
      <div className="widget-header">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => removeWidget(id)}
            className="hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => toggleMaximize(id)}
            className="hover:text-blue-400 transition-colors"
          >
            {maximizedWidget === id ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <div className="widget-content">
        {content}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Crypto Scanner</h1>
          {activeTemplate && (
            <span className="bg-blue-500 text-sm px-3 py-1 rounded-full">
              {activeTemplate.name}
            </span>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 px-4 py-2 bg-red-400/10 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {showTemplates && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Layout Templates</h2>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors ${
                  activeTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleLoadTemplate(template)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{template.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleEditTemplate(template, e)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTemplate(template.id, e)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-400">{template.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="breakpoint-indicator">
        <Monitor className="w-4 h-4" />
        <span>{currentBreakpoint.toUpperCase()}</span>
      </div>
      
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={30}
        margin={[20, 20]}
        containerPadding={[20, 20]}
        isResizable={true}
        isDraggable={true}
        onLayoutChange={onLayoutChange}
        onBreakpointChange={onBreakpointChange}
        onDragStart={onDragStart}
        onDragStop={onDragStop}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        draggableHandle=".widget-header"
        resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
        useCSSTransforms={true}
        transformScale={1}
        preventCollision={false}
        compactType={null}
        verticalCompact={false}
        isBounded={false}
        autoSize={true}
        allowOverlap={false}
      >
        {renderWidget('market-data', 'Market Data', <Layout className="w-5 h-5" />, 
          <MarketDataTable 
            data={streamData} 
            title="Market Data" 
            onSymbolSelect={handleSymbolSelect}
          />
        )}

        {chartWidgets.map(widget => 
          renderWidget(widget.id, 'Chart', <TrendingUp className="w-5 h-5" />,
            <TradingViewWidget key={`${widget.id}-${widget.symbol}`} symbol={widget.symbol || selectedSymbol} />
          )
        )}

        {scannerWidgets.map(widget => {
          if (widget.type === 'running-up') {
            return renderWidget(widget.id, 'Running Up Scanner', <Zap className="w-5 h-5 text-yellow-400" />,
              <RunningUpScanner key={widget.id} onSymbolSelect={handleSymbolSelect} />
            );
          } else if (widget.type === 'high-of-day') {
            return renderWidget(widget.id, 'High of Day', <ArrowUpCircle className="w-5 h-5 text-green-400" />,
              <HighOfDayScanner key={widget.id} onSymbolSelect={handleSymbolSelect} />
            );
          }
          return null;
        })}

        {renderWidget('news-scanner', 'News Scanner', <Newspaper className="w-5 h-5 text-blue-400" />,
          <NewsScanner onSymbolSelect={handleSymbolSelect} />
        )}
      </ResponsiveGridLayout>

      <div className="layout-controls">
        <button
          onClick={resetLayout}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Layout
        </button>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowTemplateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Layout
        </button>
      </div>

      <LayoutTemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        currentLayouts={layouts}
        editTemplate={editingTemplate}
      />
    </div>
  );
};

export default Scanner;
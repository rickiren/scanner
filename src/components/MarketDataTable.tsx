import React, { useState, useMemo } from 'react';
import { CryptoStreamData, FilterTemplate, FilterSettings, NewsAlert } from '../types/crypto';
import { ArrowUpDown, RotateCcw, ExternalLink, Info, Save, BookOpen, Trash2, Check, Edit, Search, Newspaper } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { FilterTemplateModal } from './FilterTemplateModal';
import { useQuery } from 'react-query';
import { formatDistanceToNow } from 'date-fns';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface MarketDataTableProps {
  data: CryptoStreamData[];
  title: string;
  isSecondary?: boolean;
  onSymbolSelect: (symbol: string) => void;
}

type SortConfig = {
  key: keyof CryptoStreamData;
  direction: 'asc' | 'desc';
} | null;

const DEFAULT_FILTERS: FilterSettings = {
  minPrice: 0.000001,
  maxPrice: 100000,
  minPriceIncrease: -100,
  maxPriceIncrease: 1000,
  minVolume24h: 0,
  maxVolume24h: Number.MAX_SAFE_INTEGER,
  minPercentageChange24h: -100,
  maxPercentageChange24h: 1000,
  minPercentageChange1h: -100,
  maxPercentageChange1h: 1000,
  minMarketCap: 0,
  maxMarketCap: Number.MAX_SAFE_INTEGER,
  minTransactionCount: 0,
  maxTransactionCount: Number.MAX_SAFE_INTEGER,
  minActiveAddresses: 0,
  maxActiveAddresses: Number.MAX_SAFE_INTEGER,
  minRelativeVolume: 0,
  maxRelativeVolume: Number.MAX_SAFE_INTEGER,
  resultsLimit: 100,
  sortBy: 'volume24h',
  sortDirection: 'desc'
};

export const MarketDataTable: React.FC<MarketDataTableProps> = ({ 
  data, 
  title, 
  isSecondary = false, 
  onSymbolSelect 
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingChart, setLoadingChart] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<FilterTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<FilterTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templates = [], refetch: refetchTemplates } = useQuery<FilterTemplate[]>(
    'filterTemplates',
    async () => {
      const { data, error } = await supabase
        .from('filter_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      refetchInterval: 2000,
      staleTime: 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true
    }
  );

  const { data: newsAlerts = [] } = useQuery<NewsAlert[]>(
    'newsAlerts',
    async () => {
      const { data, error } = await supabase
        .from('news_alerts')
        .select('*')
        .order('alert_time', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      refetchInterval: 10000
    }
  );

  const newsAlertsBySymbol = useMemo(() => {
    const map = new Map<string, NewsAlert>();
    newsAlerts.forEach(alert => {
      map.set(alert.symbol.toLowerCase(), alert);
    });
    return map;
  }, [newsAlerts]);

  const getNewsIndicatorColor = (alertTime: string) => {
    const minutesAgo = (Date.now() - new Date(alertTime).getTime()) / (1000 * 60);
    if (minutesAgo < 15) return 'text-red-500';
    if (minutesAgo < 30) return 'text-orange-500';
    return 'text-yellow-500';
  };

  const handleSort = (key: keyof CryptoStreamData) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'desc' };
      }
      if (current.direction === 'desc') {
        return { key, direction: 'asc' };
      }
      return null;
    });
  };

  const handleFilterChange = (key: keyof FilterSettings, value: number | string) => {
    setFilters(prev => ({
      ...prev,
      [key]: typeof value === 'string' ? value : Number(value)
    }));
    setActiveTemplate(null);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setActiveTemplate(null);
    setSearchQuery('');
  };

  const handleSaveTemplate = async (template: Omit<FilterTemplate, 'id' | 'createdAt' | 'updatedAt'>, templateId?: string) => {
    try {
      if (templateId) {
        const { error } = await supabase
          .from('filter_templates')
          .update({
            name: template.name,
            description: template.description,
            filters: template.filters,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('filter_templates')
          .insert(template);

        if (error) throw error;
      }

      refetchTemplates();
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleLoadTemplate = (template: FilterTemplate) => {
    setFilters(template.filters);
    setActiveTemplate(template);
    setShowTemplates(false);
  };

  const handleEditTemplate = (template: FilterTemplate, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const { error } = await supabase
        .from('filter_templates')
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

  const handleSymbolClick = (pair: string) => {
    const symbol = pair.replace('/USD', 'USDT');
    setLoadingChart(pair);
    onSymbolSelect(symbol);
    setTimeout(() => setLoadingChart(null), 1000);
  };

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      processed = processed.filter(item => 
        item.pair.toLowerCase().includes(query)
      );
    }

    processed = processed.filter(item => {
      const meetsBasicCriteria = 
        item.price >= filters.minPrice &&
        item.price <= filters.maxPrice &&
        item.volume24h >= filters.minVolume24h &&
        item.volume24h <= filters.maxVolume24h &&
        item.percentageChange24h >= filters.minPercentageChange24h &&
        item.percentageChange24h <= filters.maxPercentageChange24h &&
        item.percentageChange1h >= filters.minPercentageChange1h &&
        item.percentageChange1h <= filters.maxPercentageChange1h;

      const meetsMarketCapCriteria = !item.marketCap || (
        item.marketCap >= filters.minMarketCap &&
        item.marketCap <= filters.maxMarketCap
      );

      const meetsTransactionCriteria = !item.transactionCount24h || (
        item.transactionCount24h >= filters.minTransactionCount &&
        item.transactionCount24h <= filters.maxTransactionCount
      );

      const meetsAddressCriteria = !item.activeAddresses24h || (
        item.activeAddresses24h >= filters.minActiveAddresses &&
        item.activeAddresses24h <= filters.maxActiveAddresses
      );

      const meetsRelativeVolumeCriteria = !item.relativeVolume || (
        item.relativeVolume >= filters.minRelativeVolume &&
        item.relativeVolume <= filters.maxRelativeVolume
      );

      return meetsBasicCriteria && 
             meetsMarketCapCriteria && 
             meetsTransactionCriteria && 
             meetsAddressCriteria && 
             meetsRelativeVolumeCriteria;
    });

    if (sortConfig) {
      processed.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        
        return sortConfig.direction === 'asc' 
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      });
    }

    return processed.slice(0, filters.resultsLimit);
  }, [data, sortConfig, filters, searchQuery]);

  const renderSortIcon = (key: keyof CryptoStreamData) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return (
      <ArrowUpDown 
        className={`w-4 h-4 ${sortConfig.direction === 'desc' ? 'text-blue-400' : 'text-blue-400 rotate-180'}`} 
      />
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            {activeTemplate && (
              <span className="bg-blue-500 text-sm px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                {activeTemplate.name}
              </span>
            )}
            <div className="relative">
              <Info 
                className="w-4 h-4 text-gray-400 cursor-help"
                onMouseEnter={() => setShowTooltip('info')}
                onMouseLeave={() => setShowTooltip(null)}
              />
              {showTooltip === 'info' && (
                <div className="absolute z-10 w-64 p-2 bg-gray-700 rounded shadow-lg text-xs">
                  Showing {filteredAndSortedData.length} of {data.length} available pairs
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trading pairs..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {showTemplates && (
          <div className="bg-gray-700 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold mb-4">Saved Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors relative ${
                    activeTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleLoadTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{template.name}</h4>
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
                  <p className="text-sm text-gray-400">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showFilters && (
          <div className="bg-gray-700 p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filter Settings</h3>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save as Template
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Price Range ($)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Price"
                  step="0.000001"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Price"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">24h Volume ($)</label>
                <input
                  type="number"
                  value={filters.minVolume24h}
                  onChange={(e) => handleFilterChange('minVolume24h', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Volume"
                />
                <input
                  type="number"
                  value={filters.maxVolume24h}
                  onChange={(e) => handleFilterChange('maxVolume24h', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Volume"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">24h Change (%)</label>
                <input
                  type="number"
                  value={filters.minPercentageChange24h}
                  onChange={(e) => handleFilterChange('minPercentageChange24h', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Change"
                />
                <input
                  type="number"
                  value={filters.maxPercentageChange24h}
                  onChange={(e) => handleFilterChange('maxPercentageChange24h', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Change"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">1h Change (%)</label>
                <input
                  type="number"
                  value={filters.minPercentageChange1h}
                  onChange={(e) => handleFilterChange('minPercentageChange1h', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Change"
                />
                <input
                  type="number"
                  value={filters.maxPercentageChange1h}
                  onChange={(e) => handleFilterChange('maxPercentageChange1h', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Change"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Market Cap ($)</label>
                <input
                  type="number"
                  value={filters.minMarketCap}
                  onChange={(e) => handleFilterChange('minMarketCap', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Market Cap"
                />
                <input
                  type="number"
                  value={filters.maxMarketCap}
                  onChange={(e) => handleFilterChange('maxMarketCap', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Market Cap"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">24h Transactions</label>
                <input
                  type="number"
                  value={filters.minTransactionCount}
                  onChange={(e) => handleFilterChange('minTransactionCount', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Transactions"
                />
                <input
                  type="number"
                  value={filters.maxTransactionCount}
                  onChange={(e) => handleFilterChange('maxTransactionCount', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Transactions"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Active Addresses (24h)</label>
                <input
                  type="number"
                  value={filters.minActiveAddresses}
                  onChange={(e) => handleFilterChange('minActiveAddresses', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Active Addresses"
                />
                <input
                  type="number"
                  value={filters.maxActiveAddresses}
                  onChange={(e) => handleFilterChange('maxActiveAddresses', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Active Addresses"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Relative Volume (x)</label>
                <input
                  type="number"
                  value={filters.minRelativeVolume}
                  onChange={(e) => handleFilterChange('minRelativeVolume', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Min Relative Volume"
                  step="0.1"
                />
                <input
                  type="number"
                  value={filters.maxRelativeVolume}
                  onChange={(e) => handleFilterChange('maxRelativeVolume', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Max Relative Volume"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Display Settings</label>
                <input
                  type="number"
                  value={filters.resultsLimit}
                  onChange={(e) => handleFilterChange('resultsLimit', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                  placeholder="Number of Results"
                  min="1"
                  max="1000"
                />
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full bg-gray-600 rounded px-3 py-2"
                >
                  <option value="volume24h">Sort by Volume</option>
                  <option value="price">Sort by Price</option>
                  <option value="percentageChange24h">Sort by 24h Change</option>
                  <option value="percentageChange1h">Sort by 1h Change</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Actions</label>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded transition-colors w-full"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-x-auto border border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors"
                      onClick={() => handleSort('pair')}
                    >
                      Trading Pair {renderSortIcon('pair')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors ml-auto"
                      onClick={() => handleSort('price')}
                    >
                      Price {renderSortIcon('price')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors ml-auto"
                      onClick={() => handleSort('volume24h')}
                    >
                      24h Volume {renderSortIcon('volume24h')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors ml-auto"
                      onClick={() => handleSort('percentageChange24h')}
                    >
                      24h Change {renderSortIcon('percentageChange24h')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors ml-auto"
                      onClick={() => handleSort('percentageChange1h')}
                    >
                      1h Change {renderSortIcon('percentageChange1h')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    <button
                      className="flex items-center gap-2 hover:text-white transition-colors ml-auto"
                      onClick={() => handleSort('lastUpdated')}
                    >
                      Last Updated {renderSortIcon('lastUpdated')}
                    </button>
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Chart
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredAndSortedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                      No coins match the current filters
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedData.map((item) => {
                    const newsAlert = newsAlertsBySymbol.get(item.pair.split('/')[0].toLowerCase());
                    return (
                      <tr key={item.pair} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSymbolClick(item.pair)}
                              className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                            >
                              {item.pair}
                              {loadingChart === item.pair ? (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ExternalLink className="w-4 h-4" />
                              )}
                            </button>
                            {newsAlert && (
                              <div className="relative group">
                                <Newspaper 
                                  className={`w-4 h-4 ${getNewsIndicatorColor(newsAlert.alert_time)}`}
                                />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 rounded-lg shadow-lg text-sm z-10">
                                  <div className="text-xs font-medium mb-1">
                                    {formatDistanceToNow(new Date(newsAlert.alert_time), { addSuffix: true })}
                                  </div>
                                  <div className="font-medium mb-1">{newsAlert.title}</div>
                                  <a 
                                    href={newsAlert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  >
                                    Read More
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          ${item.volume24h.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 text-right whitespace-nowrap ${item.percentageChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.percentageChange24h.toFixed(2)}%
                        </td>
                        <td className={`px-6 py-4 text-right whitespace-nowrap ${item.percentageChange1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.percentageChange1h.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-gray-400">
                          {new Date(item.lastUpdated).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleSymbolClick(item.pair)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded transition-colors inline-flex items-center gap-2"
                          >
                            View
                            {loadingChart === item.pair ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <FilterTemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        currentFilters={filters}
        editTemplate={editingTemplate}
      />
    </div>
  );
};

export default MarketDataTable;
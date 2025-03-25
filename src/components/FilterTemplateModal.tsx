import React, { useState, useEffect } from 'react';
import { FilterTemplate, FilterSettings } from '../types/crypto';
import { X, RotateCcw } from 'lucide-react';

interface FilterTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<FilterTemplate, 'id' | 'createdAt' | 'updatedAt'>, templateId?: string) => void;
  currentFilters: FilterSettings;
  editTemplate?: FilterTemplate;
}

export const FilterTemplateModal: React.FC<FilterTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentFilters,
  editTemplate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<FilterSettings>(currentFilters);

  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name);
      setDescription(editTemplate.description || '');
      setFilters(editTemplate.filters);
    } else {
      setName('');
      setDescription('');
      setFilters(currentFilters);
    }
  }, [editTemplate, currentFilters, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      filters
    }, editTemplate?.id);
    setName('');
    setDescription('');
    setFilters(currentFilters);
    onClose();
  };

  const handleFilterChange = (key: keyof FilterSettings, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const resetFilters = () => {
    setFilters(currentFilters);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editTemplate ? 'Edit Filter Template' : 'Save Filter Template'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                  placeholder="e.g., High Volume Gainers"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 h-24 resize-none"
                  placeholder="Describe what this filter template is designed to catch..."
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">Filter Parameters</h4>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Current
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Price Range ($)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Price"
                    step="0.000001"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Max Price"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">24h Volume ($)</label>
                  <input
                    type="number"
                    value={filters.minVolume24h}
                    onChange={(e) => handleFilterChange('minVolume24h', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Volume"
                  />
                  <input
                    type="number"
                    value={filters.maxVolume24h}
                    onChange={(e) => handleFilterChange('maxVolume24h', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Max Volume"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">24h Change (%)</label>
                  <input
                    type="number"
                    value={filters.minPercentageChange24h}
                    onChange={(e) => handleFilterChange('minPercentageChange24h', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Change"
                  />
                  <input
                    type="number"
                    value={filters.maxPercentageChange24h}
                    onChange={(e) => handleFilterChange('maxPercentageChange24h', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Max Change"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">1h Change (%)</label>
                  <input
                    type="number"
                    value={filters.minPercentageChange1h}
                    onChange={(e) => handleFilterChange('minPercentageChange1h', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Change"
                  />
                  <input
                    type="number"
                    value={filters.maxPercentageChange1h}
                    onChange={(e) => handleFilterChange('maxPercentageChange1h', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Max Change"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Market Cap ($)</label>
                  <input
                    type="number"
                    value={filters.minMarketCap}
                    onChange={(e) => handleFilterChange('minMarketCap', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Market Cap"
                  />
                  <input
                    type="number"
                    value={filters.maxMarketCap}
                    onChange={(e) => handleFilterChange('maxMarketCap', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Max Market Cap"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">24h Transactions</label>
                  <input
                    type="number"
                    value={filters.minTransactionCount}
                    onChange={(e) => handleFilterChange('minTransactionCount', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Transactions"
                  />
                  <input
                    type="number"
                    value={filters.maxTransactionCount}
                    onChange={(e) => handleFilterChange('maxTransactionCount', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Max Transactions"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Active Addresses (24h)</label>
                  <input
                    type="number"
                    value={filters.minActiveAddresses}
                    onChange={(e) => handleFilterChange('minActiveAddresses', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Active Addresses"
                  />
                  <input
                    type="number"
                    value={filters.maxActiveAddresses}
                    onChange={(e) => handleFilterChange('maxActiveAddresses', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Max Active Addresses"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Relative Volume (x)</label>
                  <input
                    type="number"
                    value={filters.minRelativeVolume}
                    onChange={(e) => handleFilterChange('minRelativeVolume', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Min Relative Volume"
                    step="0.1"
                  />
                  <input
                    type="number"
                    value={filters.maxRelativeVolume}
                    onChange={(e) => handleFilterChange('maxRelativeVolume', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
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
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Number of Results"
                    min="1"
                    max="1000"
                  />
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                  >
                    <option value="volume24h">Sort by Volume</option>
                    <option value="price">Sort by Price</option>
                    <option value="percentageChange24h">Sort by 24h Change</option>
                    <option value="percentageChange1h">Sort by 1h Change</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
              >
                {editTemplate ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
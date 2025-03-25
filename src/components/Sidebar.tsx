import React, { useState } from 'react';
import { BarChart2, Newspaper, LineChart, Layout, ChevronDown, Zap, ArrowUpCircle } from 'lucide-react';

interface SidebarProps {
  onAddChart: () => void;
  onToggleLayouts: () => void;
  onAddScanner: (type: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddChart, onToggleLayouts, onAddScanner }) => {
  const [showScanners, setShowScanners] = useState(false);

  return (
    <div className="fixed left-0 top-0 h-screen w-[250px] bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Crypto Scanner</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <div className="relative">
            <button 
              onClick={() => setShowScanners(!showScanners)}
              className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-5 h-5" />
                <span className="font-medium">Scanners</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showScanners ? 'rotate-180' : ''}`} />
            </button>
            
            {showScanners && (
              <div className="absolute top-full left-0 w-full mt-2 py-2 bg-gray-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => onAddScanner('running-up')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Running Up</span>
                </button>
                <button
                  onClick={() => onAddScanner('high-of-day')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  <ArrowUpCircle className="w-4 h-4 text-green-400" />
                  <span>High of Day</span>
                </button>
              </div>
            )}
          </div>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
            <Newspaper className="w-5 h-5" />
            <span className="font-medium">News</span>
          </button>

          <button 
            onClick={onAddChart}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LineChart className="w-5 h-5" />
            <span className="font-medium">Add Chart</span>
          </button>

          <button 
            onClick={onToggleLayouts}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Layout className="w-5 h-5" />
            <span className="font-medium">Layouts</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Scanner from './components/Scanner';
import Sidebar from './components/Sidebar';

const queryClient = new QueryClient();

function App() {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex">
        <Sidebar 
          onAddChart={() => {
            window.dispatchEvent(new CustomEvent('addChart'));
          }}
          onToggleLayouts={() => setShowTemplates(prev => !prev)}
          onAddScanner={(type) => {
            window.dispatchEvent(new CustomEvent('addScanner', { detail: { type } }));
          }}
        />
        <div className="flex-1 ml-[250px]">
          <Scanner showTemplates={showTemplates} onShowTemplatesChange={setShowTemplates} />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
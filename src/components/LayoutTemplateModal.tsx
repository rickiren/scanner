import React, { useState, useEffect } from 'react';
import { LayoutTemplate } from '../types/crypto';
import { X } from 'lucide-react';

interface LayoutTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<LayoutTemplate, 'id' | 'createdAt' | 'updatedAt'>, templateId?: string) => void;
  currentLayouts: Record<string, ReactGridLayout.Layout[]>;
  editTemplate?: LayoutTemplate;
}

export const LayoutTemplateModal: React.FC<LayoutTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentLayouts,
  editTemplate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name);
      setDescription(editTemplate.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [editTemplate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      layouts: currentLayouts
    }, editTemplate?.id);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editTemplate ? 'Edit Layout Template' : 'Save Layout Template'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
                placeholder="e.g., Trading Layout"
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
                placeholder="Describe this layout configuration..."
              />
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
        </form>
      </div>
    </div>
  );
};
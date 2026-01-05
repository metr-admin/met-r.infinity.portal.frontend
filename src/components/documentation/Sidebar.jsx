import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { processDocumentHierarchy } from '../../utils/hierarchyProcessor';

const Sidebar = ({ allDocs, hierarchicalDocs, currentDoc, onDocSelect, sidebarOpen, setSidebarOpen }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Use passed hierarchical structure or process if not provided
  const processedHierarchicalDocs = useMemo(() => {
    return hierarchicalDocs || processDocumentHierarchy(allDocs);
  }, [hierarchicalDocs, allDocs]);

  // Auto-expand first category on load
  useEffect(() => {
    if (processedHierarchicalDocs.length > 0) {
      const firstCategory = processedHierarchicalDocs.find(item => item.type === 'category');
      if (firstCategory) {
        setExpandedItems(new Set([firstCategory.id]));
      }
    }
  }, [processedHierarchicalDocs]);

  const handleDocSelect = (docId, anchor = null) => {
    if (docId) {
      onDocSelect(docId, anchor);
      setSidebarOpen(false);
    }
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderNavItem = (item, level = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = currentDoc?.id === item.docId;
    const maxLevel = 4;
    const effectiveLevel = Math.min(level, maxLevel);
    
    // Check if this is a section (child with anchor)
    const isSection = item.type === 'section' && item.anchor;

    if (item.type === 'category') {
      return (
        <div key={item.id} className="overflow-hidden">
          <button
            onClick={() => toggleExpanded(item.id)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            <svg 
              className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="truncate">{item.title}</span>
          </button>
          {isExpanded && hasChildren && (
            <div className="ml-2 mt-1 space-y-0.5 border-l border-gray-200 pl-3 overflow-hidden">
              {item.children.map(child => renderNavItem(child, effectiveLevel + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id} className="overflow-hidden">
        <div className="flex items-center w-full group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (item.docId) {
                handleDocSelect(item.docId, item.anchor);
              }
            }}
            className={`flex items-center gap-2 flex-1 px-3 py-2 text-sm font-medium transition-colors duration-150 min-w-0 ${
              isActive 
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            } ${hasChildren ? 'rounded-l-md' : 'rounded-md'}`}
          >
            {isSection ? (
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            ) : (
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span className="flex-1 text-left break-words line-clamp-2">
              {item.displayTitle || item.title}
            </span>
          </button>
          
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className={`px-2 py-2 flex-shrink-0 rounded-r-md transition-colors duration-150 group-hover:bg-gray-50 ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-3 overflow-hidden">
            {item.children.map(child => renderNavItem(child, effectiveLevel + 1))}
          </div>
        )}
      </div>
    );
  };
  if (!allDocs || allDocs.length === 0) {
    return (
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-72 bg-white border-r border-gray-200 h-screen overflow-y-auto
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 lg:block">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Documentation</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-500">No documents available</div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-72 bg-white border-r border-gray-200 h-screen transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Documentation</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <nav className="space-y-1">
              {processedHierarchicalDocs.map(item => renderNavItem(item))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
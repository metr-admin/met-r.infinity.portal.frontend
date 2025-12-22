import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ModuleIsolatedNavItem = ({ item, onDocSelect, currentDocId, selectedItems, onSelectionChange, moduleId, level = 0 }) => {
  const itemKey = `${moduleId}-${item.id}`;
  const isOpen = selectedItems[itemKey] || false;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentDocId === item.docId;

  const handleClick = () => {
    console.log(`🔄 Module ${moduleId}: Clicked "${item.title}"`);
    console.log(`   - docId: ${item.docId}`);
    console.log(`   - hasChildren: ${hasChildren} (${item.children?.length || 0} children)`);
    console.log(`   - isOpen: ${isOpen}`);
    
    // Always toggle dropdown if has children
    if (hasChildren) {
      console.log(`🔄 Toggling dropdown: ${itemKey} from ${isOpen} to ${!isOpen}`);
      onSelectionChange(itemKey, !isOpen);
    }
    
    // Module-specific selection behavior
    const isSpaceModule = moduleId.toLowerCase().includes('space');
    const isMindModule = moduleId.toLowerCase().includes('mind');
    
    if (item.docId && typeof item.docId === 'number') {
      if (isSpaceModule && hasChildren) {
        // Space module: Parent selection loads document (sections in one page)
        console.log(`📤 Space module: Selecting parent document ${item.docId}`);
        onDocSelect(item.docId, item.anchor);
      } else if (isMindModule && hasChildren) {
        // Mind module: Parent with children only toggles dropdown (individual pages)
        console.log(`📁 Mind module: Parent "${item.title}" - dropdown only`);
        // Don't select document, just toggle dropdown
      } else {
        // Leaf items always select document
        console.log(`📤 Module ${moduleId}: Selecting document ${item.docId}`);
        onDocSelect(item.docId, item.anchor);
      }
    } else if (!hasChildren) {
      console.log(`⚠️ Module ${moduleId}: No docId for "${item.title}"`);
    }
  };

  const getIndentClass = (level) => {
    switch(level) {
      case 1: return 'ml-4';
      case 2: return 'ml-8';
      case 3: return 'ml-12';
      default: return level > 3 ? 'ml-16' : '';
    }
  };
  
  const indentClass = getIndentClass(level);

  return (
    <div className="mb-1">
      <button
        onClick={handleClick}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${indentClass} ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {hasChildren && (
          <motion.svg
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>
        )}
        {!hasChildren && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span className="flex-1 text-left">{item.title}</span>
        {/* Debug info */}
        <span className="text-xs text-gray-400">
          {hasChildren ? `[${item.children.length}]` : ''} {isOpen ? 'OPEN' : 'CLOSED'}
          {item.docId ? ` ID:${item.docId}` : ''}
        </span>
      </button>

      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1">
              {item.children.map((child) => (
                <ModuleIsolatedNavItem
                  key={child.id}
                  item={child}
                  onDocSelect={onDocSelect}
                  currentDocId={currentDocId}
                  selectedItems={selectedItems}
                  onSelectionChange={onSelectionChange}
                  moduleId={moduleId}
                  level={level + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModuleIsolatedSidebar = ({ 
  allDocs, 
  currentDoc, 
  onDocSelect, 
  sidebarOpen, 
  setSidebarOpen, 
  navigationStructure,
  navLoading,
  branchName 
}) => {
  // Create isolated state for each module based on branchName
  const moduleId = useMemo(() => branchName || 'default', [branchName]);
  const [moduleSelections, setModuleSelections] = useState({});

  // Reset selections when module changes - all items start collapsed
  useEffect(() => {
    console.log(`🔄 Module changed to: ${moduleId}, resetting selections`);
    setModuleSelections({}); // Empty object means all items are collapsed
  }, [moduleId]);

  const handleSelectionChange = (itemKey, isOpen) => {
    console.log(`🔄 Toggle ${itemKey}: ${isOpen}`);
    setModuleSelections(prev => ({
      ...prev,
      [itemKey]: isOpen
    }));
  };

  const handleDocSelect = (docId, anchor) => {
    console.log(`📤 Module ${moduleId}: handleDocSelect called with docId:`, docId);
    onDocSelect(docId, anchor);
    setSidebarOpen(false);
  };

  const hasNavigationStructure = navigationStructure && navigationStructure.length > 0;

  if (!allDocs || allDocs.length === 0) {
    return (
      <>
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

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-72 bg-white border-r border-gray-200 h-screen overflow-y-auto transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 lg:block">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {moduleId} Documentation
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="space-y-1">
            <div className="text-xs text-gray-400 px-3 py-1 border-b border-gray-100 mb-2">
              Module: {moduleId} | Docs: {allDocs.length} | Nav: {navigationStructure?.length || 0}
            </div>
            
            {navLoading ? (
              <div className="text-sm text-gray-500 px-3 py-2">Loading navigation...</div>
            ) : hasNavigationStructure ? (
              <>
                <div className="text-xs text-green-600 px-3 py-1 mb-2">
                  Hierarchical Navigation ({moduleId})
                </div>
                {navigationStructure.map((item) => {
                  console.log('📁 Rendering nav item:', item.title, 'docId:', item.docId, 'children:', item.children?.length);
                  return (
                    <ModuleIsolatedNavItem
                      key={item.id}
                      item={item}
                      onDocSelect={handleDocSelect}
                      currentDocId={currentDoc?.id}
                      selectedItems={moduleSelections}
                      onSelectionChange={handleSelectionChange}
                      moduleId={moduleId}
                    />
                  );
                })}
              </>
            ) : (
              <>
                <div className="text-xs text-orange-600 px-3 py-1 mb-2">Fallback document list</div>
                {allDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocSelect(doc.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      currentDoc?.id === doc.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="flex-1 text-left">
                      {doc.attributes?.htmlTitle || doc.attributes?.title || `Document ${doc.id}`}
                    </span>
                  </button>
                ))}
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default ModuleIsolatedSidebar;
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HierarchicalNavItem = ({ item, onDocSelect, currentDocId, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentDocId === item.docId;
  
  // Check if this is a child item that belongs to the same document as its parent
  const isChildOfSameDoc = level > 0 && item.docId === currentDocId && item.anchor;
  
  // For Space/Soul modules only, child items should not be clickable
  const isSpaceSoulChild = (level > 0 && item.anchor && item.docId === currentDocId) || 
                          (item.type === 'section' && level > 0);
  
  // Determine if item should be clickable
  const isClickable = hasChildren || (item.docId && typeof item.docId === 'number' && !isSpaceSoulChild);

  const handleClick = () => {
    if (isSpaceSoulChild) {
      return;
    }
    
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    
    if (isClickable && item.docId && typeof item.docId === 'number') {
      onDocSelect(item.docId, item.anchor);
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
        disabled={isSpaceSoulChild}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${indentClass} ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : isSpaceSoulChild
            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer'
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
        {!hasChildren && !isSpaceSoulChild && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {isSpaceSoulChild && (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="flex-1 text-left">{item.title}</span>
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
                <HierarchicalNavItem
                  key={child.id}
                  item={child}
                  onDocSelect={onDocSelect}
                  currentDocId={currentDocId}
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

export default HierarchicalNavItem;
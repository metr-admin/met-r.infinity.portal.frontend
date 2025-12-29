import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchResults = ({ results, isVisible, onResultClick, onClose, highlightSearchTerm, searchQuery, isSearching }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
      >
        <div className="p-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => onResultClick(result.doc)}
                  className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    <span 
                      dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(result.title, searchQuery) 
                      }} 
                    />
                  </div>
                  
                  {result.contexts.slice(0, 2).map((context, contextIndex) => (
                    <div key={contextIndex} className="text-xs text-gray-600 mb-1">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-2 capitalize">
                        {context.type}
                      </span>
                      <span 
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(
                            context.text.length > 80 
                              ? context.text.substring(0, 80) + '...' 
                              : context.text, 
                            searchQuery
                          ) 
                        }} 
                      />
                    </div>
                  ))}
                </button>
              ))}
              
              {results.length > 5 && (
                <div className="text-xs text-gray-500 text-center py-2 border-t border-gray-100">
                  Showing first 5 results
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchResults;
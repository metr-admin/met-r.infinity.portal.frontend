import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '../../context/SearchContext';
import SearchResults from './SearchResults';

const MobileSearchModal = ({ isOpen, onClose, allDocs, onDocSelect, domain, openChat }) => {
  const { searchQuery, setSearchQuery, searchResults, isSearching, searchDocuments, clearSearch, highlightSearchTerm } = useSearch();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      searchDocuments(query, allDocs);
      setShowSearchResults(true);
    } else {
      clearSearch();
      setShowSearchResults(false);
    }
  };

  // Handle search result selection
  const handleSearchResultClick = (doc) => {
    if (onDocSelect) {
      onDocSelect(doc.id);
    }
    clearSearch();
    setShowSearchResults(false);
    onClose();
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && searchResults.length > 0) {
      handleSearchResultClick(searchResults[0].doc);
    }
  };

  // Handle AI search
  const handleAISearch = () => {
    openChat(domain);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Search Documentation</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Form */}
          <div className="p-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center border border-gray-200 rounded-lg bg-white hover:border-blue-500 transition-colors">
                <div className="pl-4 pr-2">
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <svg fill="none" viewBox="0 0 16 16" className="w-4 h-4">
                      <path d="M14 14L11.1067 11.1067" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="7.33333" cy="7.33333" r="5.33333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search documentation..."
                  className="flex-1 h-12 bg-transparent border-none outline-none text-sm placeholder-gray-500 pr-2"
                />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSearch();
                      setShowSearchResults(false);
                    }}
                    className="px-2 py-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* AI Search Button */}
            <button
              onClick={handleAISearch}
              className="w-full mt-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Try AI Search Instead
            </button>
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="max-h-64 overflow-y-auto border-t border-gray-200">
              <div className="p-2">
                <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </div>
                
                {searchResults.slice(0, 5).map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultClick(result.doc)}
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      <span 
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(result.title, searchQuery) 
                        }} 
                      />
                    </div>
                    
                    {result.contexts.slice(0, 1).map((context, contextIndex) => (
                      <div key={contextIndex} className="text-xs text-gray-600">
                        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-2 capitalize">
                          {context.type}
                        </span>
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(
                              context.text.length > 60 
                                ? context.text.substring(0, 60) + '...' 
                                : context.text, 
                              searchQuery
                            ) 
                          }} 
                        />
                      </div>
                    ))}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && !showSearchResults && searchResults.length === 0 && (
            <div className="p-4 border-t border-gray-200 text-center text-gray-500">
              <p className="text-sm">No results found for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try different keywords or use AI search</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileSearchModal;
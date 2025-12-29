import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../../assets/images/Logo.png';
import aiSearchIcon from '../../assets/svg/ai search.png';
import { formatBranchName } from '../../utils/formatBranchName';
import { useApp } from '../../context/AppContext';
import { useSearch } from '../../context/SearchContext';
import SearchResults from './SearchResults';
import MobileSearchModal from './MobileSearchModal';

const Header = ({ currentDoc, sidebarOpen, setSidebarOpen, allDocs, onDocSelect }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { openChat, repositories } = useApp();
  const { searchQuery, setSearchQuery, searchResults, isSearching, searchDocuments, clearSearch, highlightSearchTerm } = useSearch();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const modules = repositories;
  const currentBranch = currentDoc?.attributes?.branch;
  const domain = formatBranchName(currentBranch)?.toLowerCase() || 'general';

  const handleModuleChange = (branchName) => {
    navigate(`/documentation/${branchName}`);
    setShowDropdown(false);
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = searchDocuments(query, allDocs);
      setShowSearchResults(results.length > 0);
    } else {
      setShowSearchResults(false);
    }
  };

  // Handle search result selection
  const handleSearchResultClick = (doc) => {
    if (onDocSelect) {
      onDocSelect(doc.id);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  // Handle click outside search to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (window.innerWidth >= 640) { // sm breakpoint
          searchInputRef.current?.focus();
        } else {
          setShowMobileSearch(true);
        }
      }
      
      // Escape to close search results
      if (event.key === 'Escape') {
        setShowSearchResults(false);
        setShowMobileSearch(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && searchResults.length > 0) {
      handleSearchResultClick(searchResults[0].doc);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile hamburger menu */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="MetR Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <span className="font-bold text-lg sm:text-2xl text-neutral-950 truncate">
              {formatBranchName(currentBranch) || 'MetR Infinity'}
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-[#364153] hover:text-[#266EF6] transition-colors">Home</Link>
            <a href="#" className="text-[#364153] hover:text-[#266EF6] transition-colors">Contact</a>
          </nav>
        </div>

        {/* Modules dropdown - visible on all screen sizes */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-[#364153] hover:text-[#266EF6] transition-colors flex items-center gap-1 p-2"
          >
            <span className="hidden sm:inline">Modules</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => handleModuleChange(module.attributes?.branch)}
                    className="w-full text-left px-4 py-2 text-sm text-[#364153] hover:bg-gray-50 hover:text-[#266EF6] transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {formatBranchName(module.attributes?.branch)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search - responsive */}
        <div className="relative hidden sm:block" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center w-32 sm:w-48 lg:w-96 h-[42px] border border-gray-200 rounded-lg bg-white hover:border-[#266EF6] transition-colors">
              {/* Search Icon */}
              <div className="pl-4 pr-2">
                <svg fill="none" viewBox="0 0 16 16" className="w-4 h-4">
                  <path d="M14 14L11.1067 11.1067" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="7.33333" cy="7.33333" r="5.33333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Search documentation... (⌘K)"
                className="flex-1 h-full bg-transparent border-none outline-none text-sm placeholder-gray-500 pr-2"
              />
              
              {/* Clear Search Button */}
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
              
              {/* AI Mode Button */}
              <button 
                type="button"
                onClick={() => openChat(domain)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-md border border-gray-300 transition-colors flex items-center gap-1 mr-2"
              >
                <img 
                  src={aiSearchIcon} 
                  alt="AI" 
                  className="w-3 h-3"
                />
                AI Mode
              </button>
            </div>
          </form>
          
          {/* Search Results Dropdown */}
          <SearchResults
            results={searchResults.slice(0, 5)}
            isVisible={showSearchResults}
            onResultClick={handleSearchResultClick}
            onClose={() => setShowSearchResults(false)}
            highlightSearchTerm={highlightSearchTerm}
            searchQuery={searchQuery}
            isSearching={isSearching}
          />
        </div>

        {/* Mobile search icon */}
        <div className="sm:hidden flex items-center gap-2">
          <button 
            onClick={() => setShowMobileSearch(true)}
            className="p-2 rounded-md hover:bg-gray-100 flex items-center gap-1"
          >
            <svg fill="none" viewBox="0 0 16 16" className="w-5 h-5">
              <path d="M14 14L11.1067 11.1067" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7.33333" cy="7.33333" r="5.33333" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button 
            onClick={() => openChat(domain)}
            className="p-2 rounded-md hover:bg-gray-100 flex items-center gap-1"
          >
            <img 
              src={aiSearchIcon} 
              alt="AI Search" 
              className="w-5 h-5"
            />
          </button>
        </div>
      </div>
      
      {/* Mobile Search Modal */}
      <MobileSearchModal
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        allDocs={allDocs}
        onDocSelect={onDocSelect}
        domain={domain}
        openChat={openChat}
      />
    </header>
  );
};

export default Header;
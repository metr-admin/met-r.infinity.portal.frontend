import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const debounceTimerRef = useRef(null);

  const searchDocuments = useCallback((query, allDocs) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim() || !allDocs) {
      setSearchResults([]);
      setHighlightedText('');
      setIsSearching(false);
      return [];
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(() => {
      const searchTerm = query.toLowerCase().trim();
      const results = [];

      allDocs.forEach(doc => {
        const attributes = doc.attributes || {};
        const fileName = attributes.fileName || '';
        const title = attributes.htmlTitle || attributes.title || '';
        
        // Skip index/map files
        const isIndexFile = fileName.toLowerCase().includes('index') || 
                           fileName.toLowerCase().includes('map') ||
                           title.toLowerCase().includes('index') ||
                           title.toLowerCase().endsWith('map');
        
        if (isIndexFile) return;
        
        const content = attributes.htmlContent || attributes.content || attributes.bodyContent || '';
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => h.textContent || h.innerText || '');
        
        const titleMatch = title.toLowerCase().includes(searchTerm);
        const headingMatches = headings.filter(heading => 
          heading.toLowerCase().includes(searchTerm)
        );
        const contentMatch = textContent.toLowerCase().includes(searchTerm);
        
        if (titleMatch || headingMatches.length > 0 || contentMatch) {
          const contexts = [];
          
          if (titleMatch) {
            contexts.push({
              type: 'title',
              text: title,
              highlight: searchTerm
            });
          }
          
          headingMatches.forEach(heading => {
            contexts.push({
              type: 'heading',
              text: heading,
              highlight: searchTerm
            });
          });
          
          if (contentMatch) {
            const sentences = textContent.split(/[.!?]+/);
            const matchingSentences = sentences.filter(sentence => 
              sentence.toLowerCase().includes(searchTerm)
            ).slice(0, 2);
            
            matchingSentences.forEach(sentence => {
              contexts.push({
                type: 'content',
                text: sentence.trim(),
                highlight: searchTerm
              });
            });
          }
          
          results.push({
            doc,
            title,
            contexts,
            relevance: titleMatch ? 3 : (headingMatches.length > 0 ? 2 : 1)
          });
        }
      });

      results.sort((a, b) => b.relevance - a.relevance);
      
      setSearchResults(results);
      setHighlightedText(searchTerm);
      setIsSearching(false);
    }, 150);
    
    return [];
  }, []);

  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedText('');
    setIsSearching(false);
  }, []);

  const highlightSearchTerm = useCallback((text, term) => {
    if (!term || !text) return text;
    
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }, []);

  const value = {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    highlightedText,
    searchDocuments,
    clearSearch,
    highlightSearchTerm
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
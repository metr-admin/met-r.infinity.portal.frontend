import React, { createContext, useContext, useState, useCallback } from 'react';

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

  // Search through documents
  const searchDocuments = useCallback((query, allDocs) => {
    if (!query.trim() || !allDocs) {
      setSearchResults([]);
      setHighlightedText('');
      return [];
    }

    setIsSearching(true);
    const searchTerm = query.toLowerCase().trim();
    const results = [];

    allDocs.forEach(doc => {
      const attributes = doc.attributes || {};
      const content = attributes.htmlContent || attributes.content || attributes.bodyContent || '';
      const title = attributes.htmlTitle || attributes.title || '';
      
      // Create a temporary div to parse HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Extract text content and headings
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      const headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent || h.innerText || '');
      
      // Search in title
      const titleMatch = title.toLowerCase().includes(searchTerm);
      
      // Search in headings
      const headingMatches = headings.filter(heading => 
        heading.toLowerCase().includes(searchTerm)
      );
      
      // Search in content
      const contentMatch = textContent.toLowerCase().includes(searchTerm);
      
      if (titleMatch || headingMatches.length > 0 || contentMatch) {
        // Extract context around matches
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
          ).slice(0, 2); // Limit to 2 context sentences
          
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
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    setSearchResults(results);
    setHighlightedText(searchTerm);
    setIsSearching(false);
    
    return results;
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedText('');
    setIsSearching(false);
  }, []);

  // Highlight text in content
  const highlightSearchTerm = useCallback((text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
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
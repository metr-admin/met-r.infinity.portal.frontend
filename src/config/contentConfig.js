// Content processing configuration
export const CONTENT_CONFIG = {
  // Elements to remove during content processing
  unwantedSelectors: [
    'nav', '.nav', '[role="toc"]', '.toc',
    '.ditasearch', '.searchbox',
    '.breadcrumb', '.breadcrumbs',
    '.header', '.footer',
    '.sidebar', '.navigation',
    '.map', 'ul.map',
    '.topicref',
    'script', 'style'
  ],

  // Main content selectors (in order of preference)
  mainContentSelectors: [
    'main[role="main"]',
    'article',
    '.main-content',
    'body'
  ],

  // Navigation detection rules
  navigationRules: {
    maxLinksForIndex: 10,
    minLinksForNavigation: 3,
    htmlLinkPattern: '.html'
  },

  // Image processing
  imageConfig: {
    supportedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
    pathPrefixes: {
      uploads: '/uploads',
      media: 'media/'
    }
  },

  // Heading configuration
  headingConfig: {
    extractLevels: ['h2', 'h3'],
    tocLevels: ['h2', 'h3', 'h4', 'h5', 'h6'],
    headerOffset: 80
  }
};

// Content processor factory
export const createContentProcessor = (config = CONTENT_CONFIG) => {
  return {
    processContent: (htmlContent) => {
      if (!htmlContent) return '';
      
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Remove unwanted elements
        const unwantedElements = tempDiv.querySelectorAll(config.unwantedSelectors.join(', '));
        unwantedElements.forEach(el => el.remove());
        
        // Remove navigation lists
        const indexLists = tempDiv.querySelectorAll(`ul li a[href*="${config.navigationRules.htmlLinkPattern}"]`);
        indexLists.forEach(link => {
          const listItem = link.closest('li');
          const parentList = link.closest('ul');
          if (listItem && parentList && parentList.children.length <= config.navigationRules.maxLinksForIndex) {
            parentList.remove();
          }
        });
        
        // Remove navigation-like lists
        const navLists = tempDiv.querySelectorAll('ul');
        navLists.forEach(list => {
          const links = list.querySelectorAll(`a[href*="${config.navigationRules.htmlLinkPattern}"]`);
          if (links.length > config.navigationRules.minLinksForNavigation) {
            list.remove();
          }
        });
        
        // Remove h1 elements
        const h1Elements = tempDiv.querySelectorAll('h1');
        h1Elements.forEach(h1 => h1.remove());
        
        // Extract main content
        let mainContent = null;
        for (const selector of config.mainContentSelectors) {
          mainContent = tempDiv.querySelector(selector);
          if (mainContent) break;
        }
        if (!mainContent) mainContent = tempDiv;
        
        let processedHtml = mainContent.innerHTML;
        
        // Fix image paths
        const strapiUrl = import.meta.env.VITE_STRAPI_URL;
        const extensionPattern = config.imageConfig.supportedExtensions.join('|');
        const imageRegex = new RegExp(`src="([^"]*\\.(${extensionPattern}))"`, 'gi');
        
        processedHtml = processedHtml.replace(imageRegex, (match, imagePath) => {
          if (imagePath.startsWith('http')) return match;
          if (imagePath.startsWith(config.imageConfig.pathPrefixes.uploads)) {
            return `src="${strapiUrl}${imagePath}"`;
          }
          if (imagePath.includes(config.imageConfig.pathPrefixes.media) || !imagePath.startsWith('/')) {
            return `src="${strapiUrl}/uploads/${imagePath.replace(/^.*\//, '')}"`;
          }
          return `src="${strapiUrl}/uploads/${imagePath}"`;
        });
        
        return processedHtml;
      } catch (error) {
        console.error('Error processing content:', error);
        return htmlContent;
      }
    },

    extractHeadings: (htmlContent) => {
      if (!htmlContent) return [];
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const headingElements = tempDiv.querySelectorAll(config.headingConfig.extractLevels.join(', '));
      const extractedHeadings = [];
      const usedIds = new Set();
      
      headingElements.forEach((heading) => {
        const text = heading.textContent.trim();
        const level = heading.tagName.toLowerCase();
        let id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        
        let counter = 1;
        let finalId = id;
        while (usedIds.has(finalId)) {
          finalId = `${id}-${counter}`;
          counter++;
        }
        usedIds.add(finalId);
        
        extractedHeadings.push({ id: finalId, text, level });
      });
      
      return extractedHeadings;
    }
  };
};
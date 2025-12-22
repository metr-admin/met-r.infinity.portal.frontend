// Parse individual document content to extract navigation structure
export const parseDocumentNavigation = (htmlContent, docId, docTitle) => {
  if (!htmlContent) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    console.log(`🔍 Parsing navigation for document: ${docTitle}`);
    
    // Look for table of contents or navigation within the document
    const tocSelectors = [
      '.toc ul',
      '.table-of-contents ul', 
      '#toc ul',
      '.contents ul',
      'nav ul',
      '.navigation ul'
    ];
    
    let tocElement = null;
    for (const selector of tocSelectors) {
      tocElement = doc.querySelector(selector);
      if (tocElement) {
        console.log(`✅ Found TOC with selector: ${selector}`);
        break;
      }
    }
    
    // If no TOC found, build from headings
    if (!tocElement) {
      return buildNavigationFromHeadings(doc, docId, docTitle);
    }
    
    // Parse TOC structure
    const navigation = parseTocElement(tocElement, docId);
    
    return {
      title: docTitle,
      children: navigation
    };
    
  } catch (error) {
    console.error(`Error parsing document navigation for ${docTitle}:`, error);
    return null;
  }
};

// Build navigation from document headings
const buildNavigationFromHeadings = (doc, docId, docTitle) => {
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log(`📋 Building navigation from ${headings.length} headings for "${docTitle}"`);
  
  if (headings.length === 0) {
    return {
      title: docTitle,
      children: []
    };
  }
  
  const children = [];
  const stack = [];
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const title = heading.textContent.trim();
    const id = heading.id || `section-${index}`;
    
    // Skip if title is same as document title to avoid duplication
    if (title.toLowerCase() === docTitle.toLowerCase()) {
      return;
    }
    
    const item = {
      id: `${docId}-${id}`,
      title,
      docId, // All items point to the same document
      anchor: id, // For scrolling to specific sections
      level,
      children: []
    };
    
    // Build hierarchy based on heading levels
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      children.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }
    
    stack.push(item);
  });
  
  return {
    title: docTitle,
    children
  };
};

// Parse existing TOC element
const parseTocElement = (tocElement, docId) => {
  const items = [];
  const directLis = Array.from(tocElement.children).filter(child => child.tagName === 'LI');

  directLis.forEach((li, index) => {
    const item = parseTocLiElement(li, docId, index);
    if (item) {
      items.push(item);
    }
  });

  return items;
};

const parseTocLiElement = (liElement, docId, index) => {
  const link = liElement.querySelector('a');
  const nestedUl = liElement.querySelector('ul');
  
  if (!link && !nestedUl && !liElement.textContent.trim()) return null;

  const title = link ? link.textContent.trim() : liElement.firstChild?.textContent?.trim() || `Section ${index + 1}`;
  const href = link ? link.getAttribute('href') : null;
  const anchor = href ? href.replace('#', '') : null;

  const item = {
    id: `${docId}-${anchor || index}`,
    title,
    docId, // All items point to the same document
    anchor, // For scrolling to specific sections
    children: []
  };

  // Parse nested children
  if (nestedUl) {
    item.children = parseTocElement(nestedUl, docId);
  }

  return item;
};

// Build complete navigation structure from all documents
export const buildNavigationFromDocuments = (allDocs) => {
  console.log('🏗️ Building navigation from document content...');
  
  const navigationPromises = allDocs.map(async (doc) => {
    const fileName = doc.attributes?.fileName || '';
    const title = doc.attributes?.htmlTitle || doc.attributes?.title || fileName.replace('.html', '');
    
    // Skip index files for individual navigation
    if (fileName.toLowerCase().includes('index')) return null;
    
    // Get document content
    const htmlContent = doc.attributes?.bodyContent || doc.attributes?.htmlContent;
    
    if (!htmlContent) {
      // Return simple item without children if no content
      return {
        id: `doc-${doc.id}`,
        title,
        docId: doc.id,
        children: []
      };
    }
    
    // Parse document's internal navigation and return flattened structure
    const docNavigation = parseDocumentNavigation(htmlContent, doc.id, title);
    
    if (docNavigation && docNavigation.children && docNavigation.children.length > 0) {
      // Return the document with its sections as children
      return {
        id: `doc-${doc.id}`,
        title: docNavigation.title,
        docId: doc.id, // Main document
        children: docNavigation.children // Sections within the document
      };
    }
    
    // Return simple document without sections
    return {
      id: `doc-${doc.id}`,
      title,
      docId: doc.id,
      children: []
    };
  });
  
  return Promise.all(navigationPromises).then(results => {
    const validResults = results.filter(result => result !== null);
    console.log(`📁 Built navigation for ${validResults.length} documents`);
    return validResults;
  });
};
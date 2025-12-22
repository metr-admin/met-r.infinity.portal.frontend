// Dynamic module-aware navigation parser
// Detects and adapts to different documentation structures

// Module structure detector
const detectModuleStructure = (doc, moduleName) => {
  console.log(`🔍 Detecting structure for module: ${moduleName}`);
  
  // Check for different structure patterns
  const patterns = {
    hierarchical: doc.querySelector('ul li ul'), // Nested lists
    flat: doc.querySelector('ul:not(:has(ul))'), // Flat lists  
    headings: doc.querySelector('h1, h2, h3'), // Heading-based
    sections: doc.querySelector('.section, section'), // Section-based
    custom: doc.querySelector('[data-nav], .custom-nav') // Custom attributes
  };
  
  const detectedPattern = Object.keys(patterns).find(key => patterns[key]);
  console.log(`📊 Detected pattern: ${detectedPattern || 'unknown'}`);
  
  return {
    pattern: detectedPattern || 'flat',
    element: patterns[detectedPattern],
    hasNesting: !!patterns.hierarchical,
    hasHeadings: !!patterns.headings
  };
};

// Main dynamic parser
export const parseNavigationStructure = (htmlContent, moduleName = 'default') => {
  if (!htmlContent) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    console.log(`🔍 Parsing navigation for module: ${moduleName}`);
    
    // Detect module structure dynamically
    const structure = detectModuleStructure(doc, moduleName);
    
    // Route to appropriate parser based on detected structure
    switch (structure.pattern) {
      case 'hierarchical':
        return parseHierarchicalStructure(doc, moduleName);
      case 'headings':
        return parseHeadingStructure(doc, moduleName);
      case 'sections':
        return parseSectionStructure(doc, moduleName);
      case 'custom':
        return parseCustomStructure(doc, moduleName);
      default:
        return parseFlatStructure(doc, moduleName);
    }
  } catch (error) {
    console.error('Error parsing navigation structure:', error);
    return [];
  }
};

// Hierarchical structure parser (Space Map style)
const parseHierarchicalStructure = (doc, moduleName) => {
  console.log(`📋 Parsing hierarchical structure for ${moduleName}`);
  
  const navSelectors = [
    'nav ul', '.navigation ul', '.sidebar ul', '.toc ul',
    'ul.nav', '#navigation ul', '.content ul', 'body > ul'
  ];

  let navElement = null;
  for (const selector of navSelectors) {
    navElement = doc.querySelector(selector);
    if (navElement) break;
  }

  if (!navElement) {
    const allUls = doc.querySelectorAll('ul');
    for (const ul of allUls) {
      if (ul.querySelectorAll('a').length > 0) {
        navElement = ul;
        break;
      }
    }
  }

  return navElement ? parseUlElement(navElement, moduleName) : [];
};

// Flat structure parser
const parseFlatStructure = (doc, moduleName) => {
  console.log(`📋 Parsing flat structure for ${moduleName}`);
  
  const links = doc.querySelectorAll('a[href]');
  return Array.from(links).map(link => ({
    id: generateId(),
    title: link.textContent.trim(),
    href: link.getAttribute('href'),
    docId: null,
    children: [],
    moduleType: 'flat',
    moduleName
  }));
};

// Heading-based structure parser
const parseHeadingStructure = (doc, moduleName) => {
  console.log(`📋 Parsing heading structure for ${moduleName}`);
  
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) return [];
  
  const structure = [];
  const stack = [];
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const title = heading.textContent.trim();
    const id = heading.id || `heading-${index}`;
    
    const item = {
      id: generateId(),
      title,
      href: `#${id}`,
      docId: null,
      children: [],
      level,
      moduleType: 'heading',
      moduleName
    };
    
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      structure.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }
    
    stack.push(item);
  });
  
  return structure;
};

// Section-based structure parser
const parseSectionStructure = (doc, moduleName) => {
  console.log(`📋 Parsing section structure for ${moduleName}`);
  
  const sections = doc.querySelectorAll('.section, section, [data-section]');
  return Array.from(sections).map((section, index) => {
    const title = section.querySelector('h1, h2, h3, .title')?.textContent?.trim() || `Section ${index + 1}`;
    const id = section.id || `section-${index}`;
    
    return {
      id: generateId(),
      title,
      href: `#${id}`,
      docId: null,
      children: [],
      moduleType: 'section',
      moduleName
    };
  });
};

// Custom structure parser
const parseCustomStructure = (doc, moduleName) => {
  console.log(`📋 Parsing custom structure for ${moduleName}`);
  
  const customNav = doc.querySelector('[data-nav], .custom-nav');
  if (!customNav) return [];
  
  const items = customNav.querySelectorAll('[data-nav-item], .nav-item');
  return Array.from(items).map(item => ({
    id: generateId(),
    title: item.textContent.trim(),
    href: item.getAttribute('href') || item.getAttribute('data-href'),
    docId: null,
    children: [],
    moduleType: 'custom',
    moduleName
  }));
};

// UL element parser with module context
const parseUlElement = (ulElement, moduleName) => {
  const items = [];
  const directLis = Array.from(ulElement.children).filter(child => child.tagName === 'LI');

  directLis.forEach((li) => {
    const item = parseLiElement(li, moduleName);
    if (item) {
      items.push(item);
    }
  });

  return items;
};

// LI element parser with module context
const parseLiElement = (liElement, moduleName) => {
  const link = liElement.querySelector('a');
  const nestedUl = liElement.querySelector('ul');
  
  if (!link && !nestedUl) return null;

  const item = {
    id: generateId(),
    title: link ? link.textContent.trim() : liElement.firstChild?.textContent?.trim() || 'Untitled',
    href: link ? link.getAttribute('href') : null,
    docId: null,
    children: [],
    moduleType: 'hierarchical',
    moduleName
  };

  if (nestedUl) {
    item.children = parseUlElement(nestedUl, moduleName);
  }

  return item;
};

// Module-aware document matching
export const matchNavigationWithModuleContext = async (navigationStructure, allDocs, moduleName) => {
  console.log(`🤖 Starting module-aware matching for: ${moduleName}`);
  
  // Filter documents by module if needed
  const moduleFilteredDocs = allDocs.filter(doc => {
    const fileName = doc.attributes?.fileName || '';
    // Add module-specific filtering logic here
    return true; // For now, include all docs
  });
  
  // Create document map
  const docMap = new Map();
  moduleFilteredDocs.forEach(doc => {
    const fileName = doc.attributes?.fileName || '';
    if (!fileName.toLowerCase().includes('index')) {
      docMap.set(fileName.toLowerCase(), doc);
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').toLowerCase();
      docMap.set(nameWithoutExt, doc);
    }
  });
  
  // Match based on module structure type
  const matchItems = (items, parentContext = null) => {
    return items.map(item => {
      const matchedItem = { ...item };
      
      // Module-specific matching logic
      switch (item.moduleType) {
        case 'hierarchical':
          return matchHierarchicalItem(matchedItem, docMap, parentContext);
        case 'flat':
          return matchFlatItem(matchedItem, docMap);
        case 'heading':
          return matchHeadingItem(matchedItem, docMap, parentContext);
        case 'section':
          return matchSectionItem(matchedItem, docMap, parentContext);
        case 'custom':
          return matchCustomItem(matchedItem, docMap);
        default:
          return matchDefaultItem(matchedItem, docMap, parentContext);
      }
    });
  };
  
  return matchItems(navigationStructure);
};

// Hierarchical item matching
const matchHierarchicalItem = (item, docMap, parentContext) => {
  if (item.children && item.children.length > 0) {
    // Parent document
    if (item.href) {
      const fileName = item.href.toLowerCase().split('/').pop();
      const matchedDoc = docMap.get(fileName) || docMap.get(fileName.replace('.html', ''));
      
      if (matchedDoc) {
        item.docId = matchedDoc.id;
        item.children = item.children.map(child => 
          matchHierarchicalItem(child, docMap, { docId: matchedDoc.id, title: item.title })
        );
      }
    }
  } else if (parentContext) {
    // Child section
    item.docId = parentContext.docId;
    if (item.href && item.href.includes('#')) {
      item.anchor = item.href.split('#')[1];
    }
  }
  
  return item;
};

// Other matching functions
const matchFlatItem = (item, docMap) => {
  if (item.href) {
    const fileName = item.href.toLowerCase();
    const matchedDoc = docMap.get(fileName) || docMap.get(fileName.replace('.html', ''));
    if (matchedDoc) item.docId = matchedDoc.id;
  }
  return item;
};

const matchHeadingItem = (item, docMap, parentContext) => {
  if (parentContext) {
    item.docId = parentContext.docId;
    if (item.href) item.anchor = item.href.replace('#', '');
  }
  return item;
};

const matchSectionItem = (item, docMap, parentContext) => {
  if (parentContext) {
    item.docId = parentContext.docId;
    if (item.href) item.anchor = item.href.replace('#', '');
  }
  return item;
};

const matchCustomItem = (item, docMap) => {
  // Custom matching logic based on data attributes
  return item;
};

const matchDefaultItem = (item, docMap, parentContext) => {
  return matchHierarchicalItem(item, docMap, parentContext);
};

const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Export module detection for external use
export { detectModuleStructure };
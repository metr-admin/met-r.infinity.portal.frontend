// Parse index.html navigation structure into hierarchical data
export const parseNavigationStructure = (htmlContent) => {
  if (!htmlContent) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    console.log('🔍 Parsing HTML content for navigation...');

    // Look for navigation elements - common patterns in documentation
    const navSelectors = [
      'nav ul',
      '.navigation ul',
      '.sidebar ul',
      '.toc ul',
      '.table-of-contents ul',
      'ul.nav',
      '#navigation ul',
      '.nav-list',
      '.nav ul',
      '#toc ul',
      '.content ul',
      'body > ul',
      'main ul'
    ];

    let navElement = null;
    for (const selector of navSelectors) {
      navElement = doc.querySelector(selector);
      if (navElement) {
        console.log(`✅ Found navigation with selector: ${selector}`);
        break;
      }
    }

    // If no specific nav found, look for any ul with links
    if (!navElement) {
      console.log('🔍 Looking for any UL with links...');
      const allUls = doc.querySelectorAll('ul');
      console.log(`Found ${allUls.length} UL elements`);

      for (const ul of allUls) {
        const links = ul.querySelectorAll('a');
        console.log(`UL has ${links.length} links`);
        if (links.length > 0) {
          navElement = ul;
          console.log('✅ Using UL with links as navigation');
          break;
        }
      }
    }

    // Try alternative approaches - look for headings structure
    if (!navElement) {
      console.log('🔍 No UL found, trying to build from headings...');
      return parseHeadingStructure(doc);
    }

    const result = parseUlElement(navElement);
    console.log('📋 Parsed navigation structure:', result);
    return result;
  } catch (error) {
    console.error('Error parsing navigation structure:', error);
    return [];
  }
};

// Alternative parser for heading-based structure
const parseHeadingStructure = (doc) => {
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  console.log(`Found ${headings.length} headings`);

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
      level
    };

    // Find the right parent based on heading level
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

  console.log('📋 Built structure from headings:', structure);
  return structure;
};

const parseUlElement = (ulElement) => {
  const items = [];
  const directLis = Array.from(ulElement.children).filter(child => child.tagName === 'LI');

  directLis.forEach((li) => {
    const item = parseLiElement(li);
    if (item) {
      items.push(item);
    }
  });

  return items;
};

const parseLiElement = (liElement) => {
  const link = liElement.querySelector('a');
  const nestedUl = liElement.querySelector('ul');

  if (!link && !nestedUl) return null;

  const item = {
    id: generateId(),
    title: link ? link.textContent.trim() : liElement.firstChild?.textContent?.trim() || 'Untitled',
    href: link ? link.getAttribute('href') : null,
    docId: null, // Will be matched with actual documents later
    children: []
  };

  // Parse nested children
  if (nestedUl) {
    item.children = parseUlElement(nestedUl);
  }

  return item;
};

// Match navigation items with actual document IDs
export const matchNavigationWithDocs = (navigationStructure, allDocs) => {
  return navigationStructure.map(item => matchItemWithDocs(item, allDocs));
};

// Export the createStructureFromDocuments function
export { createStructureFromDocuments };

// Smart matching based on document content indexing with hierarchical context
export const matchNavigationWithDocumentContent = async (navigationStructure, allDocs) => {
  console.log('🤖 Starting smart hierarchical matching...');

  // Create document map with filename matching
  const docMap = new Map();
  allDocs.forEach(doc => {
    const fileName = doc.attributes?.fileName || '';
    if (!fileName.toLowerCase().includes('index')) {
      docMap.set(fileName.toLowerCase(), doc);
      // Also map without extension
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').toLowerCase();
      docMap.set(nameWithoutExt, doc);
    }
  });

  console.log(`📄 Built document map for ${docMap.size} documents`);

  // Recursively match navigation items with hierarchical context
  const matchItems = (items, parentContext = null) => {
    return items.map(item => {
      const matchedItem = { ...item };

      // For parent items (documents), match by href to filename
      if (item.children && item.children.length > 0) {
        // This is a main document - match by href
        if (item.href) {
          const hrefPath = item.href.toLowerCase();

          // Try to find document by href path
          let matchedDoc = null;

          // Extract filename from href
          const fileName = hrefPath.split('/').pop();
          if (fileName) {
            matchedDoc = docMap.get(fileName) || docMap.get(fileName.replace('.html', ''));
          }

          // If not found, try partial matching
          if (!matchedDoc) {
            for (const [key, doc] of docMap.entries()) {
              if (key.includes(fileName.replace('.html', '')) || fileName.includes(key)) {
                matchedDoc = doc;
                break;
              }
            }
          }

          if (matchedDoc) {
            matchedItem.docId = matchedDoc.id;
            console.log(`✅ Matched parent "${item.title}" -> ${matchedDoc.attributes?.fileName}`);

            // Match children with parent context
            matchedItem.children = matchItems(item.children, {
              docId: matchedDoc.id,
              title: item.title,
              href: item.href
            });
          } else {
            console.log(`❌ No document match for parent "${item.title}" (href: ${item.href})`);
            // Still process children without parent context
            matchedItem.children = matchItems(item.children, null);
          }
        } else {
          // Process children without parent context
          matchedItem.children = matchItems(item.children, parentContext);
        }
      } else {
        // This is a child item (section) - use parent context
        if (parentContext && parentContext.docId) {
          matchedItem.docId = parentContext.docId;

          // Add anchor from href if available
          if (item.href && item.href.includes('#')) {
            matchedItem.anchor = item.href.split('#')[1];
          }

          console.log(`✅ Matched child "${item.title}" -> parent doc ${parentContext.docId} ${matchedItem.anchor ? '(anchor: ' + matchedItem.anchor + ')' : ''}`);
        } else {
          console.log(`⚠️ Child "${item.title}" has no parent context`);
        }
      }

      return matchedItem;
    });
  };

  return matchItems(navigationStructure);
};

const matchItemWithDocs = (item, allDocs) => {
  const matchedItem = { ...item };

  console.log(`🔍 Trying to match "${item.title}" (href: ${item.href}, hasChildren: ${item.children?.length > 0})`);

  // For category items (no docId), don't try to match
  if (item.docId) {
    // Already has docId, keep it
    matchedItem.docId = item.docId;
    console.log(`✅ Item "${item.title}" already has docId: ${item.docId}`);
  } else if (!item.children?.length) {
    // Try multiple matching strategies for leaf items
    let matchedDoc = null;

    // Strategy 1: Exact href match
    if (item.href) {
      matchedDoc = allDocs.find(doc => {
        const fileName = doc.attributes?.fileName || '';
        return fileName.toLowerCase() === item.href.toLowerCase();
      });
      if (matchedDoc) console.log(`✅ Strategy 1: Exact href match for "${item.title}"`);
    }

    // Strategy 2: Partial href match
    if (!matchedDoc && item.href) {
      matchedDoc = allDocs.find(doc => {
        const fileName = doc.attributes?.fileName || '';
        const cleanHref = item.href.replace('#', '').replace('.html', '').toLowerCase();
        const cleanFileName = fileName.replace('.html', '').toLowerCase();
        return cleanFileName.includes(cleanHref) || cleanHref.includes(cleanFileName);
      });
      if (matchedDoc) console.log(`✅ Strategy 2: Partial href match for "${item.title}"`);
    }

    // Strategy 3: Title matching with document titles
    if (!matchedDoc) {
      matchedDoc = allDocs.find(doc => {
        const docTitle = (doc.attributes?.htmlTitle || doc.attributes?.title || '').toLowerCase();
        const itemTitle = item.title.toLowerCase();
        return docTitle === itemTitle || docTitle.includes(itemTitle) || itemTitle.includes(docTitle);
      });
      if (matchedDoc) console.log(`✅ Strategy 3: Title match for "${item.title}"`);
    }

    // Strategy 4: Fuzzy filename matching
    if (!matchedDoc) {
      matchedDoc = allDocs.find(doc => {
        const fileName = (doc.attributes?.fileName || '').toLowerCase().replace('.html', '');
        const itemTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanFileName = fileName.replace(/[^a-z0-9]/g, '');
        return cleanFileName.includes(itemTitle) || itemTitle.includes(cleanFileName);
      });
      if (matchedDoc) console.log(`✅ Strategy 4: Fuzzy filename match for "${item.title}"`);
    }

    if (matchedDoc) {
      matchedItem.docId = matchedDoc.id;
      console.log(`✅ Final match: "${item.title}" -> docId: ${matchedDoc.id} (${matchedDoc.attributes?.fileName})`);
    } else {
      console.log(`❌ No match found for "${item.title}" (href: ${item.href})`);
      // Log available documents for debugging
      console.log('📄 Available documents:', allDocs.slice(0, 5).map(d => ({ id: d.id, fileName: d.attributes?.fileName, title: d.attributes?.title })));
    }
  }

  // Recursively match children
  if (item.children && item.children.length > 0) {
    matchedItem.children = item.children.map(child => matchItemWithDocs(child, allDocs));
  }

  return matchedItem;
};

const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Create navigation structure from document list when no index file exists
const createStructureFromDocuments = (allDocs) => {
  console.log('🏗️ Creating navigation structure from documents...');

  const structure = [];
  const categories = {};

  allDocs.forEach(doc => {
    const fileName = doc.attributes?.fileName || '';
    const title = doc.attributes?.htmlTitle || doc.attributes?.title || fileName.replace('.html', '');

    // Skip index files
    if (fileName.toLowerCase().includes('index')) return;

    // Try to categorize documents
    let category = 'Documents';

    if (fileName.toLowerCase().includes('install')) category = 'Installation';
    else if (fileName.toLowerCase().includes('config')) category = 'Configuration';
    else if (fileName.toLowerCase().includes('api')) category = 'API Reference';
    else if (fileName.toLowerCase().includes('guide')) category = 'Guides';
    else if (fileName.toLowerCase().includes('tutorial')) category = 'Tutorials';
    else if (fileName.toLowerCase().includes('troubleshoot')) category = 'Troubleshooting';
    else if (fileName.toLowerCase().includes('faq')) category = 'FAQ';

    if (!categories[category]) {
      categories[category] = {
        id: generateId(),
        title: category,
        href: null,
        docId: null, // Category items should not have docId
        children: []
      };
    }

    categories[category].children.push({
      id: generateId(),
      title: title,
      href: fileName,
      docId: doc.id, // Ensure correct docId is set
      children: []
    });

    console.log(`📄 Added "${title}" to "${category}" with docId: ${doc.id}`);
  });

  // Convert categories to array
  Object.values(categories).forEach(category => {
    structure.push(category);
  });

  console.log('📁 Created categorized structure with', structure.length, 'categories');
  return structure;
};

// Debug function to log HTML structure
export const debugHtmlStructure = (htmlContent) => {
  if (!htmlContent) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  console.log('🔍 HTML Structure Debug:');
  console.log('- UL elements:', doc.querySelectorAll('ul').length);
  console.log('- LI elements:', doc.querySelectorAll('li').length);
  console.log('- A elements:', doc.querySelectorAll('a').length);
  console.log('- Headings:', doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length);
  console.log('- Nav elements:', doc.querySelectorAll('nav').length);

  // Log first few UL elements
  const uls = doc.querySelectorAll('ul');
  uls.forEach((ul, i) => {
    if (i < 3) {
      console.log(`UL ${i}:`, ul.outerHTML.substring(0, 200) + '...');
    }
  });
};
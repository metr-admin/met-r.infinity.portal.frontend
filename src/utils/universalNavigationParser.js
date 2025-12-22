// Universal navigation parser - adapts to any structure automatically

export const parseUniversalNavigation = (htmlContent, branchStructure) => {
  if (!htmlContent) return [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  console.log(`🔧 Using ${branchStructure.structure} parser for ${branchStructure.name}`);
  
  // Route to appropriate parser based on detected structure
  let result;
  switch (branchStructure.structure) {
    case 'hierarchical':
      result = parseHierarchical(doc, branchStructure);
      break;
    case 'headings':
      result = parseHeadings(doc, branchStructure);
      break;
    case 'sections':
      result = parseSections(doc, branchStructure);
      break;
    case 'tables':
      result = parseTables(doc, branchStructure);
      break;
    case 'custom':
      result = parseCustom(doc, branchStructure);
      break;
    default:
      result = parseFlat(doc, branchStructure);
  }
  
  console.log(`📋 Parsed ${result.length} navigation items for ${branchStructure.name}`);
  return result;
};

const parseHierarchical = (doc, structure) => {
  const navElement = findNavigationElement(doc);
  if (!navElement) return [];
  
  return parseNestedList(navElement, structure);
};

const parseHeadings = (doc, structure) => {
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const items = [];
  const stack = [];
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const title = heading.textContent.trim();
    const id = heading.id || `heading-${index}`;
    
    const item = createNavItem(title, `#${id}`, structure, { level });
    
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      items.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }
    
    stack.push(item);
  });
  
  return items;
};

const parseSections = (doc, structure) => {
  const sections = doc.querySelectorAll('section, .section, [data-section]');
  return Array.from(sections).map((section, index) => {
    const title = extractSectionTitle(section, index);
    const id = section.id || `section-${index}`;
    return createNavItem(title, `#${id}`, structure);
  });
};

const parseTables = (doc, structure) => {
  const tables = doc.querySelectorAll('table');
  const items = [];
  
  tables.forEach((table, index) => {
    const caption = table.querySelector('caption')?.textContent?.trim();
    const firstRowText = table.querySelector('tr td, tr th')?.textContent?.trim();
    const title = caption || firstRowText || `Table ${index + 1}`;
    
    const rows = table.querySelectorAll('tr');
    const children = Array.from(rows).slice(1).map((row, rowIndex) => {
      const cellText = row.querySelector('td, th')?.textContent?.trim() || `Row ${rowIndex + 1}`;
      return createNavItem(cellText, `#table-${index}-row-${rowIndex}`, structure);
    });
    
    const tableItem = createNavItem(title, `#table-${index}`, structure);
    tableItem.children = children;
    items.push(tableItem);
  });
  
  return items;
};

const parseCustom = (doc, structure) => {
  // Look for custom navigation patterns
  const customSelectors = [
    '[data-nav]', '.nav-custom', '[role="navigation"]',
    '.menu', '.navigation', '.sidebar-nav'
  ];
  
  for (const selector of customSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      return parseCustomElement(element, structure);
    }
  }
  
  return parseFlat(doc, structure);
};

const parseFlat = (doc, structure) => {
  const links = doc.querySelectorAll('a[href]');
  return Array.from(links)
    .filter(link => link.href && !link.href.startsWith('javascript:'))
    .map(link => createNavItem(
      link.textContent.trim(),
      link.getAttribute('href'),
      structure
    ));
};

// Helper functions
const findNavigationElement = (doc) => {
  const selectors = [
    'nav ul', 'ul.nav', '.navigation ul', '.sidebar ul',
    '.toc ul', '#navigation ul', '.menu ul'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) return element;
  }
  
  // Fallback: find any UL with links
  const uls = doc.querySelectorAll('ul');
  for (const ul of uls) {
    if (ul.querySelectorAll('a').length > 0) return ul;
  }
  
  return null;
};

const parseNestedList = (ulElement, structure) => {
  const items = [];
  const directLis = Array.from(ulElement.children).filter(child => child.tagName === 'LI');
  
  directLis.forEach(li => {
    const link = li.querySelector('a');
    const nestedUl = li.querySelector('ul');
    
    if (!link && !nestedUl) return;
    
    const title = link?.textContent?.trim() || li.firstChild?.textContent?.trim() || 'Untitled';
    const href = link?.getAttribute('href');
    
    const item = createNavItem(title, href, structure);
    
    if (nestedUl) {
      item.children = parseNestedList(nestedUl, structure);
    }
    
    items.push(item);
  });
  
  return items;
};

const parseCustomElement = (element, structure) => {
  // Generic custom element parser
  const items = element.querySelectorAll('[data-nav-item], .nav-item, a');
  return Array.from(items).map(item => {
    const title = item.textContent.trim();
    const href = item.getAttribute('href') || item.getAttribute('data-href');
    return createNavItem(title, href, structure);
  });
};

const extractSectionTitle = (section, index) => {
  const titleSelectors = ['h1', 'h2', 'h3', '.title', '[data-title]'];
  
  for (const selector of titleSelectors) {
    const titleElement = section.querySelector(selector);
    if (titleElement) return titleElement.textContent.trim();
  }
  
  return `Section ${index + 1}`;
};

const createNavItem = (title, href, structure, extra = {}) => ({
  id: generateId(),
  title: title || 'Untitled',
  href,
  docId: null,
  children: [],
  branchName: structure.branchName,
  moduleName: structure.name,
  structureType: structure.structure,
  ...extra
});

const generateId = () => Math.random().toString(36).substr(2, 9);

// Universal matching function with hierarchical preservation
export const matchUniversalNavigation = async (navigationStructure, allDocs, branchStructure) => {
  console.log(`🎯 Universal matching for ${branchStructure.name}`);
  
  const docMap = createDocumentMap(allDocs);
  console.log(`📄 Document map created with ${docMap.size} documents`);
  
  const matchItems = (items, parentContext = null) => {
    return items.map(item => {
      const matchedItem = { ...item };
      
      console.log(`🔍 Matching "${item.title}", href: ${item.href}, hasChildren: ${item.children?.length > 0}`);
      
      // Detect module type from branch structure
      const isSpaceSoulModule = branchStructure.branchName?.toLowerCase().includes('space') || 
                               branchStructure.branchName?.toLowerCase().includes('soul');
      
      if (item.children?.length > 0) {
        // Parent item with children
        if (item.href) {
          const matchedDoc = findDocumentMatch(item, docMap);
          
          if (matchedDoc) {
            matchedItem.docId = matchedDoc.id;
            console.log(`✅ Parent "${item.title}" -> docId: ${matchedDoc.id}`);
            
            if (isSpaceSoulModule) {
              // Space/Soul modules: Children inherit parent docId for anchor navigation
              const childrenResults = matchItems(item.children, {
                docId: matchedDoc.id,
                title: item.title,
                href: item.href
              });
              // Filter out null items (duplicates)
              matchedItem.children = childrenResults.filter(child => child !== null);
            } else {
              // Other modules: Children get their own docIds
              matchedItem.children = matchItems(item.children, null);
            }
          } else {
            console.log(`❌ No document match for parent "${item.title}"`);
            matchedItem.children = matchItems(item.children, null);
          }
        } else {
          // Category without href - just process children
          matchedItem.children = matchItems(item.children, parentContext);
        }
      } else {
        // Leaf item
        if (parentContext && parentContext.docId && isSpaceSoulModule) {
          // Space/Soul modules: Use parent docId with anchor
          matchedItem.docId = parentContext.docId;
          if (item.href?.includes('#')) {
            matchedItem.anchor = item.href.split('#')[1];
          }
          
          // Skip if this child has the same title as parent (duplicate)
          if (item.title === parentContext.title) {
            console.log(`⏭️ Skipping duplicate title "${item.title}"`);
            return null; // This will be filtered out
          }
          
          console.log(`✅ Space/Soul child "${item.title}" -> parent docId: ${parentContext.docId}, anchor: ${matchedItem.anchor}`);
        } else {
          // Try to match individual document
          const matchedDoc = findDocumentMatch(item, docMap);
          if (matchedDoc) {
            matchedItem.docId = matchedDoc.id;
            console.log(`✅ Leaf "${item.title}" -> docId: ${matchedDoc.id}`);
          } else {
            console.log(`❌ No match for "${item.title}"`);
          }
        }
      }
      
      return matchedItem;
    }).filter(item => item !== null); // Filter out null items
  };
  
  return matchItems(navigationStructure);
};

const createDocumentMap = (allDocs) => {
  const map = new Map();
  
  allDocs.forEach(doc => {
    const fileName = doc.attributes?.fileName || '';
    if (!fileName.toLowerCase().includes('index')) {
      map.set(fileName.toLowerCase(), doc);
      // Also map without extension
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').toLowerCase();
      map.set(nameWithoutExt, doc);
      
      console.log(`📄 Mapped: ${fileName} -> docId: ${doc.id}`);
    }
  });
  
  console.log(`🗺 Created document map with keys:`, Array.from(map.keys()));
  return map;
};

const findDocumentMatch = (item, docMap) => {
  if (!item.href) return null;
  
  const hrefPath = item.href.toLowerCase();
  
  // Extract filename from href
  const fileName = hrefPath.split('/').pop().split('#')[0];
  
  // Try exact match first
  let matchedDoc = docMap.get(fileName) || docMap.get(fileName.replace('.html', ''));
  
  // If not found, try partial matching
  if (!matchedDoc) {
    for (const [key, doc] of docMap.entries()) {
      if (key.includes(fileName.replace('.html', '')) || fileName.includes(key)) {
        matchedDoc = doc;
        break;
      }
    }
  }
  
  return matchedDoc;
};
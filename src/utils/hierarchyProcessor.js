/**
 * Robust Document Hierarchy Processor
 * Handles all document set structures dynamically
 */

export const processDocumentHierarchy = (allDocs) => {
  if (!allDocs?.length) return [];

  const indexDoc = allDocs.find(doc => 
    doc.attributes?.fileName?.toLowerCase() === 'index.html'
  );

  if (!indexDoc?.attributes?.bodyContent) {
    return createFlatStructure(allDocs);
  }

  const hierarchy = parseNavStructure(indexDoc.attributes.bodyContent);
  return buildSidebarStructure(hierarchy, allDocs);
};

const parseNavStructure = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const processUL = (ul) => {
    const items = [];
    const liElements = Array.from(ul.children).filter(el => el.tagName === 'LI');
    
    for (let li of liElements) {
      const isTopicHead = li.classList.contains('topichead');
      const directLink = li.querySelector(':scope > a');
      const nestedUL = li.querySelector(':scope > ul');
      
      if (isTopicHead) {
        // Pure category - text node only, no link
        const textContent = Array.from(li.childNodes)
          .find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        
        if (textContent) {
          items.push({
            title: textContent.textContent.trim(),
            type: 'category',
            children: nestedUL ? processUL(nestedUL) : []
          });
        }
      } else if (directLink) {
        // Has link - document (may have children)
        const item = {
          title: directLink.textContent.trim(),
          href: directLink.getAttribute('href'),
          type: 'document',
          children: nestedUL ? processUL(nestedUL) : []
        };
        
        // For Time module: if this item has children and all point to same file,
        // treat children as sections of this document
        if (item.children.length > 0) {
          const parentFile = item.href?.split('#')[0];
          const allChildrenSameFile = item.children.every(child => 
            child.href?.split('#')[0] === parentFile
          );
          
          if (allChildrenSameFile && parentFile) {
            // Mark children as sections
            item.children = item.children.map(child => ({
              ...child,
              type: 'section',
              parentFile: parentFile
            }));
          }
        }
        
        items.push(item);
      }
    }
    
    return items;
  };
  
  const nav = doc.querySelector('nav ul.map');
  return nav ? processUL(nav) : [];
};

const buildSidebarStructure = (hierarchy, allDocs) => {
  const branchName = allDocs[0]?.attributes?.branch || '';
  
  // Dynamic detection: check if all items point to same file with anchors
  const detectSectionModule = (items) => {
    const itemsWithHref = items.filter(item => item.href && item.type === 'document');
    if (itemsWithHref.length === 0) return false;
    
    const firstFile = itemsWithHref[0].href?.split('#')[0];
    const allSameFile = itemsWithHref.every(item => item.href?.split('#')[0] === firstFile);
    const hasAnchors = itemsWithHref.some(item => item.href?.includes('#'));
    
    return allSameFile && hasAnchors && itemsWithHref.length > 1;
  };
  
  const isSectionModule = detectSectionModule(hierarchy);
  
  const processItems = (items, level = 0, parentDoc = null) => {
    return items.map((item, index) => {
      const uniqueId = `${level}_${index}_${item.title.replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (item.type === 'category') {
        return {
          id: uniqueId,
          title: item.title,
          type: 'category',
          docId: null,
          children: processItems(item.children, level + 1, parentDoc)
        };
      } else {
        const matchedDoc = item.href ? findMatchingDocument(item.title, item.href, allDocs) : null;
        const hasAnchor = item.href?.includes('#');
        
        if (matchedDoc) {
          if (isSectionModule && hasAnchor) {
            // For section modules (Time/Space/Soul), all items are sections of the same document
            const anchor = item.href.split('#')[1];
            
            return {
              id: uniqueId,
              title: item.title,
              displayTitle: item.title,
              type: 'section',
              docId: matchedDoc.id,
              anchor: anchor,
              children: []
            };
          } else {
            // Normal document
            const docItem = {
              ...matchedDoc,
              id: uniqueId,
              title: item.title,
              displayTitle: item.title,
              type: 'document',
              docId: matchedDoc.id,
              children: []
            };
            
            if (item.children.length > 0) {
              docItem.children = processItems(item.children, level + 1, matchedDoc);
            }
            
            return docItem;
          }
        } else if (item.children.length > 0) {
          return {
            id: uniqueId,
            title: item.title,
            type: 'category',
            docId: null,
            children: processItems(item.children, level + 1, parentDoc)
          };
        }
      }
      
      return null;
    }).filter(Boolean);
  };
  
  const result = processItems(hierarchy);
  
  // For section modules, wrap all sections under a parent document
  if (isSectionModule && result.length > 0) {
    const firstItem = result[0];
    if (firstItem && firstItem.docId) {
      const parentDoc = allDocs.find(doc => doc.id === firstItem.docId);
      if (parentDoc) {
        return [{
          id: `parent_${parentDoc.id}`,
          title: parentDoc.attributes?.htmlTitle || parentDoc.attributes?.title || 'Main Document',
          displayTitle: parentDoc.attributes?.htmlTitle || parentDoc.attributes?.title || 'Main Document',
          type: 'document',
          docId: parentDoc.id,
          children: result.map(item => ({
            ...item,
            type: 'section'
          }))
        }];
      }
    }
  }
  
  return result;
};

const findMatchingDocument = (title, href, allDocs) => {
  if (href) {
    const fileName = href.split('/').pop().split('#')[0];
    
    let match = allDocs.find(doc => doc.attributes?.fileName === fileName);
    if (match) return match;
    
    const baseName = fileName.replace('.html', '');
    match = allDocs.find(doc => 
      doc.attributes?.fileName?.replace('.html', '') === baseName
    );
    if (match) return match;
  }
  
  // Try exact title matching
  let match = allDocs.find(doc => {
    const docTitle = (doc.attributes?.htmlTitle || doc.attributes?.title || '').toLowerCase().trim();
    const itemTitle = title.toLowerCase().trim();
    return docTitle === itemTitle;
  });
  if (match) return match;
  
  // Try partial title matching (both ways)
  match = allDocs.find(doc => {
    const docTitle = (doc.attributes?.htmlTitle || doc.attributes?.title || '').toLowerCase().trim();
    const itemTitle = title.toLowerCase().trim();
    return (docTitle && itemTitle && (docTitle.includes(itemTitle) || itemTitle.includes(docTitle)));
  });
  if (match) return match;
  
  // Try word-based matching
  match = allDocs.find(doc => {
    const docTitle = (doc.attributes?.htmlTitle || doc.attributes?.title || '').toLowerCase().trim();
    const itemTitle = title.toLowerCase().trim();
    const docWords = docTitle.split(/\s+/);
    const itemWords = itemTitle.split(/\s+/);
    
    // Check if any significant words match
    const significantWords = itemWords.filter(word => word.length > 3);
    return significantWords.some(word => docWords.some(docWord => docWord.includes(word) || word.includes(docWord)));
  });
  if (match) return match;
  
  return null;
};

const createFlatStructure = (allDocs) => {
  return allDocs
    .filter(doc => doc.attributes?.fileName?.toLowerCase() !== 'index.html')
    .map(doc => ({
      ...doc,
      id: doc.id,
      type: 'document',
      docId: doc.id,
      displayTitle: doc.attributes?.htmlTitle || doc.attributes?.title || `Document ${doc.id}`,
      children: []
    }));
};
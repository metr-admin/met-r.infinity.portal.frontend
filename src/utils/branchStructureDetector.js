// Fully dynamic branch structure detector - zero hardcoding

export const detectBranchStructure = async (branchName, allDocs) => {
  console.log(`🔍 Auto-detecting structure for branch: ${branchName}`);
  
  // Find all index files in this branch
  const indexFiles = allDocs.filter(doc => {
    const fileName = doc.attributes?.fileName?.toLowerCase() || '';
    return fileName.includes('index') && (fileName.endsWith('.html') || fileName.endsWith('.htm'));
  });
  
  console.log(`📄 Found ${indexFiles.length} index files:`, indexFiles.map(f => f.attributes?.fileName));
  
  if (indexFiles.length === 0) {
    return { type: 'document-based', modules: [], structure: 'flat' };
  }
  
  // Analyze each index file to detect modules and structures
  const modules = [];
  
  for (const indexFile of indexFiles) {
    const fileName = indexFile.attributes?.fileName || '';
    const moduleName = extractModuleName(fileName, branchName);
    
    try {
      const parser = new DOMParser();
      const htmlContent = indexFile.attributes?.bodyContent || 
                         indexFile.attributes?.htmlContent || 
                         indexFile.attributes?.content;
      
      if (!htmlContent) continue;
      
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const structure = analyzeStructurePattern(doc);
      
      modules.push({
        name: moduleName,
        fileName,
        docId: indexFile.id,
        structure: structure.pattern,
        hasNesting: structure.hasNesting,
        elementCount: structure.elementCount,
        confidence: structure.confidence
      });
      
    } catch (error) {
      console.error(`Error analyzing ${fileName}:`, error);
    }
  }
  
  return {
    type: 'index-based',
    modules,
    primaryModule: modules.find(m => m.name === 'main') || modules[0],
    branchName
  };
};

const extractModuleName = (fileName, branchName) => {
  // Remove common prefixes/suffixes
  let name = fileName.toLowerCase()
    .replace(/index\.html?$/i, '')
    .replace(/\.html?$/i, '')
    .replace(/^index[-_]?/i, '')
    .replace(/[-_]index$/i, '');
  
  // If empty, use branch-based naming
  if (!name || name === branchName.toLowerCase()) {
    return 'main';
  }
  
  return name || 'main';
};

const analyzeStructurePattern = (doc) => {
  const patterns = {
    hierarchical: doc.querySelectorAll('ul li ul').length,
    flat: doc.querySelectorAll('ul:not(:has(ul)) li').length,
    headings: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    sections: doc.querySelectorAll('section, .section, [data-section]').length,
    tables: doc.querySelectorAll('table').length,
    custom: doc.querySelectorAll('[data-nav], .nav-custom, [role="navigation"]').length
  };
  
  // Find dominant pattern
  const maxCount = Math.max(...Object.values(patterns));
  const dominantPattern = Object.keys(patterns).find(key => patterns[key] === maxCount);
  
  return {
    pattern: dominantPattern || 'flat',
    hasNesting: patterns.hierarchical > 0,
    elementCount: maxCount,
    confidence: maxCount > 0 ? Math.min(maxCount / 10, 1) : 0,
    patterns
  };
};

export const getOptimalParser = (structure) => {
  const parserMap = {
    hierarchical: 'hierarchical',
    headings: 'heading',
    sections: 'section',
    tables: 'table',
    custom: 'custom',
    flat: 'flat'
  };
  
  return parserMap[structure] || 'flat';
};
import { useQuery } from '@tanstack/react-query';
import { documentationAPI } from '../utils/documentationAPI';
import { detectBranchStructure } from '../utils/branchStructureDetector';
import { parseUniversalNavigation, matchUniversalNavigation } from '../utils/universalNavigationParser';

// Direct hierarchical parser for proper structure
const parseHierarchical = (doc, module) => {
  console.log(`📋 Parsing hierarchical structure for ${module.name}`);
  
  const navSelectors = [
    'nav ul', '.navigation ul', '.sidebar ul', '.toc ul',
    'ul.nav', '#navigation ul', '.content ul', 'body > ul'
  ];

  let navElement = null;
  for (const selector of navSelectors) {
    navElement = doc.querySelector(selector);
    if (navElement) {
      console.log(`✅ Found nav element with: ${selector}`);
      break;
    }
  }

  if (!navElement) {
    const allUls = doc.querySelectorAll('ul');
    for (const ul of allUls) {
      if (ul.querySelectorAll('a').length > 0) {
        navElement = ul;
        console.log('✅ Using UL with links');
        break;
      }
    }
  }

  if (!navElement) {
    console.log('❌ No navigation element found');
    return [];
  }

  return parseNestedList(navElement, module);
};

const parseNestedList = (ulElement, module) => {
  const items = [];
  const directLis = Array.from(ulElement.children).filter(child => child.tagName === 'LI');

  directLis.forEach(li => {
    const link = li.querySelector('a');
    const nestedUl = li.querySelector('ul');
    
    if (!link && !nestedUl) return;

    const title = link?.textContent?.trim() || li.firstChild?.textContent?.trim() || 'Untitled';
    const href = link?.getAttribute('href');
    
    const item = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      href,
      docId: null,
      children: [],
      branchName: module.branchName,
      moduleName: module.name
    };

    if (nestedUl) {
      item.children = parseNestedList(nestedUl, module);
      console.log(`📁 Parent "${title}" has ${item.children.length} children`);
    }
    
    items.push(item);
  });

  return items;
};
import { createStructureFromDocuments } from '../utils/navigationParser';

// Fully dynamic navigation hook - zero hardcoding
export const useUniversalNavigation = (branchName, allDocs) => {
  return useQuery({
    queryKey: ['universalNav', branchName],
    queryFn: async () => {
      if (!branchName || !allDocs?.length) return [];

      console.log(`🚀 Auto-building navigation for branch: ${branchName}`);
      
      // Step 1: Detect branch structure automatically
      const branchStructure = await detectBranchStructure(branchName, allDocs);
      console.log('📊 Detected structure:', branchStructure);
      
      if (branchStructure.type === 'document-based') {
        console.log('📄 No index files found, using document-based structure');
        return createStructureFromDocuments(allDocs);
      }
      
      // Step 2: Use the primary module (usually the main index.html)
      const primaryModule = branchStructure.primaryModule;
      if (!primaryModule) {
        console.log('⚠️ No primary module found, using document fallback');
        return createStructureFromDocuments(allDocs);
      }
      
      console.log(`🔧 Processing primary module: ${primaryModule.name}`);
      
      // Fetch the main index content
      const indexData = await documentationAPI.getDocById(primaryModule.docId);
      const htmlContent = indexData?.data?.attributes?.bodyContent || 
                         indexData?.data?.attributes?.htmlContent || 
                         indexData?.data?.attributes?.content;
      
      if (!htmlContent) {
        console.log('⚠️ No HTML content in primary module');
        return createStructureFromDocuments(allDocs);
      }
      
      // Force hierarchical parsing for proper structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      console.log('🔍 Analyzing HTML structure...');
      console.log('UL elements:', doc.querySelectorAll('ul').length);
      console.log('Nested ULs:', doc.querySelectorAll('ul ul').length);
      
      const navigation = parseHierarchical(doc, primaryModule);
      
      if (navigation.length === 0) {
        console.log('⚠️ No hierarchical structure found');
        return createStructureFromDocuments(allDocs);
      }
      
      // Match with actual documents using hierarchical context
      const matchedNavigation = await matchUniversalNavigation(navigation, allDocs, primaryModule);
      
      console.log(`✅ Final hierarchical navigation:`, matchedNavigation);
      return matchedNavigation;
      

    },
    enabled: !!branchName && !!allDocs?.length,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Hook to get all available modules in a branch
export const useBranchModules = (branchName, allDocs) => {
  return useQuery({
    queryKey: ['branchModules', branchName],
    queryFn: async () => {
      if (!branchName || !allDocs?.length) return [];
      
      const structure = await detectBranchStructure(branchName, allDocs);
      return structure.modules || [];
    },
    enabled: !!branchName && !!allDocs?.length,
    staleTime: 30 * 60 * 1000,
  });
};

// Hook to switch between modules dynamically
export const useModuleNavigation = (branchName, allDocs, selectedModule = null) => {
  return useQuery({
    queryKey: ['moduleNav', branchName, selectedModule],
    queryFn: async () => {
      if (!selectedModule) return [];
      
      console.log(`🔄 Loading navigation for module: ${selectedModule}`);
      
      try {
        const indexData = await documentationAPI.getDocById(selectedModule.docId);
        const htmlContent = indexData?.data?.attributes?.bodyContent || 
                           indexData?.data?.attributes?.htmlContent || 
                           indexData?.data?.attributes?.content;
        
        if (!htmlContent) return [];
        
        const navigation = parseUniversalNavigation(htmlContent, selectedModule);
        return await matchUniversalNavigation(navigation, allDocs, selectedModule);
        
      } catch (error) {
        console.error(`Error loading module ${selectedModule.name}:`, error);
        return [];
      }
    },
    enabled: !!branchName && !!allDocs?.length && !!selectedModule,
    staleTime: 5 * 60 * 1000,
  });
};
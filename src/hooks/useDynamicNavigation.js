import { useQuery } from '@tanstack/react-query';
import { documentationAPI } from '../utils/documentationAPI';
import { parseNavigationStructure as parseStaticNavigation, matchNavigationWithDocs, createStructureFromDocuments, matchNavigationWithDocumentContent } from '../utils/navigationParser';
import { parseNavigationStructure, matchNavigationWithModuleContext, detectModuleStructure } from '../utils/dynamicNavigationParser';

export const useDynamicNavigation = (branchName, allDocs, moduleName = 'default') => {
  return useQuery({
    queryKey: ['dynamicNavigation', branchName, moduleName],
    queryFn: async () => {
      if (!branchName || !allDocs || allDocs.length === 0) return [];

      console.log(`🚀 Building dynamic navigation for module: ${moduleName}`);
      
      // Find index file for this branch/module
      const indexPatterns = ['index.html', 'index.htm', 'main.html', 'home.html', 'readme.html'];
      let indexDoc = null;
      
      // First try to find module-specific index
      if (moduleName !== 'default') {
        for (const pattern of indexPatterns) {
          indexDoc = allDocs.find(doc => {
            const fileName = doc.attributes?.fileName?.toLowerCase() || '';
            return fileName === pattern && fileName.includes(moduleName.toLowerCase());
          });
          if (indexDoc) {
            console.log(`✅ Found module-specific index: ${indexDoc.attributes?.fileName}`);
            break;
          }
        }
      }
      
      // Fallback to general index
      if (!indexDoc) {
        for (const pattern of indexPatterns) {
          indexDoc = allDocs.find(doc => 
            doc.attributes?.fileName?.toLowerCase() === pattern
          );
          if (indexDoc) {
            console.log(`✅ Found general index file: ${pattern}`);
            break;
          }
        }
      }

      if (!indexDoc) {
        console.log('❌ No index file found, using categorized structure');
        const fallbackStructure = createStructureFromDocuments(allDocs);
        return matchNavigationWithDocs(fallbackStructure, allDocs);
      }

      // Fetch the index.html content
      console.log('📄 Fetching index content for module:', moduleName);
      const indexData = await documentationAPI.getDocById(indexDoc.id);
      
      const attributes = indexData?.data?.attributes;
      const htmlContent = attributes?.htmlContent || 
                         attributes?.bodyContent || 
                         attributes?.content;
      
      console.log('🔍 Available attributes:', Object.keys(attributes || {}));
      console.log('🔍 HTML content length:', htmlContent?.length || 0);

      if (!htmlContent) {
        console.log('❌ No HTML content found, using categorized structure');
        const fallbackStructure = createStructureFromDocuments(allDocs);
        return matchNavigationWithDocs(fallbackStructure, allDocs);
      }

      // Use dynamic parser with module awareness
      const navigationStructure = parseNavigationStructure(htmlContent, moduleName);
      
      if (navigationStructure.length === 0) {
        console.log('⚠️ Dynamic parser found nothing, trying static parser...');
        const staticStructure = parseStaticNavigation(htmlContent);
        if (staticStructure.length > 0) {
          const smartMatched = await matchNavigationWithDocumentContent(staticStructure, allDocs);
          return smartMatched;
        } else {
          const fallbackStructure = createStructureFromDocuments(allDocs);
          return matchNavigationWithDocs(fallbackStructure, allDocs);
        }
      }
      
      // Use module-aware matching
      const moduleMatchedNavigation = await matchNavigationWithModuleContext(navigationStructure, allDocs, moduleName);

      console.log(`✅ Final navigation structure for ${moduleName}:`, moduleMatchedNavigation);
      return moduleMatchedNavigation;
    },
    enabled: !!branchName && !!allDocs && allDocs.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Hook for detecting module structure without full parsing
export const useModuleStructureDetection = (branchName, allDocs) => {
  return useQuery({
    queryKey: ['moduleStructure', branchName],
    queryFn: async () => {
      if (!branchName || !allDocs || allDocs.length === 0) return null;
      
      const indexDoc = allDocs.find(doc => 
        doc.attributes?.fileName?.toLowerCase() === 'index.html'
      );
      
      if (!indexDoc) return null;
      
      const indexData = await documentationAPI.getDocById(indexDoc.id);
      const attributes = indexData?.data?.attributes;
      const htmlContent = attributes?.htmlContent || 
                         attributes?.bodyContent || 
                         attributes?.content;
      
      if (!htmlContent) return null;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      return detectModuleStructure(doc, branchName);
    },
    enabled: !!branchName && !!allDocs && allDocs.length > 0,
    staleTime: 30 * 60 * 1000,
  });
};

// Hook for switching between different modules dynamically
export const useModuleSwitcher = (branchName, allDocs) => {
  const { data: moduleStructure } = useModuleStructureDetection(branchName, allDocs);
  
  const switchToModule = (moduleName) => {
    console.log(`🔄 Switching to module: ${moduleName}`);
    // This would trigger a re-fetch with the new module name
    return useDynamicNavigation(branchName, allDocs, moduleName);
  };
  
  return {
    moduleStructure,
    switchToModule,
    availableModules: ['default', 'space-map', 'api-docs', 'user-guide'] // This could be dynamic
  };
};
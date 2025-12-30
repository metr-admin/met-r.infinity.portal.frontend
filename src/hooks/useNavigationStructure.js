import { useQuery } from '@tanstack/react-query';
import { documentationAPI } from '../utils/documentationAPI';
import { parseNavigationStructure, matchNavigationWithDocs, createStructureFromDocuments, matchNavigationWithDocumentContent } from '../utils/navigationParser';

export const useNavigationStructure = (branchName, allDocs) => {
  return useQuery({
    queryKey: ['navigation', branchName],
    queryFn: async () => {
      if (!branchName || !allDocs || allDocs.length === 0) return [];

      console.log('🚀 Building navigation from cached module data...');

      // Check if we can use cached module data
      const cachedModule = window.sidebarCache?.getModuleByBranch(branchName);

      if (cachedModule && cachedModule.indexDocId) {
        console.log(`✅ Using cached index for branch: ${branchName}, indexDocId: ${cachedModule.indexDocId}`);

        // Fetch the index.html content
        const indexData = await documentationAPI.getDocById(cachedModule.indexDocId);
        const attributes = indexData?.data?.attributes;
        const htmlContent = attributes?.htmlContent || attributes?.bodyContent || attributes?.content;

        if (htmlContent) {
          const navigationStructure = parseNavigationStructure(htmlContent);

          if (navigationStructure.length > 0) {
            const smartMatchedNavigation = await matchNavigationWithDocumentContent(navigationStructure, allDocs);
            console.log('✅ Navigation built from cached module');
            return smartMatchedNavigation;
          }
        }
      }

      // Fallback to original logic
      console.log('🔄 Falling back to original navigation logic...');

      const indexPatterns = ['index.html', 'index.htm', 'main.html', 'home.html', 'readme.html'];
      let indexDoc = null;

      for (const pattern of indexPatterns) {
        indexDoc = allDocs.find(doc =>
          doc.attributes?.fileName?.toLowerCase() === pattern
        );
        if (indexDoc) {
          console.log(`✅ Found index file: ${pattern}`);
          break;
        }
      }

      if (!indexDoc) {
        console.log('❌ No index file found, using categorized structure');
        const fallbackStructure = createStructureFromDocuments(allDocs);
        return matchNavigationWithDocs(fallbackStructure, allDocs);
      }

      console.log('📄 Fetching index.html content for branch:', branchName);
      const indexData = await documentationAPI.getDocById(indexDoc.id);

      const attributes = indexData?.data?.attributes;
      const htmlContent = attributes?.htmlContent ||
        attributes?.bodyContent ||
        attributes?.content;

      console.log('🔍 Available attributes:', Object.keys(attributes || {}));
      console.log('🔍 HTML content length:', htmlContent?.length || 0);

      if (!htmlContent) {
        console.log('❌ No HTML content found in index file, using categorized structure');
        const fallbackStructure = createStructureFromDocuments(allDocs);
        return matchNavigationWithDocs(fallbackStructure, allDocs);
      }

      const navigationStructure = parseNavigationStructure(htmlContent);

      if (navigationStructure.length === 0) {
        console.log('⚠️ No navigation structure found in HTML, using categorized structure');
        const fallbackStructure = createStructureFromDocuments(allDocs);
        return matchNavigationWithDocs(fallbackStructure, allDocs);
      }

      const smartMatchedNavigation = await matchNavigationWithDocumentContent(navigationStructure, allDocs);

      console.log('✅ Final navigation structure with smart matching:', smartMatchedNavigation);
      return smartMatchedNavigation;


    },
    enabled: !!branchName && !!allDocs && allDocs.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
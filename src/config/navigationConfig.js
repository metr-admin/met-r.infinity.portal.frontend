// Navigation configuration
export const NAVIGATION_CONFIG = {
  // Breadcrumb configuration
  breadcrumb: {
    separator: '/',
    homeLabel: 'Home',
    fallbackLabel: 'Documentation',
    fallbackPageLabel: 'Current Page'
  },

  // Document matching strategies (in order of preference)
  documentMatchingStrategies: [
    'hierarchical_filename',
    'direct_filename',
    'partial_filename',
    'title_based'
  ],

  // Navigation paths
  routes: {
    home: '/',
    documentation: '/documentation'
  },

  // Document navigation
  documentNavigation: {
    scrollBehavior: 'smooth',
    scrollOffset: 0
  }
};

// Navigation utilities factory
export const createNavigationUtils = (config = NAVIGATION_CONFIG) => {
  return {
    // Generate breadcrumb items
    generateBreadcrumb: (branchName, currentTitle, formatBranchName, navigate) => {
      const breadcrumbs = [
        {
          label: config.breadcrumb.homeLabel,
          onClick: () => navigate(config.routes.home),
          isActive: false
        }
      ];

      // Only add branch breadcrumb if branchName exists
      if (branchName) {
        breadcrumbs.push({
          label: formatBranchName(branchName) || branchName,
          onClick: () => navigate(`${config.routes.documentation}/${branchName}`),
          isActive: false
        });
      }

      // Add current page
      breadcrumbs.push({
        label: currentTitle || config.breadcrumb.fallbackPageLabel,
        onClick: null,
        isActive: true
      });

      return breadcrumbs;
    },

    // Find document using configured strategies
    findDocument: (linkHref, allDocs, hierarchicalDocs) => {
      const [filePath, anchor] = linkHref.split('#');
      const filename = filePath.replace(/^.*\//, '').replace(/^\.\//, '');
      
      const flattenDocs = (docs) => {
        const result = [];
        docs.forEach(doc => {
          if (doc.type === 'document' && doc.docId) {
            result.push(doc);
          }
          if (doc.children && doc.children.length > 0) {
            result.push(...flattenDocs(doc.children));
          }
        });
        return result;
      };
      
      const hierarchicalDocsList = hierarchicalDocs ? flattenDocs(hierarchicalDocs) : [];
      let targetDoc = null;
      
      for (const strategy of config.documentMatchingStrategies) {
        switch (strategy) {
          case 'hierarchical_filename':
            if (hierarchicalDocsList.length > 0) {
              const actualDoc = allDocs.find(doc => doc.id === hierarchicalDocsList.find(hDoc => {
                const docFilename = allDocs.find(d => d.id === hDoc.docId)?.attributes?.fileName || '';
                return docFilename.toLowerCase() === filename.toLowerCase();
              })?.docId);
              if (actualDoc) targetDoc = actualDoc;
            }
            break;
            
          case 'direct_filename':
            targetDoc = allDocs.find(doc => {
              const docFilename = doc.attributes?.fileName || '';
              return docFilename.toLowerCase() === filename.toLowerCase();
            });
            break;
            
          case 'partial_filename':
            const baseName = filename.replace(/\.html$/, '').toLowerCase();
            targetDoc = allDocs.find(doc => {
              const docFilename = (doc.attributes?.fileName || '').replace(/\.html$/, '').toLowerCase();
              return docFilename === baseName;
            });
            break;
            
          case 'title_based':
            const linkTitle = filename.replace(/\.html$/, '').replace(/[-_]/g, ' ').toLowerCase();
            targetDoc = allDocs.find(doc => {
              const docTitle = (doc.attributes?.htmlTitle || doc.attributes?.title || '').toLowerCase();
              return docTitle.includes(linkTitle) || linkTitle.includes(docTitle);
            });
            break;
        }
        
        if (targetDoc) break;
      }
      
      return { targetDoc, anchor };
    },

    // Navigate to document
    navigateToDocument: (targetDoc, anchor, onDocSelect) => {
      if (targetDoc) {
        onDocSelect(targetDoc.id, anchor);
        window.scrollTo({ 
          top: config.documentNavigation.scrollOffset, 
          behavior: config.documentNavigation.scrollBehavior 
        });
        return true;
      }
      return false;
    },

    // Flatten hierarchical documents
    flattenHierarchicalDocs: (hierarchicalDocs) => {
      const result = [];
      hierarchicalDocs.forEach(doc => {
        if (doc.type === 'document' && doc.docId) {
          result.push(doc);
        }
        if (doc.children && doc.children.length > 0) {
          result.push(...this.flattenHierarchicalDocs(doc.children));
        }
      });
      return result;
    },

    // Get navigation context (prev/next)
    getNavigationContext: (currentDoc, hierarchicalDocs) => {
      if (!hierarchicalDocs || hierarchicalDocs.length === 0) {
        return { prevDoc: null, nextDoc: null };
      }
      
      const flattenDocs = (docs) => {
        const result = [];
        docs.forEach(doc => {
          if (doc.type === 'document' && doc.docId) {
            result.push(doc);
          }
          if (doc.children && doc.children.length > 0) {
            result.push(...flattenDocs(doc.children));
          }
        });
        return result;
      };
      
      const navigableDocs = flattenDocs(hierarchicalDocs);
      const currentIndex = navigableDocs.findIndex(doc => doc.docId === currentDoc?.id);
      
      return {
        prevDoc: currentIndex > 0 ? navigableDocs[currentIndex - 1] : null,
        nextDoc: currentIndex < navigableDocs.length - 1 ? navigableDocs[currentIndex + 1] : null
      };
    }
  };
};
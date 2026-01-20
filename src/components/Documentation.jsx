import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './documentation/Header';
import Sidebar from './documentation/Sidebar';
import MainContent from './documentation/MainContent';
import Footer from './documentation/Footer';
import { PageLoader, ErrorDisplay } from './Loader';
import { useDocsByRepository, useAllDocs, useDocById } from '../hooks/useDocumentation';
import { processDocumentHierarchy } from '../utils/hierarchyProcessor';
import { sidebarCache } from '../utils/sidebarIndexCache';
import { SearchProvider } from '../context/SearchContext';

const Documentation = () => {
  const { branchName } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Redirect to home if no branchName (but not if we have pending navigation)
  useEffect(() => {
    if (!branchName && !window.__pendingDocNavigation) {
      navigate('/', { replace: true });
    }
  }, [branchName, navigate]);

  const { data: docsData, isLoading: loading, error } = branchName
    ? useDocsByRepository(branchName)
    : useAllDocs();

  const allDocs = docsData?.data || [];

  // Reset selected doc when branch changes
  useEffect(() => {
    setSelectedDocId(null);
  }, [branchName]);

  // Process documents into hierarchical structure
  const hierarchicalDocs = useMemo(() => {
    return processDocumentHierarchy(allDocs);
  }, [allDocs]);

  // Expose sidebar cache globally (initialized in App.jsx)
  useEffect(() => {
    window.sidebarCache = sidebarCache;
  }, []);

  useEffect(() => {
    const handleNavigateToDoc = (event) => {
      const { filepath } = event.detail;
      if (filepath && sidebarCache.isReady()) {
        setPendingNavigation({ filepath });
      }
    };

    // Check for pending navigation
    if (window.__pendingDocNavigation && branchName) {
      const pending = window.__pendingDocNavigation;
      window.__pendingDocNavigation = null;
      setPendingNavigation(pending);
    }

    window.addEventListener('navigateToDoc', handleNavigateToDoc);
    return () => window.removeEventListener('navigateToDoc', handleNavigateToDoc);
  }, [branchName]);

  // Process pending navigation once docs are loaded
  useEffect(() => {
    if (pendingNavigation && allDocs.length > 0 && sidebarCache.isReady()) {
      const { filepath } = pendingNavigation;
      const docId = sidebarCache.getDocIdByFilepath(filepath);

      console.log('🔍 Navigation attempt:', { filepath, docId, currentBranch: branchName });

      if (docId) {
        console.log('🎯 Found doc ID:', docId);
        setSelectedDocId(docId);
        
        // Notify ChatModal that navigation is complete
        window.dispatchEvent(new CustomEvent('docNavigationComplete'));
      } else {
        console.warn('⚠️ No doc found for filepath:', filepath);
      }
      
      setPendingNavigation(null);
    }
  }, [pendingNavigation, allDocs, branchName]);

  // Get first available document ID for initial selection
  const getFirstDocId = useMemo(() => {
    if (!hierarchicalDocs?.length) return null;

    // Find first document in hierarchical structure
    const findFirstDoc = (items) => {
      for (const item of items) {
        if (item.type === 'document' && item.docId) {
          return item.docId;
        }
        if (item.children?.length > 0) {
          const childDoc = findFirstDoc(item.children);
          if (childDoc) return childDoc;
        }
      }
      return null;
    };

    return findFirstDoc(hierarchicalDocs);
  }, [hierarchicalDocs]);

  // Reset selectedDocId when branchName changes
  useEffect(() => {
    if (branchName) {
      setSelectedDocId(null);
    }
  }, [branchName]);

  const docIdToFetch = selectedDocId || getFirstDocId;
  const { data: currentDocData } = useDocById(docIdToFetch);
  const currentDoc = currentDocData?.data;

  // Debug logging
  console.log('Documentation Debug:', {
    allDocsCount: allDocs?.length,
    hierarchicalDocsCount: hierarchicalDocs?.length,
    selectedDocId,
    getFirstDocId,
    docIdToFetch,
    currentDoc: currentDoc?.id,
    hierarchicalDocs: hierarchicalDocs?.slice(0, 2) // First 2 items for debugging
  });

  const handleDocSelect = (docId, anchor = null) => {
    setSelectedDocId(docId);

    // Handle anchor navigation after document loads
    if (anchor) {
      setTimeout(() => {
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  if (!branchName) {
    return null;
  }

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#fbf8f8] flex items-center justify-center">
        <ErrorDisplay message={error?.message || 'Failed to load documentation'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <SearchProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen w-full bg-[#fbf8f8] overflow-x-hidden"
      >
        <div className="bg-[#fbf8f8] relative min-h-screen w-full max-w-[1440px] mx-auto">
          <Header
            currentDoc={currentDoc}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            allDocs={allDocs}
            onDocSelect={handleDocSelect}
          />
          <div className="flex relative min-h-0">
            <Sidebar
              allDocs={allDocs}
              hierarchicalDocs={hierarchicalDocs}
              currentDoc={currentDoc}
              onDocSelect={handleDocSelect}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <MainContent
              currentDoc={currentDoc}
              allDocs={allDocs}
              onDocSelect={handleDocSelect}
              hierarchicalDocs={hierarchicalDocs}
            />
          </div>
          <Footer />
        </div>
      </motion.div>
    </SearchProvider>
  );
};

export default Documentation;
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './documentation/Header';
import Sidebar from './documentation/Sidebar';
import MainContent from './documentation/MainContent';
import Footer from './documentation/Footer';
import { PageLoader, ErrorDisplay } from './Loader';
import { useDocsByRepository, useAllDocs, useDocById } from '../hooks/useDocumentation';
import { processDocumentHierarchy } from '../utils/hierarchyProcessor';

const Documentation = () => {
  const { branchName } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const { data: docsData, isLoading: loading, error } = branchName
    ? useDocsByRepository(branchName)
    : useAllDocs();

  const allDocs = docsData?.data || [];
  
  // Process documents into hierarchical structure
  const hierarchicalDocs = useMemo(() => {
    return processDocumentHierarchy(allDocs);
  }, [allDocs]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full bg-[#fbf8f8] overflow-x-hidden"
    >
      <div className="bg-[#fbf8f8] relative min-h-screen w-full max-w-[1440px] mx-auto">
        <Header currentDoc={currentDoc} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
  );
};

export default Documentation;
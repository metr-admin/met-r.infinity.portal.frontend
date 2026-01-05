import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { formatBranchName } from '../utils/formatBranchName';
import { ErrorDisplay } from './Loader';
import { useApp } from '../context/AppContext';
import { sidebarCache } from '../utils/sidebarIndexCache';
import logoImg from '../assets/images/Logo.png';
import vectorSvg from '../assets/svg/Vector.svg';
import vector1Svg from '../assets/svg/Vector-1.svg';
import vector2Svg from '../assets/svg/Vector-2.svg';
import ellipse1476 from '../assets/svg/Ellipse 1476.svg';
import ellipse1477 from '../assets/svg/Ellipse 1477.svg';
import subtractSvg from '../assets/svg/Subtract.svg';
import maskGroupSvg from '../assets/svg/Mask Group.svg';
import documentIcon from '../assets/svg/icons8-document-128.png';
import aiSearchIcon from '../assets/svg/ai search.png';
import MobileMenu from './MobileMenu';

const Homepage = () => {
  const navigate = useNavigate();
  const { openChat, repositories, repositoriesLoading: loading, repositoriesError: error } = useApp();

  // Initialize sidebar cache on mount
  useEffect(() => {
    sidebarCache.initialize();
  }, []);

  // Bold Metallic colors for cards
  const cardColors = [
    'bg-gradient-to-br from-[#60a5fa] via-[#93c5fd] to-[#3b82f6] shadow-blue-500/50', // Light Space Blue
    'bg-gradient-to-br from-[#a78bfa] via-[#c4b5fd] to-[#8b5cf6] shadow-purple-500/50', // Light Purple
    'bg-gradient-to-br from-[#fbbf24] via-[#fcd34d] to-[#f59e0b] shadow-yellow-500/50', // Light Golden
    'bg-gradient-to-br from-[#f87171] via-[#fca5a5] to-[#ef4444] shadow-red-500/50', // Light Red
    'bg-gradient-to-br from-[#fb923c] via-[#fdba74] to-[#f97316] shadow-orange-500/50', // Light Orange
    'bg-gradient-to-br from-[#34d399] via-[#6ee7b7] to-[#10b981] shadow-green-500/50'  // Light Green
  ];

  // Handle card click - navigate to documentation with branch name
  const handleCardClick = (branchName) => {
    console.log('Navigating to branch:', branchName);
    if (branchName) {
      navigate(`/documentation/${encodeURIComponent(branchName)}`);
    } else {
      navigate('/documentation');
    }
  };

  return (
    <>
      {/* Mobile Menu - Rendered outside main container */}
      <MobileMenu />
      
      <div className="w-full min-h-screen bg-[#fbf8f8]">
        <div className="bg-[#fbf8f8] relative min-h-screen w-full max-w-[1440px] mx-auto">
          
          {/* Hero Section */}
          <section className="hero-section relative h-[645px] w-full overflow-hidden">
            
            {/* Background Decorative Elements */}
            <div className="absolute -bottom-2 -right-0  opacity-100 opacity-100">
              <img src={vector1Svg} alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="absolute -bottom-2 -right-0  opacity-100">
              <img src={vector2Svg} alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="absolute -right-26 -bottom-26 rotate-[0deg] opacity-100">
              <img src={vectorSvg} alt="" className="w-full h-full object-cover" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-20 py-4">
              {/* Logo */}
              <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <img src={logoImg} alt="MetR Logo" className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain" />
              </a>

              {/* Navigation Menu - Hidden on mobile */}
              <nav className="hidden lg:flex gap-12 items-center absolute left-1/2 transform -translate-x-1/2">
                <a 
                  href="#modules" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-semibold text-lg text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200"
                >
                  Modules
                </a>
                {/* <a 
                  href="https://metapercept.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-lg text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200"
                >
                  About
                </a> */}
              </nav>
              
              {/* Mobile Menu Button Placeholder */}
              <div className="lg:hidden w-8 h-8"></div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 mt-8 sm:mt-12 lg:mt-24">
              <h1 className="font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] text-[#3d3e3f] mb-3 sm:mb-4 leading-tight max-w-4xl">
                How can we help you
              </h1>
              <p className="text-sm sm:text-base lg:text-xl text-[#3d3e3f] mb-6 sm:mb-8 max-w-2xl px-4">
                Search here to get answers to your questions
              </p>

              {/* Search Bar */}
              <div className="w-full max-w-md lg:max-w-xl mb-4">
                <div 
                  onClick={() => openChat('general')}
                  className="relative bg-white backdrop-blur-md rounded-full h-12 lg:h-14 flex items-center px-4 lg:px-6 cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-gray-300 hover:border-[#266EF6] group shadow-lg"
                >
                  <div className="flex items-center gap-3 text-gray-600 text-sm lg:text-base w-full">
                    <img 
                      src={aiSearchIcon} 
                      alt="AI Search" 
                      className="w-6 h-6 lg:w-8 lg:h-8 opacity-80 group-hover:opacity-100 transition-opacity duration-300 filter brightness-0 saturate-100 flex-shrink-0"
                    />
                    <span className="group-hover:text-[#266EF6] transition-colors duration-300">AI Search for the Documentation...</span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#266EF6]/5 to-[#7c3aed]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Recommended Topics Section */}
          <section id="modules" className="relative py-16 lg:py-24 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute left-1/2 top-16 transform -translate-x-1/2 w-[400px] lg:w-[699px] h-[400px] lg:h-[699px] opacity-15">
              <img src={subtractSvg} alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="absolute left-[360px] top-80 lg:top-[550px] transform -translate-x-1/2 w-32 lg:w-[202px] h-32 lg:h-[202px]">
              <img src={ellipse1477} alt="" className="w-full h-full object-cover opacity-50" />
            </div>

            <div className="absolute right-8 lg:right-[185px] top-20 lg:top-[92px] w-16 lg:w-[79px] h-16 lg:h-[79px]">
              <img src={ellipse1476} alt="" className="w-full h-full object-cover opacity-20" />
            </div>

            <div className="relative z-10 container mx-auto px-6">
              {/* Section Title */}
              <div className="text-center mb-12 lg:mb-16">
                <h2 className="font-bold text-2xl lg:text-4xl text-[#3d3e3f] mb-4">
                  Infinity Modules
                </h2>
                <p className="text-base lg:text-xl text-[#3d3e3f] max-w-3xl mx-auto px-4">
                  Loaded with awesome features like AI Search, Documentation,<br className="hidden lg:block" />
                  Knowledge base & more!
                </p>
              </div>

              {/* Topic Cards - Dynamic from API */}
              <div className="relative">
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-100 z-0">
                  <img src={subtractSvg} alt="" className="w-full h-full object-contain" />
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative w-12 h-12">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 border-4 border-gray-200 border-t-accent-blue rounded-full"
                        />
                      </div>
                      <p className="text-lg text-gray-500">Loading modules...</p>
                    </motion.div>
                  </div>
                ) : error ? (
                  <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-12 relative z-10 max-w-6xl mx-auto px-4">
                    {repositories.slice(0, 9).map((repo, index) => {
                      const branchName = repo.attributes?.branch;
                      const displayName = formatBranchName(branchName);
                      
                      return (
                        <TopicCard 
                          key={repo.id}
                          icon={documentIcon} 
                          title={displayName || `Module ${index + 1}`} 
                          bgColor={cardColors[index % cardColors.length]}
                          onClick={() => handleCardClick(branchName)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-white py-8 px-6">
            {/* Divider Section */}
            <div className="relative pb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-30"></div>
              <div className="relative flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#266EF6]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#266EF6] shadow-lg"></div>
                  <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#266EF6]"></div>
                </div>
              </div>
            </div>
            
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Left side - Logo and Links */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                  {/* Logo */}
                  <a href="/" className="hover:opacity-80 transition-opacity">
                    <img src={logoImg} alt="MetR Logo" className="w-16 h-16 object-contain" />
                  </a>
                  
                  {/* Navigation Links */}
                  <div className="flex flex-wrap items-center gap-1 text-base text-gray-700">
                    <a href="https://metapercept.com/" target="_blank"  className="hover:text-[#266EF6] transition-colors">Metapercept.com</a>
                    <span className="mx-2 text-gray-400">/</span>
                    {/* <a href="#" className="hover:text-[#266EF6] transition-colors">Legal</a>
                    <span className="mx-2 text-gray-400">/</span>
                    <a href="#" className="hover:text-[#266EF6] transition-colors">Feedback</a>
                    <span className="mx-2 text-gray-400">/</span> */}
                    <a href="https://metapercept.com/contact" target="_blank" className="hover:text-[#266EF6] transition-colors">Contact Support</a>
                  </div>
                </div>
              </div>
              
              {/* Copyright Text - Below on mobile, same line on desktop */}
              <div className="mt-4 lg:mt-2">
                <p className="text-base text-gray-600">
                  Copyright © 2025-2026 Metapercept Technology Services LLP • metR is the registered product under this copyright.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

// Topic Card Component - Rectangular Design
const TopicCard = ({ icon, title, bgColor, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl relative hover:bg-opacity-90 transition-all duration-300 hover:shadow-xl w-full h-32 sm:h-36 lg:h-40 p-4 sm:p-6 cursor-pointer group border border-gray-200/50 shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 h-full">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0 backdrop-blur-sm border border-white/30 shadow-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 rounded-xl"></div>
          <img src={icon} alt="" className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 drop-shadow-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-[#3d3e3f] group-hover:text-[#266EF6] transition-colors duration-300 leading-tight truncate">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
            Click to explore
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Homepage;
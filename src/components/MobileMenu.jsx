import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Menu Button - Fixed position */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 sm:right-6 flex flex-col justify-center items-center w-8 h-8 space-y-1 z-[99999]"
        aria-label="Toggle mobile menu"
      >
        <span className={`block w-6 h-0.5 bg-[#3d3e3f] transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
        <span className={`block w-6 h-0.5 bg-[#3d3e3f] transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block w-6 h-0.5 bg-[#3d3e3f] transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998] bg-black bg-opacity-50"
            onClick={toggleMenu}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-[99999]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col p-6 space-y-6 pt-16">
                <nav className="flex flex-col space-y-4">
                  <motion.a
                    whileHover={{ x: 5 }}
                    href="#modules"
                    className="font-semibold text-xl text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
                      toggleMenu();
                    }}
                  >
                    Modules
                  </motion.a>
                  {/* <motion.a
                    whileHover={{ x: 5 }}
                    href="https://metapercept.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-xl text-[#3d3e3f] hover:text-[#266EF6] transition-colors duration-200"
                    onClick={toggleMenu}
                  >
                    About
                  </motion.a> */}
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileMenu;
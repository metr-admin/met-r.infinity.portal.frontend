import React from 'react';
import logoImg from '../../assets/images/Logo.png';

const Footer = () => {
  return (
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
              <a href="https://metapercept.com/" target="_blank" className="hover:text-[#266EF6] transition-colors">Metapercept.com</a>
              <span className="mx-2 text-gray-400">/</span>
              {/* <a href="#" className="hover:text-[#266EF6] transition-colors">Legal</a>
              <span className="mx-2 text-gray-400">/</span>
              <a href="#" className="hover:text-[#266EF6] transition-colors">Feedback</a>
              <span className="mx-2 text-gray-400">/</span> */}
              <a href="https://metapercept.com/contact  " target="_blank" className="hover:text-[#266EF6] transition-colors">Contact Support</a>
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
  );
};

export default Footer;
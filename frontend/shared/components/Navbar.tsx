// src/shared/components/Navbar.tsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AccountType } from '../types/user.types';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.accountType) {
      case AccountType.COACH:
        return '/coach';
      case AccountType.ATHLETE_LIMITED:
        return '/athlete';
      case AccountType.INDIVIDUAL:
        return '/dashboard';
      case AccountType.ADMIN:
        return '/admin';
      default:
        return '/';
    }
  };

  const getUserInitial = () => {
    if (!user?.firstName) return '?';
    return user.firstName.charAt(0).toUpperCase();
  };

  const getFullName = () => {
    if (!user) return 'User';
    return `${user.firstName} ${user.lastName}`.trim() || 'User';
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-neutral-100' 
        : 'bg-white/60 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-400 blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative">
               <img src = "../../assets/Movaia_logo.png"  id = "brandlogo"></img>
              </div>
            </div>
           
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated && user && (
              <>
                <Link
                  to={getDashboardLink()}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isActiveRoute(getDashboardLink())
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  Dashboard
                </Link>
                
                {user.accountType === AccountType.COACH && (
                  <Link
                    to="/coach/athletes"
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActiveRoute('/coach/athletes')
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    Athletes
                  </Link>
                )}

                {(user.accountType === AccountType.INDIVIDUAL || 
                  user.accountType === AccountType.COACH) && (
                  <>
                    <Link
                      to="/analyses"
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActiveRoute('/analyses')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      Analyses
                    </Link>
                    <Link
                      to="/exercises"
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActiveRoute('/exercises')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      Exercises
                    </Link>

                    <Link
                      to="/progress"
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActiveRoute('/progress')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      Progress
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-neutral-50 transition-all duration-200 group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold text-sm">
                        {getUserInitial()}
                      </span>
                    </div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-neutral-900">{getFullName()}</p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {user.accountType.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-luxury border border-neutral-100 overflow-hidden animate-slide-down">
                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-white border-b border-neutral-100">
                      <p className="text-sm font-semibold text-neutral-900">{getFullName()}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
                      <div className="mt-2">
                        <span className="badge badge-primary">
                          {user.accountType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      
                      
                      <hr className="my-2 border-neutral-100" />
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-neutral-700 font-medium hover:text-neutral-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-luxury"
                >
                  <span>Get Started</span>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-100 animate-slide-down">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="block px-4 py-3 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                {user.accountType === AccountType.COACH && (
                  <Link
                    to="/coach/athletes"
                    className="block px-4 py-3 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Athletes
                  </Link>
                )}

                {(user.accountType === AccountType.INDIVIDUAL || 
                  user.accountType === AccountType.COACH) && (
                  <>
                    <Link
                      to="/analyses"
                      className="block px-4 py-3 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Analyses
                    </Link>
                    <Link
                      to="/exercises"
                      className="block px-4 py-3 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Exercises
                    </Link>
                    <Link
                      to="/progress"
                      className="block px-4 py-3 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Progress
                    </Link>


                  </>
                )}

                <hr className="my-2 border-neutral-100" />
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-3 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-3 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
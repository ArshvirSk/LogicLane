import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import NavLogo from "../assets/logo.png";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../services/AuthContext";
import ProfileImage from "./ProfileImage";

const Navbar = () => {
  const location = useLocation();
  const { currentUser, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z"
          />
        </svg>
      ),
    },
    {
      path: "/",
      label: "Traffic Map",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
    },
    // {
    //   path: "/dashboard",
    //   label: "Dashboard",
    //   icon: (
    //     <svg
    //       className="w-5 h-5"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
    //       />
    //     </svg>
    //   ),
    // },
    // {
    //   path: "/reports",
    //   label: "Reports",
    //   icon: (
    //     <svg
    //       className="w-5 h-5"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    //       />
    //     </svg>
    //   ),
    // },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section - Responsive */}
          <div className="flex items-center space-x-1 sm:space-x-2 select-none flex-1 min-w-0">
            <img
              src={NavLogo}
              draggable="false"
              alt="Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
            />
            <div className="min-w-0 sm:block hidden">
              <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-blue-500 dark:text-blue-400 truncate">
                LogicLane
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block truncate">
                The intelligent way to navigate urban congestion
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {/* Navigation Menu */}
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${location.pathname === item.path
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>

            {/* Stats Bar */}
            <div className="text-center">
              <div className="text-base xl:text-lg font-bold text-blue-600 dark:text-blue-400">
                8
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Areas
              </div>
            </div>

            {/* Authentication Section */}
            <div className="hidden lg:block">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                    className="flex items-center w-full px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ProfileImage
                      src={currentUser.photoURL}
                      alt="Profile"
                      size="h-8 w-8"
                      fallbackText={
                        userProfile?.displayName?.charAt(0)?.toUpperCase() ||
                        currentUser.email?.charAt(0)?.toUpperCase() ||
                        "U"
                      }
                      className="mr-3"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium dark:text-white text-gray-900 truncate">
                        {userProfile?.displayName || "User"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${desktopDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {desktopDropdownOpen && (
                    <>
                      {/* Backdrop for desktop dropdown */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setDesktopDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          onClick={() => setDesktopDropdownOpen(false)}
                        >
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Profile Settings
                          </div>
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setDesktopDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign Out
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block w-full px-3 py-2 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full px-3 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Profile/Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Dark Mode Toggle - Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>

            {currentUser ? (
              <button
                onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ProfileImage
                  src={currentUser.photoURL}
                  alt="Profile"
                  size="h-8 w-8"
                  fallbackText={
                    userProfile?.displayName?.charAt(0)?.toUpperCase() ||
                    currentUser.email?.charAt(0)?.toUpperCase() ||
                    "U"
                  }
                />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Dropdown Menu (Profile) */}
          {mobileDropdownOpen && currentUser && (
            <div className="lg:hidden absolute top-16 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px]">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userProfile?.displayName || "User"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser.email}
                </div>
              </div>
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setMobileDropdownOpen(false)}
              >
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile Settings
                </div>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
              >
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/20 z-40 top-16"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Slide-out Menu */}
        <div
          className={`lg:hidden fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 shadow-2xl z-[999] transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="p-4 space-y-4">
            {/* Stats in Mobile Menu */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Areas Monitored
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === item.path
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

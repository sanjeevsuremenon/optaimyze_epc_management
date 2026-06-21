import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import SwitchComponent from "./Switch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHomeUser,
  faAddressCard,
  faCircleQuestion,
  faPeopleGroup,
  faSignInAlt,
  faRightFromBracket,
  faChevronDown,
  faChevronUp,
  faKey,
  faUser,
  faCalendar,
  faGlobe,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

function HeaderNewComponent() {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const isAuthenticated = status === "authenticated" && !!session?.user;
  const router = useRouter();

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Main navigation items with sublinks
  const navigationItems = [
    {
      label: "Projects",
      icon: faCircleQuestion,
      href: "/projects1",
      sublinks: [
        { href: "/projects1", label: "Projects" },
        { href: "/projectdetails", label: "Project Details" },
        { href: "/openprojects", label: "Open Projects- open PO's" },
        { href: "/tracking", label: "Tracking" },
        { href: "/lessons-learnt", label: "Lessons Learnt" },
        { href: "/longleadpackages", label: "Long Lead Material Packages" },
      ]
    },
    {
      label: "Materials",
      icon: faPeopleGroup,
      href: "/materials1",
      sublinks: [
        { href: "/materials1", label: "Materials" },
        { href: "/materialdocuments", label: "Material Docs" },
        { href: "/material-groups", label: "Material Groups" },
        { href: "/reqmatcode", label: "New Matcode" },
        { href: "/material-standardization", label: "Standardize Materials" },
      ]
    },
    {
      label: "Purchase Orders",
      icon: faAddressCard,
      href: "/openpurchaseorders1",
      sublinks: [
        { href: "/openpurchaseorders1", label: "Open PO" },
        { href: "/purchaseordersearch", label: "PO Complete Details" },
        { href: "/po-alert-report", label: "PO Alerts" },
        { href: "/purchases-report", label: "Comprehensive Purchases Report" },
      ]
    },
    {
      label: "Vendors",
      icon: faAddressCard,
      href: "/vendors1",
      sublinks: [
        { href: "/vendors1", label: "Vendors" },
        { href: "/vendor-dashboard", label: "Vendor Dashboard" },
        { href: "/vendor-extract", label: "Vendor Extract (OpenAI)" },
        { href: "/vendorswithpo", label: "Vendor Details" },
        { href: "/vendorswithpo/not-evaluated-fixed", label: "Not Evaluated (Fixed Scores)" },
        { href: "/vendorevaluation/webformat", label: "Vendor Evaluation" },
        { href: "/nonsapvendors", label: "Non SAP Vendors" },
        { href: "/vendors/group-mapping", label: "Vendor Mapping" },
        { href: "/vendors/with-po-mapping", label: "Vendors with PO – Map Groups" },
        { href: "/vendor-feedback", label: "Vendor Feedback" },
        { href: "/vendordocupload", label: "Upload Documents" },
        { href: "/vendor-reports/no-purchaseorders", label: "Vendors w/o PO" },
        { href: "/vendor-reports/with-po-no-docs", label: "Vendors w/ PO - No Docs" },
        { href: "/vendor-reports/po-missing-docs", label: "Vendors w/ PO - Missing Docs" },
        { href: "/vendor-group-mapping", label: "Map groups to vendors" },
        
        {href: "/vendorevaluation/pdf/new", label: "Vendor Evaluation PDF"},
        { href: "#", label: "View Documents" },
      ]
    },
    {
      label: "Global Masters",
      icon: faGlobe,
      href: "/globalmastersdashboard",
      sublinks: [
        { href: "/global-masters", label: "Global Masters" }
      ]
    },
    ...(session?.user?.role === "admin" ? [{
      label: "Data Load",
      icon: faUpload,
      href: "/data-load",
      sublinks: [
        { href: "/data-load", label: "Data Load" }
      ]
    }] : [])
  ];

  const handleDropdownToggle = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleLinkClick = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="shadow-lg sticky top-0 z-50">
      <div className="bg-gradient-to-r from-sky-200 to-blue-500 px-4 py-2">
        {/* Main Container */}
        <div className="grid grid-cols-6 gap-4 items-center">
          
          {/* Left Section (1/6) - Logo */}
          <div className="col-span-1 flex justify-center">
            <Link href="/" onClick={handleLinkClick} className="flex items-center">
                <Image
                  src="/images/JAL_LOGO.jpg"
                  width={70}
                  height={70}
                  alt="JAL"
                  className="rounded shadow"
                />
            </Link>
          </div>

          {/* Middle Section (4/6) - Navigation */}
          <div className="col-span-4 flex justify-center">
            <div className="flex items-center gap-2">
              {/* Home Link */}
              <Link 
                href="/"
                onClick={handleLinkClick}
                className="px-4 py-2 rounded font-bold text-sm text-sky-900 bg-sky-300 hover:bg-sky-100 flex items-center gap-2 transition-all shadow-sm"
                style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}
              >
                  <FontAwesomeIcon icon={faHomeUser} className="text-sky-800 font-bold text-sm" />
                  Home
              </Link>

              {/* Project Document Link */}
              <Link 
                href="/projectmeetings"
                onClick={handleLinkClick}
                className="px-4 py-2 rounded font-bold text-sm text-sky-900 bg-sky-300 hover:bg-sky-100 flex items-center gap-2 transition-all shadow-sm"
                style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}
              >
                  <FontAwesomeIcon icon={faCalendar} className="text-sky-800 font-bold text-sm" />
                  Project Document
              </Link>

              {/* Main Navigation Items with Dropdowns */}
              {navigationItems.map((item, index) => (
                <div key={item.label} className="relative">
                  <button
                    className="px-4 py-2 rounded font-black text-xs text-app-text hover:text-stone-900 bg-sky-600 hover:bg-sky-200 flex items-center gap-2 transition-all shadow-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}
                    onClick={() => handleDropdownToggle(index)}
                  >
                    <FontAwesomeIcon icon={item.icon} className="text-zinc-50 font-bold text-lg" />
                    {item.label}
                    <FontAwesomeIcon 
                      icon={activeDropdown === index ? faChevronUp : faChevronDown} 
                      className="text-xs" 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdown === index && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-2">
                        {item.sublinks.map((sublink) => (
                          <Link
                            key={sublink.href}
                            href={sublink.href}
                            onClick={handleLinkClick}
                            className="block px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                              <div className="flex items-center">
                                <span className="whitespace-nowrap">{sublink.label}</span>
                              </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Section (1/6) - User Session & Theme Switch */}
          <div className="col-span-1 flex items-center justify-end gap-6">
            <div>
              <SwitchComponent setTheme={setTheme} theme={theme} />
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-app-text text-lg" />
                  <div className="text-stone-50 tracking-wider text-sm truncate max-w-24">
                    {session.user.name || session.user.email}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <button
                      className="text-app-text hover:text-blue-200 transition-colors duration-200 p-1"
                      onClick={() => router.push("/auth/change-password")}
                      title="Change Password"
                    >
                      <FontAwesomeIcon icon={faKey} className="text-lg" />
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-app-text text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Change Password
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                  <div className="relative group">
                    <button
                      className="text-app-text hover:text-red-300 transition-colors duration-200 p-1"
                      onClick={() => signOut()}
                      title="Sign Out"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} className="text-lg" />
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-app-text text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Sign Out
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : status === "loading" ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-app-text">Checking session...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/auth/register"
                  className="px-3 py-1.5 rounded font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                    Register
                </Link>
                <Link 
                  href="/auth/login"
                  className="px-3 py-1.5 rounded font-semibold text-sm text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 shadow-sm flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faSignInAlt} className="text-sm" />
                    Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {activeDropdown !== null && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </nav>
  );
}

export default HeaderNewComponent;

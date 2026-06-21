import React from "react";
import Image from "next/image";

import { useTheme } from "next-themes";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import SwitchComponent from "./Switch";
import Link from "next/link";

// Lottie imports moved to client-side only to avoid SSR issues

// import { Link, animateScroll as scroll } from "react-scroll";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHomeUser,
  faAddressCard,
  faCircleQuestion,
  faPeopleGroup,
  faSignInAlt,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

function HeaderComponent() {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = status === "authenticated" && !!session?.user;

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  const path = useRouter().asPath;
  // console.log(path)

  if (!mounted) return null;

  // Top row nav items
  const topNavItems = [
    { href: "/", label: "Home", icon: faHomeUser },
    { href: "/materials1", label: "Materials", icon: faPeopleGroup },
    { href: "/projects1", label: "Projects", icon: faCircleQuestion },
    { href: "/vendors1", label: "Vendors", icon: faAddressCard },
    { href: "/tracking", label: "Tracking", icon: faCircleQuestion },
  ];
  // Bottom row nav items
  const bottomNavItems = [
    { href: "/openpurchaseorders1", label: "Open PO's" },
    { href: "/po-alert-report", label: "PO Alerts", highlight: true },
    { href: "/vendorswithpo", label: "Vendor Details" },
    { href: "/vendorswithpo/not-evaluated-fixed", label: "Not Evaluated (Fixed)", highlight: true },
    { href: "/vendorevaluation/pdf/new", label: "Vendor eval-PDF" },
    { href: "/vendorevaluation/webformat", label: "Vendor Evaluation" },
    { href: "/nonsapvendors", label: "Non SAP Vendors" },
    { href: "/projectdetails", label: "Project Details" },
    { href: "/materialdocuments", label: "Material Docs" },    
    { href: "/reqmatcode", label: "new Matcode", highlight: true },
    { href: "/vendors/group-mapping", label: "Vendor Mapping", highlight: true },
    { href: "/material-groups", label: "Material Groups", highlight: true },
    { href: "/vendor-feedback", label: "Vendor Feedback", highlight: true },
  ];

  return (
    <nav className="shadow-lg sticky top-0 z-50">
      <div className="bg-gradient-to-r from-sky-200 to-blue-500 px-4 py-2">
        {/* Main 3-Grid Container */}
        <div className="grid grid-cols-6 gap-4 items-center">
          
          {/* Left Section (1/6) - Logo */}
          <div className="col-span-1 flex justify-center">
            <Link href="/" className="flex items-center">
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
          <div className="col-span-4 flex flex-col gap-2">
            {/* Top Row Navigation */}
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {topNavItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="px-4 py-1 rounded font-bold text-[10px] text-sky-900 bg-sky-100 hover:bg-sky-200 flex items-center gap-2 transition-all shadow-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}
                >
                    <span className="flex items-center gap-2">
                      {item.icon && (
                        <FontAwesomeIcon icon={item.icon} className="text-sky-800 font-bold text-lg" />
                      )}
                      {item.label}
                    </span>
                </Link>
              ))}
            </div>

            {/* Bottom Row Navigation */}
            <div className="flex flex-wrap gap-0.5 justify-center items-center overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
              {bottomNavItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`px-1.5 py-0.5 rounded font-medium text-[11px] transition-colors whitespace-nowrap flex items-center gap-1
                    ${item.highlight
                      ? "bg-amber-100 text-sky-900 hover:bg-amber-800 hover:text-white"
                      : "text-app-text hover:bg-white hover:text-blue-700 bg-opacity-80"}
                  `}
                >
                    <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section (1/6) - User Session & Theme Switch */}
          <div className="col-span-1 flex flex-col items-end gap-2">
            <div>
              <SwitchComponent setTheme={setTheme} theme={theme} />
            </div>
            {isAuthenticated ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-app-text font-semibold">
                  {session.user.name || session.user.email}
                </span>
                <button
                  className="bg-white text-blue-700 px-2 py-1 rounded hover:bg-blue-100 text-[10px] font-semibold"
                  onClick={() => signOut()}
                >
                  Sign Out
                </button>
              </div>
            ) : status === "loading" ? (
              <div className="flex flex-col items-end">
                <span className="text-xs text-app-text font-semibold">Checking session...</span>
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-xs text-app-text font-semibold">Guest</span>
                <button
                  className="bg-white text-blue-700 px-2 py-1 rounded hover:bg-blue-100 text-xs font-semibold"
                  onClick={() => signIn()}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default HeaderComponent;

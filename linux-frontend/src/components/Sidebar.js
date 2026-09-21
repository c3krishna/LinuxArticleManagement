import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ docs = [] }) {
  const location = useLocation();

  // Master dictionary mapping DB 'category' values to icons & background accents
  const categoryStyles = {
    "linux": {
      name: "Linux",
      bgClass: "hover:bg-slate-800 text-slate-300",
      iconColor: "text-blue-400",
      icon: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a1.5 1.5 0 1 1-3 0V11a1.5 1.5 0 0 1 3 0zM12 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
    },
    "linux administration": {
      name: "Linux Administration",
      bgClass: "hover:bg-indigo-950 text-indigo-200",
      iconColor: "text-indigo-400",
      icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-4 9a4 4 0 0 1 8 0H8z"/>
    },
    "operating systems": {
      name: "Operating Systems",
      bgClass: "hover:bg-zinc-800 text-zinc-300",
      iconColor: "text-zinc-400",
      icon: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
    },
    "programming languages": {
      name: "Programming Languages",
      bgClass: "hover:bg-emerald-950 text-emerald-200",
      iconColor: "text-emerald-400",
      icon: <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
    },
    "databases": {
      name: "Databases",
      bgClass: "hover:bg-cyan-950 text-cyan-200",
      iconColor: "text-cyan-400",
      icon: <path d="M12 2C7.58 2 4 3.79 4 6v4c0 2.21 3.58 4 8 4s8-1.79 8-4V6c0-2.21-3.58-4-8-4zm0 6c-4.42 0-8-1.79-8-4s3.58-4 8-4 8 1.79 8 4-3.58 4-8 4zm0 10c-4.42 0-8-1.79-8-4v-2c0 2.21 3.58 4 8 4s8-1.79 8-4v2c0 2.21-3.58 4-8 4z"/>
    },
    "ai": {
      name: "Artificial Intelligence",
      bgClass: "hover:bg-purple-950 text-purple-200",
      iconColor: "text-purple-400",
      icon: <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.22 19.64 10.57 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
    },
    "gpu": {
      name: "GPU & Hardware",
      bgClass: "hover:bg-fuchsia-950 text-fuchsia-200",
      iconColor: "text-fuchsia-400",
      icon: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
    },
    "cloud computing": {
      name: "Cloud Computing",
      bgClass: "hover:bg-sky-950 text-sky-200",
      iconColor: "text-sky-400",
      icon: <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    },
    "devops": {
      name: "DevOps",
      bgClass: "hover:bg-amber-950 text-amber-200",
      iconColor: "text-amber-500",
      icon: <path d="M17 6c-2.28 0-4.33 1.28-5.41 3.2A6.475 6.475 0 0 0 6 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.28 0 4.33-1.28 5.41-3.2A6.475 6.475 0 0 0 18 18c3.31 0 6-2.69 6-6s-2.69-6-6-6zm-11 9.5c-1.93 0-3.5-1.57-3.5-3.5S4.07 8.5 6 8.5c1.17 0 2.2.58 2.84 1.48A3.491 3.491 0 0 0 7 12c0 1.25.66 2.35 1.65 2.97-.67.93-1.73 1.53-2.65 1.53zm12 0c-.92 0-1.98-.6-2.65-1.53.99-.62 1.65-1.72 1.65-2.97 0-1.01-.43-1.92-1.11-2.55.64-.9 1.67-1.48 2.84-1.48 1.93 0 3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5z"/>
    },
    "dockers and containers": {
      name: "Docker & Containers",
      bgClass: "hover:bg-blue-950 text-blue-200",
      iconColor: "text-blue-400",
      icon: <path d="M2 12h3v3H2zm4 0h3v3H6zm4 0h3v3h-3zm4 0h3v3h-3zm4 0h3v3h-3zM6 8h3v3H6zm4 0h3v3h-3zm4 0h3v3h-3zM10 4h3v3h-3z"/>
    },
    "kubernets orchestrations": {
      name: "Kubernetes",
      bgClass: "hover:bg-blue-900 text-indigo-100",
      iconColor: "text-indigo-400",
      icon: <path d="M12 2L2 7l2 11 8 4 8-4 2-11L12 2zm0 3.6L18.4 8.5l-1 5.3L12 17.5l-5.4-3.7-1-5.3L12 5.6z"/>
    },
    "networking": {
      name: "Networking",
      bgClass: "hover:bg-teal-950 text-teal-200",
      iconColor: "text-teal-400",
      icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 12 10 10-4.48 10-12S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L11 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    },
    "vpn": {
      name: "VPN Services",
      bgClass: "hover:bg-rose-950 text-rose-200",
      iconColor: "text-rose-400",
      icon: <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-18-8zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    },
    "network monitoring": {
      name: "Network Monitoring",
      bgClass: "hover:bg-red-950 text-red-200",
      iconColor: "text-red-400",
      icon: <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
    },
    "infrastructure management": {
      name: "Infrastructure Management",
      bgClass: "hover:bg-red-950 text-red-200",
      iconColor: "text-red-400",
      icon: <path d="M20 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l20-6 4 4 6.3-6.29L22 12V6h-6z"/>
    },
    "webservers": {
      name: "Webservers",
      bgClass: "hover:bg-red-950 text-red-200",
      iconColor: "text-red-400",
      icon: <path d="M22 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l22-6 4 4 6.3-6.29L22 12V6h-6z"/>
    },
    "interview management": {
      name: "Interview Management",
      bgClass: "hover:bg-red-950 text-red-200",
      iconColor: "text-red-400",
      icon: <path d="M22 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l26-6 4 4 6.3-6.29L22 12V6h-6z"/>
    }
  };

  // Default fallback styles if a document has an unknown or empty category
  const defaultStyle = {
    name: "General Docs",
    bgClass: "hover:bg-slate-800 text-slate-300",
    iconColor: "text-slate-400",
    icon: <path d="M14 2H6c-1.1 0-1.99.89-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  };

  // Group dynamic documents into their mapped target architecture categories
  const groupedDocs = docs.reduce((acc, doc) => {
    const rawCat = (doc.category || "").toLowerCase().trim();
    if (!acc[rawCat]) acc[rawCat] = [];
    acc[rawCat].push(doc);
    return acc;
  }, {});

  return (
    <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)] max-h-[28rem] lg:max-h-none overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl custom-scrollbar">
      {/* Sidebar Header Info context block */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Documentation Indexes</span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
          {docs.length} Articles
        </span>
      </div>

      {/* Dynamic Content Mapping Layout Container */}
      <div className="p-4 space-y-6">
        {Object.keys(groupedDocs).map((catKey) => {
          const config = categoryStyles[catKey] || defaultStyle;
          const matchingArticles = groupedDocs[catKey];

          return (
            <div key={catKey} className="space-y-1.5">
              {/* Category Sub-Header Heading block with matching accent colors */}
              <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                <svg className={`w-4 h-4 ${config.iconColor}`} viewBox="0 0 24 24" fill="currentColor">
                  {config.icon}
                </svg>
                <span className="truncate">{config.name}</span>
              </div>

              {/* Individual nested links map list */}
              <div className="space-y-0.5 pl-3 border-l border-slate-800 ml-5">
                {matchingArticles.map((doc) => {
                  const isActive = location.pathname === `/${doc.slug}`;
                  return (
                    <Link
                      key={doc.id}
                      to={`/${doc.slug}`}
                      className={`
                        block px-3 py-2 rounded-xl text-sm transition-all duration-150 truncate font-medium
                        ${isActive 
                          ? 'bg-blue-600 text-white font-semibold shadow-md translate-x-1' 
                          : `${config.bgClass}`
                        }
                      `}
                    >
                      {doc.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Fallback View state message if API returned zero elements */}
        {docs.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            No categories populated yet.
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;

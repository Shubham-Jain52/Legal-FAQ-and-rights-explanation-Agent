import React, { useState, useEffect } from "react";
import { ArrowLeft, FileText, Activity, ShieldAlert, Cpu, Clock } from "lucide-react";

interface JudgeDashboardProps {
  onBack: () => void;
}

interface PartyInfo {
  hasFiles: boolean;
  caseId: string | null;
  summary: string | null;
  extractedText: string | null;
  score: number | null;
  status: "processing" | "verified" | "error" | null;
}

const BACKEND_URL = "http://localhost:8000";

export const JudgeDashboard: React.FC<JudgeDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<"plaintiff" | "defendant">("plaintiff");
  const [isLoading, setIsLoading] = useState(true);

  const [partyInfo, setPartyInfo] = useState<{ plaintiff: PartyInfo; defendant: PartyInfo }>({
    plaintiff: { hasFiles: false, caseId: null, summary: null, extractedText: null, score: null, status: null },
    defendant: { hasFiles: false, caseId: null, summary: null, extractedText: null, score: null, status: null },
  });

  useEffect(() => {
    const loadFromStorage = async () => {
      // Don't show global loading if we already have some data (to prevent flickers on sync)
      // but do show it on initial mount
      setIsLoading(prev => (Object.values(partyInfo).some(p => p.hasFiles) ? false : prev));

      const roles: ("plaintiff" | "defendant")[] = ["plaintiff", "defendant"];
      const updated: typeof partyInfo = {
        plaintiff: { hasFiles: false, caseId: null, summary: null, extractedText: null, score: null, status: null },
        defendant: { hasFiles: false, caseId: null, summary: null, extractedText: null, score: null, status: null },
      };

      for (const role of roles) {
        const hasFiles = localStorage.getItem(`miniProject_${role}_hasFiles`) === "true";
        const caseId = localStorage.getItem(`miniProject_${role}_caseId`);
        const summary = localStorage.getItem(`miniProject_${role}_summary`);
        const extractedText = localStorage.getItem(`miniProject_${role}_extractedText`);
        const status = localStorage.getItem(`miniProject_${role}_status`) as any;

        let score: number | null = null;
        let isValid = hasFiles;

        if (hasFiles && caseId) {
          try {
            // 1. Verify the PDF file exists on the backend
            const fileCheck = await fetch(`${BACKEND_URL}/uploads/${encodeURIComponent(caseId)}`, { method: "HEAD" });

            if (!fileCheck.ok) {
              isValid = false;
            } else if (status === "verified") {
              // 2. Verify the backend index has this file
              const res = await fetch(`${BACKEND_URL}/api/search?query=${encodeURIComponent(caseId)}`);

              if (res.ok) {
                const results = await res.json();
                if (results && results.length > 0) {
                  score = results[0].score;
                } else {
                  // Index exists but this file is missing from it
                  isValid = false;
                }
              } else {
                // Backend API error (likely empty index / restart)
                isValid = false;
              }
            }
          } catch (e) {
            console.error(`Could not verify document for ${role}:`, e);
            // On network error, we tentatively mark as invalid to avoid stale UI
            isValid = false;
          }
        }

        updated[role] = {
          hasFiles: isValid,
          caseId: isValid ? caseId : null,
          summary: isValid ? summary : null,
          extractedText: isValid ? extractedText : null,
          score: isValid ? score : null,
          status: isValid ? status : null,
        };
      }

      setPartyInfo(updated);
      setIsLoading(false);
    };

    loadFromStorage();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("miniProject_")) {
        loadFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleReset = () => {
    const roles: ("plaintiff" | "defendant")[] = ["plaintiff", "defendant"];
    roles.forEach(role => {
      localStorage.removeItem(`miniProject_${role}_hasFiles`);
      localStorage.removeItem(`miniProject_${role}_caseId`);
      localStorage.removeItem(`miniProject_${role}_summary`);
      localStorage.removeItem(`miniProject_${role}_extractedText`);
      localStorage.removeItem(`miniProject_${role}_status`);
    });
    window.location.reload();
  };

  const current = partyInfo[activeTab];

  const renderDocumentViewer = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse flex flex-col items-center justify-center h-full gap-4 text-slate-400">
          <div className="w-16 h-20 bg-slate-100 rounded-md" />
          <p className="text-sm">Loading document...</p>
        </div>
      );
    }

    if (!current.hasFiles || !current.caseId) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
          <Clock className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium">Waiting for {activeTab} to upload a document</p>
          <p className="text-xs text-slate-300">Documents will appear here once uploaded</p>
        </div>
      );
    }

    if (current.status === "processing") {
      return (
        <div className="animate-pulse flex flex-col items-center justify-center h-full gap-4 text-slate-400">
          <FileText className="w-16 h-20 text-slate-100" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium">Processing {activeTab}'s document...</p>
            <p className="text-xs text-slate-300">AI analysis is under way</p>
          </div>
        </div>
      );
    }

    return (
      <iframe
        src={`${BACKEND_URL}/uploads/${encodeURIComponent(current.caseId)}`}
        title={`${activeTab} PDF`}
        className="w-full h-full rounded-none border-0"
        style={{ minHeight: "100%" }}
      />
    );
  };

  const renderSidebar = () => {
    if (isLoading) {
      return (
        <div className="space-y-6 animate-pulse p-4">
          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
          <div className="h-20 bg-slate-50 rounded"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          <div className="h-12 bg-slate-50 rounded"></div>
        </div>
      );
    }

    if (!current.hasFiles || current.status === "processing") {
      return (
        <div className="space-y-8 animate-pulse">
          <section>
            <div className="h-3 bg-slate-100 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-50 rounded w-full"></div>
              <div className="h-4 bg-slate-50 rounded w-full"></div>
              <div className="h-4 bg-slate-50 rounded w-3/4"></div>
            </div>
          </section>
          <div className="h-16 bg-slate-900/10 rounded-xl"></div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Extracted Summary */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-3 h-3" />
            Document Summary
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-100 max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
            {current.summary || current.extractedText || "Text not available."}
          </div>
        </section>

        {/* Similarity Score */}
        <section>
          <div className="bg-slate-900 rounded-xl p-4 text-white flex justify-between items-center shadow-lg shadow-indigo-900/20">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-sm">Similarity Score</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">
              {current.score !== null ? `${(current.score * 100).toFixed(1)}%` : "N/A"}
            </span>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>LEX-2026-042 • Evergreen vs. Northside Construction</span>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest border border-slate-200 px-3 py-1.5 rounded-md transition-all hover:border-red-200 hover:bg-red-50"
        >
          Reset Session
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Side: PDF Viewer */}
        <div className="w-7/12 bg-slate-100/50 flex flex-col border-r border-slate-200 relative">

          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white shrink-0">
            <button
              onClick={() => setActiveTab("plaintiff")}
              className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === "plaintiff" ? "border-indigo-900 text-indigo-900 bg-slate-50/50" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Plaintiff PDF
            </button>
            <button
              onClick={() => setActiveTab("defendant")}
              className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === "defendant" ? "border-indigo-900 text-slate-900 bg-slate-50/50" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Defendant PDF
            </button>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-hidden relative">
            {renderDocumentViewer()}
          </div>
        </div>

        {/* Right Side: Analysis Sidebar */}
        <div className="w-5/12 bg-white flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm tracking-wide">
              <Cpu className="w-4 h-4" />
              AI LEGAL ANALYST
            </div>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              LIVE ANALYSIS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {renderSidebar()}
          </div>
        </div>

      </div>
    </div>
  );
};

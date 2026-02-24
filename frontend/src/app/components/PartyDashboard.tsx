import React, { useState, useRef } from "react";
import { Upload, FileText, ArrowLeft, CheckCircle, Clock, Circle } from "lucide-react";

interface PartyDashboardProps {
  role: "plaintiff" | "defendant";
  onBack: () => void;
}

const BACKEND_URL = "http://localhost:8000";

export const PartyDashboard: React.FC<PartyDashboardProps> = ({
  role,
  onBack,
}) => {
  const [files, setFiles] = useState<any[]>([]);
  // notes state kept to avoid breaking changes if downstream logic used it, though UI is removed
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const tempId = Date.now();

    const tempFile = {
      id: tempId,
      name: selectedFile.name,
      date: new Date().toISOString().split("T")[0],
      status: "processing", // Initial internal status
      summary: "",
    };

    setFiles(prev => [tempFile, ...prev]);
    setIsUploading(true);

    // Set processing status in localStorage for Judge Dashboard
    localStorage.setItem(`miniProject_${role}_hasFiles`, "true");
    localStorage.setItem(`miniProject_${role}_status`, "processing");
    localStorage.setItem(`miniProject_${role}_caseId`, selectedFile.name);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        "http://localhost:8000/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      setFiles(prev =>
        prev.map(file =>
          file.id === tempId
            ? { ...file, status: "verified", summary: data.summary }
            : file
        )
      );

      // Persist upload status for Judge Dashboard to see
      localStorage.setItem(`miniProject_${role}_hasFiles`, "true");
      localStorage.setItem(`miniProject_${role}_status`, "verified");
      localStorage.setItem(`miniProject_${role}_caseId`, data.case_id);
      localStorage.setItem(`miniProject_${role}_summary`, data.summary);
      localStorage.setItem(`miniProject_${role}_extractedText`, data.extracted_text ?? "");
    } catch (err) {
      console.error(err);
      localStorage.setItem(`miniProject_${role}_status`, "error");
      setFiles(prev =>
        prev.map(file =>
          file.id === tempId
            ? { ...file, status: "error" }
            : file
        )
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Header */}
      <header className="border-b px-8 py-5 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="hover:bg-slate-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {role} Dashboard
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-sm font-medium text-slate-600">Active Session</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-10">

        {/* Left Column: Actions & Files */}
        <div className="col-span-12 lg:col-span-8 space-y-10">

          {/* Upload Section */}
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
              Upload Documents
            </h2>

            <div
              onClick={handleUploadClick}
              className="group border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-1">
                {isUploading ? "Uploading..." : "Click or drag PDF documents to upload"}
              </p>
              <p className="text-sm text-slate-400">
                Maximum file size 25MB
              </p>
            </div>
          </section>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                Uploaded Files
              </h2>

              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="group border border-slate-100 bg-white rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {file.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {file.status === "verified" || file.status === "received" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-600 border border-green-100">
                          Verified
                        </span>
                      ) : file.status === "error" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-100">
                          Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100">
                          Pending
                        </span>
                      )}

                      <button
                        onClick={() => window.open(`${BACKEND_URL}/uploads/${encodeURIComponent(file.name)}`, '_blank')}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* Case Timeline */}
          <section className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200/50">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8">
              Case Timeline
            </h2>

            <div className="relative pl-2 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
              {[
                {
                  title: "Case Filed",
                  date: "Feb 01",
                  status: "completed"
                },
                {
                  title: "Discovery Phase",
                  date: files.length > 0 ? "Feb 10" : "Pending Action",
                  status: files.length > 0 ? (files.some(f => f.status === 'verified') ? "completed" : "current") : "current"
                },
                {
                  title: "Evidence Review",
                  date: "In Progress",
                  status: files.some(f => f.status === 'verified') ? "current" : "pending"
                },
                {
                  title: "Final Hearing",
                  date: "Feb 28",
                  status: "pending"
                },
              ].map((step, index) => (
                <div key={index} className="relative pl-8 group">
                  {/* Dot / Indicator */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 z-10 
                    ${step.status === 'completed' || step.status === 'current' ? 'bg-indigo-500/20' : 'bg-slate-900 border-2 border-slate-700'}
                  `}>
                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 
                      ${step.status === 'completed' || step.status === 'current' ? 'bg-indigo-500' : 'bg-transparent'}
                      ${step.status === 'current' ? 'animate-pulse' : ''}
                    `}></div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className={`text-sm font-semibold transition-colors ${step.status === 'pending' ? 'text-slate-600' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-[10px] mt-0.5 transition-colors ${step.status === 'pending' ? 'text-slate-700' : 'text-slate-400'}`}>
                      {step.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Note: Case Notes section has been removed as per strict UI instructions */}

        </div>
      </main>
    </div>
  );
};

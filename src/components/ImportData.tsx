import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface ImportPreview {
  totalInExcel: number;
  totalInDb: number;
  stats: { toAdd: number; toUpdate: number; toDelete: number; unchanged: number };
  toAdd: { lastName: string; firstName: string; middleInitial: string; position: string; employmentStatus: string; office: string; rawName: string }[];
  toUpdate: { employeeId: number; name: string; office: string; changes: Record<string, { old: string; new: string }> }[];
  toDelete: { employeeId: number; name: string; office: string; needsCount: number }[];
}

interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  totalNow: number;
}

export default function ImportData({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<"upload" | "preview" | "result" | "error">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [confirmText, setConfirmText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      setError("Please upload an Excel (.xlsx) file.");
      setPhase("error");
      return;
    }
    setFile(f);
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch("/api/import/preview", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse file");
      }
      const data: ImportPreview = await res.json();
      setPreview(data);
      setPhase("preview");
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const res = await fetch("/api/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAdd: preview.toAdd,
          toUpdate: preview.toUpdate,
          toDelete: preview.toDelete,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to execute import");
      }
      const data: ImportResult = await res.json();
      setResult(data);
      setPhase("result");
      onComplete?.();
    } catch (err: any) {
      setError(err.message);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setConfirmText("");
    setExpandedSections({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Phase */}
      {phase === "upload" && (
        <div className="space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Import Employee Data</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload an Excel file to sync the employee database. Employees not in the file will be removed.
            </p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {loading ? (
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
            ) : (
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            )}
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              {dragOver ? "Drop file here" : loading ? "Parsing file..." : "Click or drag an Excel file here"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">.xlsx format only</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Warning: This will sync the entire database</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Employees in the Excel but not in the database will be <strong>created</strong></li>
                <li>Employees in both will be <strong>updated</strong> with any changes</li>
                <li>Employees in the database but not in the Excel will be <strong>permanently deleted</strong> (along with their learning needs)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview Phase */}
      {phase === "preview" && preview && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Import Preview</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review the changes below before confirming
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
              <Plus className="w-6 h-6 mx-auto text-blue-500 mb-1" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{preview.stats.toAdd}</div>
              <div className="text-xs text-blue-500 dark:text-blue-400">To Add</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
              <Pencil className="w-6 h-6 mx-auto text-amber-500 mb-1" />
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{preview.stats.toUpdate}</div>
              <div className="text-xs text-amber-500 dark:text-amber-400">To Update</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <Trash2 className="w-6 h-6 mx-auto text-red-500 mb-1" />
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{preview.stats.toDelete}</div>
              <div className="text-xs text-red-500 dark:text-red-400">To Delete</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{preview.totalInDb - preview.stats.toDelete}</div>
              <div className="text-xs text-emerald-500 dark:text-emerald-400">Remaining</div>
            </div>
          </div>

          {/* Expandable Lists */}
          <div className="space-y-3">
            {/* To Add */}
            {preview.toAdd.length > 0 && (
              <div className="border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
                <button onClick={() => toggleSection("add")} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                  <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> {preview.toAdd.length} employees to add</span>
                  {expandedSections.add ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.add && (
                  <div className="max-h-64 overflow-y-auto divide-y divide-blue-100 dark:divide-blue-900">
                    {preview.toAdd.map((emp, i) => (
                      <div key={i} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 flex justify-between">
                        <span>{emp.rawName}</span>
                        <span className="text-slate-400">{emp.office || "No office"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* To Update */}
            {preview.toUpdate.length > 0 && (
              <div className="border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
                <button onClick={() => toggleSection("update")} className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-sm font-semibold">
                  <span className="flex items-center gap-2"><Pencil className="w-4 h-4" /> {preview.toUpdate.length} employees to update</span>
                  {expandedSections.update ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.update && (
                  <div className="max-h-64 overflow-y-auto divide-y divide-amber-100 dark:divide-amber-900">
                    {preview.toUpdate.map((emp, i) => (
                      <div key={i} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300">
                        <div className="font-medium mb-1">{emp.name}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(emp.changes).map(([field, change]) => (
                            <span key={field} className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-md px-1.5 py-0.5">
                              {field}: <span className="line-through opacity-50">{change.old || "(empty)"}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="font-medium">{change.new || "(empty)"}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* To Delete */}
            {preview.toDelete.length > 0 && (
              <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                <button onClick={() => toggleSection("delete")} className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm font-semibold">
                  <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> {preview.toDelete.length} employees to delete</span>
                  {expandedSections.delete ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.delete && (
                  <div className="max-h-64 overflow-y-auto divide-y divide-red-100 dark:divide-red-900">
                    {preview.toDelete.map((emp, i) => (
                      <div key={i} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 flex justify-between">
                        <span>{emp.name}</span>
                        <span className="text-red-400">{emp.needsCount} learning need{emp.needsCount !== 1 ? "s" : ""} lost</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm & Actions */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Type <strong>CONFIRM</strong> to proceed with the import</span>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "CONFIRM" to proceed'
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={confirmText !== "CONFIRM" || loading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  confirmText === "CONFIRM" && !loading
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {loading ? "Importing..." : "Confirm & Import"}
              </button>
              <button
                onClick={reset}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Phase */}
      {phase === "result" && result && (
        <div className="text-center space-y-6 py-8">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Import Complete</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Database has been synced successfully</p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.created}</div>
              <div className="text-xs text-blue-500">Created</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.updated}</div>
              <div className="text-xs text-amber-500">Updated</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.deleted}</div>
              <div className="text-xs text-red-500">Deleted</div>
            </div>
          </div>
          <p className="text-sm text-slate-500">Total employees now: <strong>{result.totalNow}</strong></p>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Error Phase */}
      {phase === "error" && (
        <div className="text-center space-y-4 py-8">
          <XCircle className="w-16 h-16 mx-auto text-red-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Import Failed</h2>
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

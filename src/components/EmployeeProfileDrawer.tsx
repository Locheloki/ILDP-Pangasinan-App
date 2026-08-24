import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { Employee, LearningNeed, formatEmployeeName } from "../types";
import Modal from "./Modal";

interface EmployeeProfileDrawerProps {
  isOpen: boolean;
  employee: Employee | null;
  needs: LearningNeed[];
  seminars: any[];
  onClose: () => void;
  onEdit: (employeeId: number) => void;
  onNavigateToSeminar?: (year: number, quarter: string, seminarId: string) => void;
}

export default function EmployeeProfileDrawer({ isOpen, employee, needs, seminars, onClose, onEdit, onNavigateToSeminar }: EmployeeProfileDrawerProps) {
  const [tab, setTab] = useState<"needs" | "seminars">("needs");

  if (!isOpen || !employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      ariaLabel={`Profile: ${formatEmployeeName(employee)}`}
      header={
        <div className="flex items-center gap-3 px-6 pt-5 pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 p-1.5 rounded-lg transition-all duration-100 cursor-pointer"
            aria-label="Close"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {formatEmployeeName(employee)}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Quick View
            </span>
          </div>
          <button
            onClick={() => { onClose(); onEdit(employee.EmployeeID); }}
            className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-[11px] font-bold py-1.5 px-3 rounded-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-100 shrink-0"
          >
            <Pencil className="h-3 w-3 inline mr-1" />
            Edit
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile Overview */}
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pt-6 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {formatEmployeeName(employee)}
              </h2>
              {employee.isActive === false && (
                <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Archived
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{employee.Position}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">{employee.Office}</p>
          </div>
        </div>

        {/* Meta details */}
        <div className="grid grid-cols-4 gap-3 bg-slate-50/40 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Middle Name</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{employee.MiddleName || employee.MiddleInitial || "N/A"}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Employment Status</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize mt-0.5">{employee.EmploymentStatus || "N/A"}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Gender</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize mt-0.5">{employee.Gender || "N/A"}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">Date of Assumption</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{employee.DateOfAssumption || "N/A"}</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab("needs")}
            className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
              tab === "needs"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Individual Development Needs ({needs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("seminars")}
            className={`flex-1 py-2 text-center text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
              tab === "seminars"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Training & Seminars ({seminars.length})
          </button>
        </div>

        {/* Tab 1: Learning Needs */}
        {tab === "needs" && (
          <div className="space-y-4">
            {needs.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/20 dark:bg-slate-950/10 rounded-xl border border-slate-200/40 dark:border-slate-800 text-xs text-slate-500">
                No learning needs currently registered.
              </div>
            ) : (
              <div className="space-y-3">
                {needs.map((need, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/30 dark:bg-slate-950/20 rounded-xl border border-slate-200/40 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">#{idx + 1}</span>
                      <span className="text-[9.5px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200/40 dark:border-blue-900/30 ml-auto whitespace-nowrap">
                        {need.TargetSchedule}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug mb-2">{need.LearningNeed}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                      <span><span className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Basis:</span> {need.Basis}</span>
                      <span className="text-slate-200 dark:text-slate-700">|</span>
                      <span><span className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Methodology:</span> {need.Methodology}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Seminars */}
        {tab === "seminars" && (
          <div className="space-y-4">
            {seminars.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/20 dark:bg-slate-950/10 rounded-xl border border-slate-200/40 dark:border-slate-800 text-xs text-slate-500">
                No seminar attendances registered.
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(new Set(seminars.map(s => s.year)))
                  .sort((a, b) => b - a)
                  .map(year => {
                    const yearSems = seminars.filter(s => s.year === year);
                    const quarters = Array.from(new Set(yearSems.map(s => s.quarter || "Undefined"))).sort();
                    return (
                      <div key={year} className="space-y-3">
                        <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                          {year} Seminars
                        </span>
                        {quarters.map(q => (
                          <div key={q} className="pl-2 space-y-1.5">
                            <span className="text-[9.5px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide block">
                              {q}
                            </span>
                            <ul className="space-y-1.5 list-none pl-2 border-l border-slate-100 dark:border-slate-800/80">
                              {yearSems
                                .filter(s => (s.quarter || "Undefined") === q)
                                .map((sem, idx) => (
                                  <li key={idx}>
                                    {onNavigateToSeminar ? (
                                      <button
                                        type="button"
                                        onClick={() => { onClose(); onNavigateToSeminar(sem.year, sem.quarter || "Q2", sem.id); }}
                                        className="w-full text-left flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/20 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 hover:border-blue-500/30 transition cursor-pointer"
                                      >
                                        <span className="text-blue-500 shrink-0 font-bold">•</span>
                                        <div>
                                          <span className="font-bold text-slate-800 dark:text-white block hover:text-blue-500 hover:underline">{sem.title}</span>
                                          {sem.date && (
                                            <span className="text-[10px] text-slate-400">
                                              Date: {sem.date}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    ) : (
                                      <div className="w-full text-left flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/20 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <span className="text-blue-500 shrink-0 font-bold">•</span>
                                        <div>
                                          <span className="font-bold text-slate-800 dark:text-white block">{sem.title}</span>
                                          {sem.date && (
                                            <span className="text-[10px] text-slate-400">
                                              Date: {sem.date}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

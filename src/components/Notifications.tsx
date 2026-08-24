import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, X, User, FileText, ClipboardList, BookOpen } from "lucide-react";
import { DeletionRequest, User as UserType } from "../types";

interface NotificationsProps {
  currentUser: UserType;
  requests: DeletionRequest[];
  onReview: (id: string, status: "approved" | "denied") => void;
  onRefresh: () => void;
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  employee: <User className="h-3.5 w-3.5" />,
  seminar: <ClipboardList className="h-3.5 w-3.5" />,
  "learning-need": <BookOpen className="h-3.5 w-3.5" />,
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800",
  approved: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800",
  denied: "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800",
};

export default function Notifications({ currentUser, requests, onReview, onRefresh }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [panelOrigin, setPanelOrigin] = useState<"top" | "bottom">("top");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isEncoder = currentUser.role === "Encoder";
  const pendingCount = isEncoder ? 0 : requests.filter((r) => r.status === "pending").length;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const PANEL_WIDTH = 320;
    const PANEL_HEIGHT = 360;
    const GAP = 8;
    const MARGIN = 8;

    let top: number;
    let left: number;
    let origin: "top" | "bottom";

    if (rect.top - GAP - PANEL_HEIGHT > MARGIN) {
      top = rect.top - GAP - PANEL_HEIGHT;
      origin = "top";
    } else {
      top = rect.bottom + GAP;
      origin = "bottom";
    }

    left = rect.right - PANEL_WIDTH;
    if (left < MARGIN) left = MARGIN;

    setPanelStyle({ position: "fixed", top, left, width: PANEL_WIDTH });
    setPanelOrigin(origin);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      if (!prev) onRefresh();
      return !prev;
    });
  };

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={toggleOpen}
        className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition cursor-pointer"
        title="Notifications"
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={pendingCount > 0 ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
        >
          <Bell className="h-4 w-4" />
        </motion.div>
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
              <motion.div
                style={panelStyle}
                className="z-[9999] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[360px] flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: panelOrigin === "top" ? 8 : -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: panelOrigin === "top" ? 8 : -8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
              >
                <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isEncoder ? "My Requests" : "Deletion Requests"}
                    </h3>
                    {!isEncoder && pendingCount > 0 && (
                      <span className="text-[9px] font-semibold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 transition cursor-pointer"
                    whileTap={{ scale: 0.85 }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {requests.length === 0 ? (
                    <motion.div
                      className="p-6 text-center"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
                        <Bell className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isEncoder ? "No deletion requests yet" : "No pending requests"}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        {isEncoder ? "Requests you submit will appear here" : "All caught up!"}
                      </p>
                    </motion.div>
                  ) : (
                    requests.map((req, i) => (
                      <motion.div
                        key={req.id}
                        className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              req.entityType === "employee"
                                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-500 dark:text-blue-400"
                                : req.entityType === "seminar"
                                  ? "bg-violet-50 dark:bg-violet-950/50 text-violet-500 dark:text-violet-400"
                                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400"
                            }`}
                          >
                            {ENTITY_ICONS[req.entityType] || <FileText className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                              {req.entityName}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {req.entityType.charAt(0).toUpperCase() + req.entityType.slice(1).replace("-", " ")}
                              <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                              by {req.requestedByName}
                            </p>
                            {req.reason && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic truncate max-w-[200px]">
                                "{req.reason}"
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                                  STATUS_STYLES[req.status] || STATUS_STYLES.pending
                                }`}
                              >
                                {req.status}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                              {req.status !== "pending" && req.reviewedByName && (
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                  by {req.reviewedByName}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isEncoder && req.status === "pending" && (
                            <div className="flex items-center gap-1 shrink-0">
                              <motion.button
                                onClick={() => onReview(req.id, "approved")}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition cursor-pointer"
                                title="Approve"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.85 }}
                              >
                                <Check className="h-3 w-3" />
                              </motion.button>
                              <motion.button
                                onClick={() => onReview(req.id, "denied")}
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition cursor-pointer"
                                title="Deny"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.85 }}
                              >
                                <X className="h-3 w-3" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

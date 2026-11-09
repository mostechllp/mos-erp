import React, { useState } from "react";
import {
  Lock, Unlock, Info, UserPlus, ArrowRight, X, AlertTriangle
} from "lucide-react";

const inputCls =
  "w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500";

const TransactionLockingPage = () => {
  const [viewMode, setViewMode] = useState("individual");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState(null);

  const [lockDate, setLockDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

  const [modules, setModules] = useState({
    sales: { locked: false, date: null },
    purchases: { locked: false, date: null },
    banking: { locked: false, date: null },
    accountant: { locked: false, date: null },
  });

  const handleOpenLockModal = (target) => {
    setLockTarget(target);
    setIsModalOpen(true);
  };

  const handleLockConfirm = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    if (lockTarget.type === "all") {
      setModules({
        sales: { locked: true, date: lockDate },
        purchases: { locked: true, date: lockDate },
        banking: { locked: true, date: lockDate },
        accountant: { locked: true, date: lockDate },
      });
    } else {
      setModules((prev) => ({
        ...prev,
        [lockTarget.key]: { locked: true, date: lockDate },
      }));
    }

    setIsModalOpen(false);
    setReason("");
  };

  const renderModuleCard = (key, name) => {
    const module = modules[key];
    return (
      <div
        key={key}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex items-start gap-4 shadow-sm"
      >
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
          {module.locked ? <Lock size={20} /> : <Unlock size={20} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{name}</h3>
            <Info size={14} className="text-gray-400 dark:text-gray-500 cursor-help" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {module.locked
              ? `Transactions up to ${module.date} are locked.`
              : "You have not locked the transactions in this module."}
          </p>
        </div>
        <div className="shrink-0 pt-1">
          {!module.locked && (
            <button
              onClick={() => handleOpenLockModal({ type: "module", key, name })}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <Lock size={14} /> Lock
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen relative flex flex-col font-sans text-gray-900 dark:text-gray-100">

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-medium text-gray-800 dark:text-gray-100">Transaction Locking</h1>

        <div className="flex items-center gap-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/60 text-sm text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-md flex items-center gap-2">
            Restrict transaction locking with negative stock{" "}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Configure</a>
          </div>
          <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
            <UserPlus size={16} /> Find Accountants
          </button>
        </div>
      </div>

      {/* FULL WIDTH CONTENT AREA */}
      <div className="px-6 py-6 w-full flex-1">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-8 leading-relaxed max-w-5xl">
          Transaction locking prevents you and your users from making any changes to transactions that might affect your accounts. Once transactions are locked, users cannot edit, modify, or delete any transactions that were recorded before the specified date in this module.
        </p>

        {viewMode === "all" ? (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                <Lock size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">All Transactions</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {modules.sales.locked
                    ? `All transactions up to ${modules.sales.date} are locked.`
                    : "You have not opted to lock all transactions."}
                </p>
              </div>
              <div className="shrink-0 pt-1">
                {!modules.sales.locked && (
                  <button
                    onClick={() => handleOpenLockModal({ type: "all", name: "All Transactions" })}
                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-2 rounded text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <Lock size={16} /> Lock
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-4">Lock Individual Modules</h3>
              <p className="text-base text-gray-800 dark:text-gray-200 mb-4">You will be able to:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-6">
                <li>Select the modules (Sales, purchases, Banking, Accountant) you wish to lock, instead of locking all transactions.</li>
                <li>Set different lock dates for each module.</li>
              </ul>
              <button
                onClick={() => setViewMode("individual")}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-2"
              >
                <Lock size={16} /> Lock Individual Modules
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {renderModuleCard("sales", "Sales")}
            {renderModuleCard("purchases", "Purchases")}
            {renderModuleCard("banking", "Banking")}
            {renderModuleCard("accountant", "Accountant")}

            <div className="bg-[#FFF8E7] dark:bg-amber-900/20 border border-[#FDE5B4] dark:border-amber-800/60 rounded-lg p-6 mt-8 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Lock All Transactions At Once</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 max-w-3xl">
                  You can freeze all transactions at once instead of locking the Sales, Purchases, Banking and Account transactions individually.
                </p>
              </div>
              <button
                onClick={() => setViewMode("all")}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1 shrink-0 mt-1"
              >
                Switch to Lock All Transactions <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LOCK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 z-50 flex justify-center items-start pt-16 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-normal text-gray-800 dark:text-gray-100">
                Lock - {lockTarget?.name}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLockConfirm} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
                  Lock Date* <Info size={14} className="text-gray-400 dark:text-gray-500" />
                </label>
                <input
                  type="date"
                  className={`${inputCls} max-w-sm`}
                  value={lockDate}
                  onChange={(e) => setLockDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-red-500 dark:text-red-400 font-medium">Reason*</label>
                <textarea
                  className={`${inputCls} resize-none h-32`}
                  placeholder="Enter the reason for locking..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/60 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Once locked, you cannot edit, modify, or delete transactions recorded before this date. This action cannot be undone.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!reason.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Lock
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TransactionLockingPage;
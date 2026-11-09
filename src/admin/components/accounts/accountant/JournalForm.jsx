import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addJournal } from "../../../store/slices/accounts/manualJournalsSlice";
import { X, Plus, Trash2, Settings, Info, Upload, ChevronDown } from "lucide-react";

const inputCls =
  "w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500";

// Inline-editable cells in the journal lines table share this style
const cellInputCls =
  "w-full border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded px-2 py-1 text-sm focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500";

const JournalForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.manualJournals.loading);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    reverseDate: "",
    publishReverseOnly: false,
    journalNumber: "1",
    referenceNumber: "",
    notes: "",
    reportingMethod: "Accrual and Cash",
    currency: "INR- Indian Rupee",
    lines: [
      { id: Date.now().toString(), account: "", description: "", contact: "", debit: "", credit: "" },
      { id: Date.now().toString() + "1", account: "", description: "", contact: "", debit: "", credit: "" },
    ],
  });

  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = value;
    setFormData((prev) => ({ ...prev, lines: newLines }));
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        { id: Date.now().toString(), account: "", description: "", contact: "", debit: "", credit: "" },
      ],
    }));
  };

  const removeLine = (index) => {
    if (formData.lines.length <= 2) return;
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, lines: newLines }));
  };

  const totalDebit = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const difference = totalDebit - totalCredit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.notes.trim()) return;

    try {
      await dispatch(addJournal(formData)).unwrap();
      navigate("/admin/accounts/accountant/manual-journals");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-medium text-gray-800 dark:text-gray-100">New Journal</h1>
        <button
          onClick={() => navigate("/admin/accounts/accountant/manual-journals")}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Choose Template
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-red-500 dark:text-red-400 font-medium w-32 shrink-0">Date*</label>
              <input
                type="date"
                className={inputCls}
                value={formData.date}
                onChange={(e) => setField("date", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 w-32 shrink-0">Reverse Journal Date</label>
              <input
                type="date"
                className={inputCls}
                value={formData.reverseDate}
                onChange={(e) => setField("reverseDate", e.target.value)}
                placeholder="dd/MM/yyyy"
              />
            </div>

            <div className="flex items-center gap-4 md:col-start-2">
              <label className="text-sm text-gray-700 dark:text-gray-300 w-32 shrink-0"></label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.publishReverseOnly}
                  onChange={(e) => setField("publishReverseOnly", e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:bg-gray-800"
                />
                Publish reverse journal only on the reverse journal date{" "}
                <Info size={14} className="text-gray-400 dark:text-gray-500" />
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm text-red-500 dark:text-red-400 font-medium w-32 shrink-0">Journal#*</label>
              <div className="relative w-full">
                <input
                  type="text"
                  className={inputCls}
                  value={formData.journalNumber}
                  onChange={(e) => setField("journalNumber", e.target.value)}
                />
                <Settings size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 w-32 shrink-0">Reference#</label>
              <input
                type="text"
                className={inputCls}
                value={formData.referenceNumber}
                onChange={(e) => setField("referenceNumber", e.target.value)}
              />
            </div>

            <div className="flex items-start gap-4 md:col-span-2">
              <label className="text-sm text-red-500 dark:text-red-400 font-medium w-32 shrink-0 pt-2">Notes*</label>
              <textarea
                className={`${inputCls} resize-none h-24`}
                placeholder="Max. 500 characters"
                value={formData.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            <div className="flex items-start gap-4 md:col-span-2">
              <label className="text-sm text-gray-700 dark:text-gray-300 w-32 shrink-0 pt-1 flex items-center gap-1">
                Reporting Method <Info size={14} className="text-gray-400 dark:text-gray-500" />
              </label>
              <div className="grid grid-cols-2 gap-y-2 pt-1 w-full">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="Accrual and Cash"
                    checked={formData.reportingMethod === "Accrual and Cash"}
                    onChange={() => setField("reportingMethod", "Accrual and Cash")}
                    className="text-blue-600 dark:bg-gray-800 dark:border-gray-600"
                  />
                  Accrual and Cash
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="Accrual Only"
                    checked={formData.reportingMethod === "Accrual Only"}
                    onChange={() => setField("reportingMethod", "Accrual Only")}
                    className="text-blue-600 dark:bg-gray-800 dark:border-gray-600"
                  />
                  Accrual Only
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="Cash Only"
                    checked={formData.reportingMethod === "Cash Only"}
                    onChange={() => setField("reportingMethod", "Cash Only")}
                    className="text-blue-600 dark:bg-gray-800 dark:border-gray-600"
                  />
                  Cash Only
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4 md:col-span-2">
              <label className="text-sm text-gray-700 dark:text-gray-300 w-32 shrink-0">Currency</label>
              <select
                className={inputCls}
                value={formData.currency}
                onChange={(e) => setField("currency", e.target.value)}
              >
                <option value="INR- Indian Rupee">INR- Indian Rupee</option>
                <option value="USD- US Dollar">USD- US Dollar</option>
              </select>
            </div>
          </div>

          {/* Journal Lines Table */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 w-8"></th>
                    <th className="px-3 py-2 w-[30%]">ACCOUNT</th>
                    <th className="px-3 py-2">DESCRIPTION</th>
                    <th className="px-3 py-2">CONTACT (INR)</th>
                    <th className="px-3 py-2 text-right">DEBITS</th>
                    <th className="px-3 py-2 text-right">CREDITS</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {formData.lines.map((line, index) => (
                    <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="px-3 py-3 text-gray-400 dark:text-gray-500 text-center">
                        <div className="cursor-grab">⋮⋮</div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className={cellInputCls}
                          value={line.account}
                          onChange={(e) => handleLineChange(index, "account", e.target.value)}
                        >
                          <option value="">Select an account</option>
                          <option value="Employee Advance">Employee Advance</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          className={cellInputCls}
                          placeholder="Description"
                          value={line.description}
                          onChange={(e) => handleLineChange(index, "description", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className={cellInputCls}
                          value={line.contact}
                          onChange={(e) => handleLineChange(index, "contact", e.target.value)}
                        >
                          <option value="">Select Contact</option>
                          <option value="LocalFix">LocalFix</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          className={`${cellInputCls} w-24 text-right`}
                          value={line.debit}
                          onChange={(e) => handleLineChange(index, "debit", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          className={`${cellInputCls} w-24 text-right`}
                          value={line.credit}
                          onChange={(e) => handleLineChange(index, "credit", e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={addLine}
                className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 hover:underline border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded"
              >
                <Plus size={14} /> Add New Row
              </button>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-4">
            <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800 rounded-lg p-5 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                <div className="flex gap-8">
                  <span className="font-medium w-24 text-right text-gray-900 dark:text-gray-100">{totalDebit.toFixed(2)}</span>
                  <span className="font-medium w-24 text-right text-gray-900 dark:text-gray-100">{totalCredit.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-gray-200 font-semibold text-base">Total (₹)</span>
                <div className="flex gap-8">
                  <span className="font-semibold text-base w-24 text-right text-gray-900 dark:text-gray-100">{totalDebit.toFixed(2)}</span>
                  <span className="font-semibold text-base w-24 text-right text-gray-900 dark:text-gray-100">{totalCredit.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-500 dark:text-red-400 font-medium">Difference</span>
                <span
                  className={`font-medium w-24 text-right ${
                    difference !== 0
                      ? "text-red-500 dark:text-red-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {difference.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Attachments</label>
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Upload size={14} /> Upload File <ChevronDown size={14} />
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">You can upload a maximum of 5 files, 10MB each</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => navigate("/admin/accounts/accountant/manual-journals")}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button type="button" className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
};

export default JournalForm;
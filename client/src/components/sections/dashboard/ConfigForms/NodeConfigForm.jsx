import { useState } from "react";
import { Save, X } from "lucide-react";

const selectOptions = {
  algorithm: ["round_robin", "least_conn", "ip_hash", "sliding_window"],
  client_type: ["web", "mobile", "cli", "api"],
  scope: ["ip", "user", "route"],
  runtime: ["node", "python", "go"],
  strategy: ["jwt", "oauth", "session"],
  technology: ["rabbitmq", "kafka", "sqs"],
};

const labelFor = (key) => key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const NodeConfigForm = ({ node, onSave, onClose }) => {
  const [formData, setFormData] = useState({ ...node.data.config });

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form className="max-h-[90vh] w-[520px] max-w-full overflow-y-auto rounded-xl bg-white shadow-xl" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{node.data.category}</p>
            <h2 className="mt-1 text-base font-medium text-gray-800">Configure {node.data.label}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100" aria-label="Close">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {Object.entries(formData).map(([key, value]) => (
            <label key={key} className={`space-y-1 ${typeof value === "boolean" || key.includes("description") || key.includes("notes") || key.includes("vars") || key === "rules" ? "sm:col-span-2" : ""}`}>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{labelFor(key)}</span>
              {typeof value === "boolean" ? (
                <span className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <input type="checkbox" name={key} checked={value} onChange={handleChange} /> Enabled
                </span>
              ) : selectOptions[key] ? (
                <select name={key} value={value} onChange={handleChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                  {selectOptions[key].map((option) => <option key={option} value={option}>{labelFor(option)}</option>)}
                </select>
              ) : key.includes("description") || key.includes("notes") || key.includes("vars") || key === "rules" || key === "templates" || key === "conditions" ? (
                <textarea name={key} value={value} onChange={handleChange} rows={3} className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800" />
              ) : (
                <input name={key} type={typeof value === "number" ? "number" : "text"} value={value} onChange={handleChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800" />
              )}
            </label>
          ))}
        </div>
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
          <button type="submit" className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"><span className="flex items-center justify-center gap-2"><Save className="h-4 w-4" />Save Configuration</span></button>
        </div>
      </form>
    </div>
  );
};

export default NodeConfigForm;

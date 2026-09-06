import { useState } from "react";
import { X, Save, Link, AlignLeft, Loader2 } from "lucide-react";

const HttpForm = ({ node, onSave, onClose }) => {
  const method = node.data.type;
  const [formData, setFormData] = useState({
    endpoint: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxDescriptionLength = 200;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSave(formData);
      setIsSubmitting(false);
    }, 300);
  };

  const methodColors = {
    GET: "bg-emerald-50 text-emerald-700 border-emerald-200",
    POST: "bg-blue-50 text-blue-700 border-blue-200",
    PUT: "bg-amber-50 text-amber-700 border-amber-200",
    PATCH: "bg-purple-50 text-purple-700 border-purple-200",
    DELETE: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const methodColor = methodColors[method] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-w-full bg-white rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-mono font-semibold ${methodColor}`}
            >
              {method}
            </div>
            <div>
              <h2 className="text-base font-medium text-gray-800">Configure {method} API</h2>
              <p className="text-xs text-gray-400">Define endpoint and description</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wide">
              <Link className="w-3.5 h-3.5 text-gray-400" />
              Endpoint
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">
                /api/
              </span>
              <input
                type="text"
                name="endpoint"
                placeholder="users"
                value={formData.endpoint}
                onChange={handleChange}
                className="w-full pl-[52px] pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 focus:bg-white transition-all"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400">e.g. users, auth/login, products</p>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wide">
              <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
              Description
            </label>
            <textarea
              name="description"
              placeholder="Describe the purpose of this API"
              value={formData.description}
              onChange={handleChange}
              maxLength={maxDescriptionLength}
              rows={3}
              className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 focus:bg-white transition-all"
              required
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${
                  formData.description.length >= maxDescriptionLength
                    ? "text-rose-500"
                    : "text-gray-400"
                }`}
              >
                {formData.description.length} / {maxDescriptionLength}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSubmitting ? "Saving..." : "Save Configuration"}
              </span>
            </button>
          </div>
        </form>

        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">⌘</span>
            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Enter</span>
            <span className="text-gray-300">to save</span>
            <span className="w-px h-3 bg-gray-200" />
            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Esc</span>
            <span className="text-gray-300">to close</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HttpForm;
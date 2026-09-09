import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../utils/authApi";
import { useAuth } from "../../utils/AuthContext";
import { Mail, Lock, LogIn } from "lucide-react";

const LoginCard = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await loginUser(formData);
      login(response.user);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/50">
      {/* Logo */}
      {/* <div className="flex justify-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#0088cc] flex items-center justify-center shadow-lg shadow-[#00d4ff]/20">
          <svg
            width="28"
            height="28"
            viewBox="0 0 80 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 64C5.8 64 3.91667 63.2167 2.35 61.65C0.783333 60.0833 0 58.2 0 56V8C0 5.8 0.783333 3.91667 2.35 2.35C3.91667 0.783333 5.8 0 8 0H72C74.2 0 76.0833 0.783333 77.65 2.35C79.2167 3.91667 80 5.8 80 8V56C80 58.2 79.2167 60.0833 77.65 61.65C76.0833 63.2167 74.2 64 72 64H8ZM8 56H72V16H8V56ZM22 52L16.4 46.4L26.7 36L16.3 25.6L22 20L38 36L22 52ZM40 52V44H64V52H40Z"
              fill="white"
            />
          </svg>
        </div>
      </div> */}

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Sign in to your account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/60 tracking-wide">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              placeholder="name@company.com"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-white/60 tracking-wide">
              Password
            </label>
            <a href="#" className="text-xs text-white/30 hover:text-[#00d4ff] transition-colors">
              Forgot?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              placeholder="Enter your password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </span>
          )}
        </button>

        <p className="text-center text-sm text-white/30 mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-white hover:text-[#00d4ff] transition-colors">
            Create one
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginCard;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../utils/authApi";
import { useAuth } from "../../utils/AuthContext";
import { User, Mail, Lock, KeyRound, Sparkles , UserPlus } from "lucide-react";

const SignupCard = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [createUser, setCreateUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setCreateUser({ ...createUser, [event.target.name]: event.target.value });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (createUser.password !== createUser.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { confirmPassword, ...user } = createUser;
      const response = await registerUser(user);
      login(response.user);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.details?.length ? requestError.details.join(" ") : requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/50">
      {/* Logo */}
      {/* <div className="flex justify-center mb-6">
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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          Create account
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Start building your backends instantly
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/60 tracking-wide">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="John Doe"
              name="name"
              value={createUser.name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/60 tracking-wide">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              placeholder="name@company.com"
              name="email"
              value={createUser.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/60 tracking-wide">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              placeholder="Create a new password"
              name="password"
              value={createUser.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all"
              required
              minLength={6}
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-white/60 tracking-wide">
            Confirm Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="password"
              placeholder="Confirm your password"
              name="confirmPassword"
              value={createUser.confirmPassword}
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
          className="group relative w-full py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Create Account
            </span>
          )}
        </button>

        <p className="text-center text-sm text-white/30 mt-2">
          Already have an account?{" "}
          <a href="/login" className="text-white hover:text-[#00d4ff] transition-colors">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
};

export default SignupCard;
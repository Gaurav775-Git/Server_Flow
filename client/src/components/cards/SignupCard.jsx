import { useState } from "react";
const SignupCard = () => {
  const [createUser, setCreateUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    setCreateUser({ ...createUser, [event.target.name]: event.target.value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    console.log(createUser);
  };
  return (
    <div
      className="z-20 w-full max-w-[32rem] rounded-3xl border border-cyan-400/10 bg-[#161D27]/90 p-6 text-white backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.55),0_0_25px_rgba(34,211,238,0.08)] sm:p-8 md:p-10"
    >
      {/* Logo */}
      <div className="mb-6 flex justify-center sm:mb-8">
        <svg
          width="50"
          height="34"
          viewBox="0 0 80 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 64C5.8 64 3.91667 63.2167 2.35 61.65C0.783333 60.0833 0 58.2 0 56V8C0 5.8 0.783333 3.91667 2.35 2.35C3.91667 0.783333 5.8 0 8 0H72C74.2 0 76.0833 0.783333 77.65 2.35C79.2167 3.91667 80 5.8 80 8V56C80 58.2 79.2167 60.0833 77.65 61.65C76.0833 63.2167 74.2 64 72 64H8ZM8 56H72V16H8V56ZM22 52L16.4 46.4L26.7 36L16.3 25.6L22 20L38 36L22 52ZM40 52V44H64V52H40Z"
            fill="#4CD6FB"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center">
        {/* Heading */}
        <h2 className="mb-6 text-center text-2xl font-bold tracking-wide sm:text-3xl">
          Create Account
        </h2>

        <div className="form-box flex w-full flex-col items-center">
          <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-[#B6C3C8]">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Jhon Smith"
                id="name"
                name="name"
                autoComplete="name"
                onChange={handleChange}
                value={createUser.name}
                className="min-h-11 w-full rounded-lg border border-[#242930] bg-[#05090E] px-3 text-base outline-none transition placeholder:text-[#374146] focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#B6C3C8]">
                Email Address
              </label>

              <input
                type="email"
                placeholder="name@company.com"
                id="email"
                name="email"
                autoComplete="email"
                onChange={handleChange}
                value={createUser.email}
                className="min-h-11 w-full rounded-lg border border-[#242930] bg-[#05090E] px-3 text-base outline-none transition placeholder:text-[#374146] focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[#B6C3C8]">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a new password"
                id="password"
                name="password"
                autoComplete="new-password"
                onChange={handleChange}
                value={createUser.password}
                className="min-h-11 w-full rounded-lg border border-[#242930] bg-[#05090E] px-3 text-base outline-none transition placeholder:text-[#374146] focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#B6C3C8]"
              >
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm your password"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                onChange={handleChange}
                value={createUser.confirmPassword}
                className="min-h-11 w-full rounded-lg border border-[#242930] bg-[#05090E] px-3 text-base outline-none transition placeholder:text-[#374146] focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              className="mt-2 flex min-h-11 w-full cursor-pointer justify-center rounded-lg bg-[#22B8DD] px-4 text-lg font-medium text-[#05090E] transition-all duration-300 hover:bg-[#2CC6EB] hover:shadow-[0_0_20px_rgba(34,184,221,0.35)] focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:outline-none active:scale-[0.98]"
            >
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupCard;

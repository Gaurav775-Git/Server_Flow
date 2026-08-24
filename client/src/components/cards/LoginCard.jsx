import { useState } from "react";

const LoginCard = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div
      className="w-full bg-[#161D27]/90 z-20 rounded-3xl backdrop-blur-xl border border-cyan-400/10 shadow-[0_30px_70px_rgba(0,0,0,0.55),0_0_25px_rgba(34,211,238,0.08)] text-white p-6 sm:p-8"
    >
      <div className="flex justify-center mb-6 z-10" aria-hidden="true">
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
      <div className="flex flex-col items-center w-full">
        <h2 className="mb-8 text-2xl sm:text-3xl font-bold tracking-wide text-center">
          Welcome Back
        </h2>
        <div className="form-box flex flex-col items-center rounded-3xl w-full">
          <form action="" onSubmit={onSubmit} className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-[#B6C3C8]"
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full min-h-11 rounded-lg bg-[#05090E] border border-[#242930] px-3 text-base placeholder:text-[#374146] outline-none focus:ring-2 focus:ring-[#22B8DD]/40 focus:border-[#22B8DD]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-[#B6C3C8]"
              >
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full min-h-11 rounded-lg bg-[#05090E] border border-[#242930] px-3 text-base placeholder:text-[#374146] outline-none focus:ring-2 focus:ring-[#22B8DD]/40 focus:border-[#22B8DD]"
              />
            </div>

            <button
              type="submit"
              className="flex justify-center items-center mt-2 min-h-11
                  w-full
                  rounded-lg
                bg-[#22B8DD]
                  text-lg
                  font-medium
                text-[#05090E]
                  transition-all
                  duration-300
                hover:bg-[#2CC6EB]
                  hover:shadow-[0_0_20px_rgba(34,184,221,0.35)]
                  active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#22B8DD]/40 focus:ring-offset-2 focus:ring-offset-[#161D27] cursor-pointer"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;

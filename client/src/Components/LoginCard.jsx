import React from "react";
import { useState } from "react";

const LoginCard = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: [e.target.value] });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div
      className="w-full max-w-110 h-140 bg-[#161D27]/90 z-20 rounded-3xl backdrop-blur-xl relative
border border-cyan-400/10 shadow-[0_30px_70px_rgba(0,0,0,0.55),0_0_25px_rgba(34,211,238,0.08)] text-white text-2xl "
    >
      <div className="flex justify-center absolute top-20 left-48 z-10">
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
      <div className="">
        <div className="flex flex-col items-center w-full absolute top-30 px-6 py-4">
          <h2 className="mb-8 text-3xl font-bold tracking-wide">
            Welcome Back
          </h2>
          <div className="form-box flex flex-col items-center rounded-3xl  w-full p-4">
            <form
              action=""
              onSubmit={onSubmit}
              className="flex flex-col gap-5 w-full "
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className=" block text-[13px] font-medium text-[#B6C3C8]"
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
                  className="w-full bg-[#0B0E14] border border-[#242930] px-3 py-3 text-base  placeholder:text-[#374146]
          outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className=" block text-[13px] font-medium text-[#B6C3C8]"
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
                  className="w-full bg-[#0B0E14] border border-[#242930] px-3 py-3 text-base  placeholder:text-[#374146]
          outline-none"
                />
              </div>

              <button
                type="submit"
                className="flex justify-center mt-2
                  w-full
                  rounded-lg
                bg-[#22B8DD]
                  py-3
                  text-lg
                  font-medium
                text-[#0B0E14]
                  transition-all
                  duration-300
                hover:bg-[#2CC6EB]
                  hover:shadow-[0_0_20px_rgba(34,184,221,0.35)]
                  active:scale-[0.98]
                  cursor-pointer"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;

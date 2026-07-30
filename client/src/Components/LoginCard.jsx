import React from "react";

const LoginCard = () => {
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
        <h2>welcome</h2>
      </div>
    </div>
  );
};

export default LoginCard;

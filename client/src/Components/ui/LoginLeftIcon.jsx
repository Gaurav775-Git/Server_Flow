import React from "react";

const LoginLeftIcon = () => {
  return (
    <>
      <div
        className="absolute -left-40 top-1/2 -translate-y-1/2
          w-[600px] h-[600px] rounded-full blur-[180px]"
        style={{
          background: "rgba(42, 67, 82, 0.45)",
        }}
      />
      <div className="flex flex-col gap-50 left-50 absolute z-10">
        <svg
          width="80"
          height="72"
          viewBox="0 0 80 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {" "}
          <path
            d="M52 72V60H36V20H28V32H0V0H28V12H52V0H80V32H52V20H44V52H52V40H80V72H52ZM60 24H72V8H60V24ZM60 64H72V48H60V64ZM8 24H20V8H8V24Z"
            fill="#4CD6FB"
          />{" "}
        </svg>
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44 52L36 44L44 36L52 44L44 52ZM35.5 28.5L25.5 18.5L44 0L62.5 18.5L52.5 28.5L44 20L35.5 28.5ZM18.5 62.5L0 44L18.5 25.5L28.5 35.5L20 44L28.5 52.5L18.5 62.5ZM69.5 62.5L59.5 52.5L68 44L59.5 35.5L69.5 25.5L88 44L69.5 62.5ZM44 88L25.5 69.5L35.5 59.5L44 68L52.5 59.5L62.5 69.5L44 88Z"
            fill="#FFD54F"
          />
        </svg>
      </div>
    </>
  );
};

export default LoginLeftIcon;

import React from "react";
import LoginCard from "../Components/LoginCard";
import LoginLeftIcon from "../Components/ui/LoginLeftIcon";
import LoginRightIcon from "../Components/ui/LoginRightIcon";
const Login = () => {
  return (
    <div className="min-h-screen relative flex justify-center items-center bg-[#10131A]">
      
      <LoginLeftIcon />
      <LoginCard />
      <LoginRightIcon />

       
    </div>
  );
};

export default Login;

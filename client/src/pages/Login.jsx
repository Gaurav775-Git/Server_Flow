import LoginCard from "../components/LoginCard";
import LoginLeftIcon from "../components/ui/LoginLeftIcon";
import LoginRightIcon from "../components/ui/LoginRightIcon";
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

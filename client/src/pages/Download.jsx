import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import DownloadBox from "../components/download/DownloadBox";

const Download = () => {
  return (
    <div className="min-h-screen bg-[#000000]">
      <NavBar />
      <DownloadBox />
      <Footer />
    </div>
  );
};

export default Download;

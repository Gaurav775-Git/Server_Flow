import DashboardContent from '../components/DashboardContent';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import DashboardSideBar from '../components/ui/DashboardSideBar';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-[#000000] text-[#e1e2eb]">
      <NavBar />
      <main className="mx-auto flex min-h-screen max-w-[1440px] px-4 md:px-8">
        <DashboardSideBar />
        <DashboardContent />
      </main>
      <Footer />
      </div>
  );
};

export default DashboardPage;

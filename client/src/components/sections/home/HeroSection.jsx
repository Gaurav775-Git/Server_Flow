const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-48 overflow-hidden bg-[#0b0e14]">
      {/* Floating Abstract Shapes */}
      <div className="absolute top-10 right-[5%] text-[#4cd6fb]/40 select-none pointer-events-none">
        <span className="material-symbols-outlined text-[18rem] rotate-12 blur-sm">emergency</span>
      </div>
      <div className="absolute bottom-10 left-[2%] text-[#a9d63e]/30 select-none pointer-events-none">
        <span className="material-symbols-outlined text-[14rem] -rotate-45 blur-sm">shapes</span>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 relative z-10 flex flex-col lg:flex-row items-center gap-24">
        {/* Left Content */}
        <div className="lg:w-1/2">
          <h1 className="uppercase tracking-[-0.04em] text-[44px] md:text-[72px] mb-8 leading-[1.05] font-black text-[#e1e2eb]">
            <span className="text-[#4cd6fb]">VISUAL BACKEND</span><br/>
            INFRASTRUCTURE,<br/>
            MADE SIMPLE.
          </h1>
          <p className="text-lg text-[#bcc9ce] mb-12 max-w-xl text-xl leading-relaxed opacity-80">
            Design your backend visually, get production-ready code instantly — on any cloud, in minutes, with zero manual coding — all backed by Server Flow's 99.9% reliability.
          </p>
          <div className="flex flex-wrap gap-5">
            <button className="bg-[#a9d63e] text-[#263500] px-10 py-4 rounded-full font-black text-lg hover:shadow-[0_0_40px_rgba(169,214,62,0.3)] transition-all">
              Start building
            </button>
            <button className="border border-[#3d494d] text-[#e1e2eb] px-10 py-4 rounded-full font-black text-lg hover:bg-[#272a31] transition-all">
              Request a demo
            </button>
          </div>
        </div>

        {/* Terminal Visual */}
        <div className="lg:w-1/2 w-full relative">
          <div className="absolute -inset-20 bg-[#4cd6fb]/20 blur-[120px] rounded-full opacity-40"></div>
          <div className="relative bg-[#0d1117] border border-[#3d494d] rounded-2xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7),0_0_40px_rgba(76,214,251,0.1)]">
            {/* Terminal Header */}
            <div className="bg-[#161b22] px-6 py-4 flex items-center justify-between border-b border-[#3d494d]">
              <div className="flex gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="text-[#bcc9ce] font-['Geist_Mono'] text-[10px] uppercase tracking-[0.2em] opacity-50">
                serverflow --deploy --prod
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-10 font-['Geist_Mono'] text-sm leading-8">
              <div className="flex gap-6">
                <span className="text-[#00b4d8]">curl -X POST \</span>
              </div>
              <div className="flex gap-6">
                <span className="text-[#e1e2eb] ml-4">--url '<span className="text-[#4cd6fb]">https://api.serverflow.io/v1/deploy</span>' \</span>
              </div>
              <div className="flex gap-6">
                <span className="text-[#e1e2eb] ml-4">--header '<span className="text-[#f7768e]">Authorization: Bearer SF_TOKEN</span>' \</span>
              </div>
              <div className="flex gap-6">
                <span className="text-[#e1e2eb] ml-4">{"--data '{"}</span>
              </div>
              <div className="flex gap-6">
                <span className="text-[#e1e2eb] ml-12">"<span className="text-[#a9d63e]">flow_name</span>": "order-processing-v2",</span>
              </div>
              <div className="flex gap-6">
                <span className="text-[#e1e2eb] ml-12">"<span className="text-[#a9d63e]">runtime</span>": "nodejs-20-lambda",</span>
              </div>
              <div className="flex gap-6">
                <span className="text-[#e1e2eb] ml-12">"<span className="text-[#a9d63e]">target</span>": "aws-us-east-1"</span>
              </div>
              <div className="flex gap-6">
                <span className="text-[#e1e2eb] ml-4">{"}'"}</span>
              </div>
              
              {/* Success Message */}
              <div className="mt-8 flex items-center gap-3 text-[#a9d63e] font-bold">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Deployment Successful (2.4s)</span>
              </div>
            </div>

            {/* Badge */}
            <div className="absolute bottom-6 right-6 bg-[#FFD54F] text-black px-3 py-1.5 rounded font-black text-[10px] font-['Geist_Mono'] shadow-xl transform rotate-2">
              AIVEN-POWERED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

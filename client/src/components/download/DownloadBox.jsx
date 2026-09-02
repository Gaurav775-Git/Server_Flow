import styles from "./Download.module.css";

const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

const DownloadBox = () => {
  return (
    <div className="w-full min-h-[550px] text-white flex justify-center relative">
      <div className="w-full flex flex-col justify-center items-center gap-1.5">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-7">
          Your Server is <span className="text-[#54EBFF]">Ready</span>
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-lg leading-relaxed mb-6">
          Your ServerFlow project has been successfully generated. Download the
          complete project and start building right away.
        </p>

        {/* Included files */}
        <p className="text-gray-500 text-sm mb-8">
          Includes server configuration, API routes, database setup,
          authentication, and required dependencies.
        </p>

        <button className={styles.button}>
          <svg
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            height="60"
            width="60"
            className={styles.button_icon}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="none" d="M0 0h24v24H0z" stroke="none" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
            <path d="M7 11l5 5l5 -5" />
            <path d="M12 4l0 12" />
          </svg>

          <span className={styles.button__text} onClick={() => window.location.href = `${backendUrl}/download`}>Download</span></button>
        <p className="text-gray-600 text-xs mt-5">ZIP archive • Ready to run</p>
      </div>
    </div>
  );
};

export default DownloadBox;

import React from "react";

const Loader = () => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Loading";

  return (
    <div className="flex justify-center items-center h-screen light_bg_color">
      <div className="loader">
        <span>{appName}</span>
      </div>

      <style jsx>{`
        .loader {
          font-size: 2rem;
          font-weight: bold;
          text-align: center;
          padding: 10px 20px;
          border-radius: 12px;
          background: linear-gradient(
              135deg,
              transparent calc(50% - 0.5em),
              var(--primary-color) 0 calc(50% + 0.5em),
              transparent 0
            )
            right/300% 100%;
          animation: l22 2s infinite alternate;
        }

        .loader span {
          background: linear-gradient(
            135deg,
            var(--primary-color),
            var(--primary-color)
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 2s infinite;
        }

        @keyframes l22 {
          100% {
            background-position: left;
          }
        }
      `}</style>
    </div>
  );
};
export default Loader;

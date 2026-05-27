import React from "react";
import ModuleCard from "./ModuleCard";
import { moduleCards } from "./moduleData";

export default function ModuleGrid() {
  const modules = moduleCards;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          padding: 40px 0;
        }

        @media (max-width: 768px) {
          .module-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
          }
        }
      `}</style>

      <section className="py-16 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-12 space-y-4">
            <h2 className="text-4xl font-bold text-white">
              Welcome to your Dashboard
            </h2>
            <p className="text-xl text-slate-300">
              Access all modules and tools to manage your EPC operations
            </p>
          </div>

          {/* Module Grid */}
          <div className="module-grid">
            {modules.map((module, index) => (
              <ModuleCard key={module.label} module={module} index={index} />
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-16 rounded-lg border border-slate-700 bg-slate-900/50 p-6 text-center">
            <p className="text-slate-300">
              🚀 More modules and features coming soon. Your feedback helps us build better.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

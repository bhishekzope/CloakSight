import React from "react";
import { ReimbursementPortal } from "./ReimbursementPortal";
import { PerceptionTelemetry } from "./PerceptionTelemetry";

export const LivePerceptionSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Interactive Reimbursement Portal */}
      <div className="lg:col-span-7">
        <ReimbursementPortal />
      </div>

      {/* Right Column: Real-Time Perception Telemetry */}
      <div className="lg:col-span-5">
        <PerceptionTelemetry />
      </div>
    </div>
  );
};

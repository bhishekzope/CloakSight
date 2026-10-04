import React from "react";
import { DemoProvider, useDemo } from "./context/DemoContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { OrchestratorBar } from "./components/layout/OrchestratorBar";
import { OverviewSection } from "./components/overview/OverviewSection";
import { LivePerceptionSection } from "./components/perception/LivePerceptionSection";
import { VisualRedactionSection } from "./components/redaction/VisualRedactionSection";
import { PrivacyFirewallSection } from "./components/firewall/PrivacyFirewallSection";
import { AgentExecutionSection } from "./components/agent/AgentExecutionSection";
import { AuditMetricsSection } from "./components/audit/AuditMetricsSection";

const DashboardContent: React.FC = () => {
  const { activeSection } = useDemo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-navy-950 font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#060a13]">
        {/* Top Header */}
        <Header />

        {/* Scrollable Section Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto pb-10">
            {activeSection === "overview" && <OverviewSection />}
            {activeSection === "perception" && <LivePerceptionSection />}
            {activeSection === "redaction" && <VisualRedactionSection />}
            {activeSection === "firewall" && <PrivacyFirewallSection />}
            {activeSection === "agent" && <AgentExecutionSection />}
            {activeSection === "audit" && <AuditMetricsSection />}
          </div>
        </main>

        {/* Persistent Bottom Orchestrator Bar */}
        <OrchestratorBar />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DemoProvider>
      <DashboardContent />
    </DemoProvider>
  );
};

export default App;

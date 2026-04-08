import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import TeamMembers from "@/pages/TeamMembers";
import TeamMemberDetail from "@/pages/TeamMemberDetail";
import LiveMap from "@/pages/LiveMap";
import Alerts from "@/pages/Alerts";
import Reports from "@/pages/Reports";
import Jobs from "@/pages/Jobs";
import Geofences from "@/pages/Geofences";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="App min-h-screen bg-white">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="team" element={<TeamMembers />} />
            <Route path="team/:id" element={<TeamMemberDetail />} />
            <Route path="map" element={<LiveMap />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="geofences" element={<Geofences />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;

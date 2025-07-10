import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./Layout";
import Calendar from "./Calendar";
import Setting from "./Setting";
import PerformanceSSG from "./PerformanceSSG";
import ACWR from "./ACWR";
import Home from "./Home";
import PlayerDetail from "./PlayerDetail";
import MonitoringPage from "./MonitoringPage";
import VideoAnalysis from "./VideoAnalysis";
import Evaluation from "./Evaluation";
import Login from "./Login";
import PrivateRoute from "./PrivateRoute";
import Logout from "./Logout";
import Infortuni from "./Infortuni";
import Statistiche from "./Statistiche";
import WorkoutAnalysisCharts from "./WorkoutAnalysisCharts";

// Profilo utente placeholder
function Profile() {
  return <h1>Profilo utente</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotta pubblica: login */}
        <Route path="/login" element={<Login />} />

        {/* Rotte protette: tutto sotto "/" */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="performance-ssg" element={<PerformanceSSG />} />
          <Route path="acwr" element={<ACWR />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="setting" element={<Setting />} />
          <Route path="profile" element={<Profile />} />
          <Route path="logout" element={<Logout />} />
          <Route path="players/:name" element={<PlayerDetail />} />
          <Route path="video-analysis" element={<VideoAnalysis />} />
          <Route path="evaluation" element={<Evaluation />} />
          <Route path="Statistiche" element={<Statistiche />} />
          <Route path="infortuni" element={<Infortuni />} />
          <Route path="WorkoutAnalysisCharts" element={<WorkoutAnalysisCharts />} />
        </Route>

        {/* Rotta fallback: qualsiasi altra cosa va al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

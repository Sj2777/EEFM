import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import NewApplicant from './pages/NewApplicant';
import ScoreExplanation from './pages/ScoreExplanation';
import ApplicantRecords from './pages/ApplicantRecords';
import AnalyticsReports from './pages/AnalyticsReports';
import ModelPerformance from './pages/ModelPerformance';
import SettingsData from './pages/SettingsData';

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-applicant" element={<NewApplicant />} />
          <Route path="/score" element={<ScoreExplanation />} />
          <Route path="/score/:assessmentId" element={<ScoreExplanation />} />
          <Route path="/records" element={<ApplicantRecords />} />
          <Route path="/analytics" element={<AnalyticsReports />} />
          <Route path="/model" element={<ModelPerformance />} />
          <Route path="/settings" element={<SettingsData />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

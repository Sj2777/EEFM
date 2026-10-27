import axios from 'axios';
import type {
  DashboardSummary,
  DashboardCharts,
  AnalyticsSummary,
  ModelStatus,
  ModelMetrics,
  FeatureImportanceResponse,
  ScoreResponse,
  ApplicantFormData,
  PaginatedApplicants,
  ApplicantDetail,
  AssessmentDetail,
  DatasetUploadResponse,
} from '../types';

const resolveApiBaseUrl = (): string => {
  // Explicit env override (set VITE_API_BASE_URL=http://localhost:8000 in .env)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // When served from port 8000 (FastAPI serves both API + frontend), use relative path
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    if (port === '8000' || port === '') {
      return '/api';  // same-origin, no CORS needed
    }
    // Running on a different port (e.g. 5501 via Live Server) → call backend directly
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000/api`;
  }

  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Health ───────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get<{ status: string }>('/health');

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/dashboard/summary');

export const getDashboardCharts = () =>
  api.get<DashboardCharts>('/dashboard/charts');

// ─── Score / Submit Applicant ─────────────────────────────────────────────────
export const submitApplicantForScore = (data: ApplicantFormData) =>
  api.post<ScoreResponse>('/score', data);

export const createApplicant = (data: ApplicantFormData) =>
  api.post<{ applicant: any; assessment: ScoreResponse }>('/applicants', data);

export const reassessApplicant = (applicantId: string) =>
  api.post<ScoreResponse>(`/applicants/${applicantId}/assessments`);

// ─── Applicants ───────────────────────────────────────────────────────────────
export const getApplicants = (params: {
  page?: number;
  page_size?: number;
  search?: string;
  employment_status?: string;
  risk_level?: string;
  score_min?: number;
  score_max?: number;
  sort_by?: string;
  sort_order?: string;
}) => api.get<PaginatedApplicants>('/applicants', { params });

export const getApplicant = (id: string) =>
  api.get<ApplicantDetail>(`/applicants/${id}`);

export const getApplicantAssessments = (id: string) =>
  api.get<AssessmentDetail[]>(`/applicants/${id}/assessments`);

// ─── Assessments ──────────────────────────────────────────────────────────────
export const getAssessment = (assessmentId: string) =>
  api.get<AssessmentDetail>(`/assessments/${assessmentId}`);

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalyticsSummary = () =>
  api.get<AnalyticsSummary>('/analytics/summary');

// ─── Model ────────────────────────────────────────────────────────────────────
export const getModelStatus = () => api.get<ModelStatus>('/model/status');
export const getModelMetrics = () => api.get<ModelMetrics>('/model/metrics');
export const getFeatureImportance = () =>
  api.get<FeatureImportanceResponse>('/model/feature-importance');
export const retrainModel = () =>
  api.post<{ status: string; message: string; version: string; metrics: any }>('/model/retrain');

// ─── Data ─────────────────────────────────────────────────────────────────────
export const downloadSampleCSV = () =>
  api.get('/data/sample', { responseType: 'blob' });

export const exportDataCSV = (format: string = 'csv') =>
  api.get('/data/export', { params: { format }, responseType: 'blob' });

export const uploadDataCSV = (file: File, previewOnly: boolean = false) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<DatasetUploadResponse>(`/data/upload?preview_only=${previewOnly}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const downloadAssessmentReport = (assessmentId: string) =>
  api.get(`/reports/assessments/${assessmentId}`, { responseType: 'blob' });

export const downloadAnalyticsReport = () =>
  api.get('/reports/analytics', { responseType: 'blob' });

// ─── Download Helper ──────────────────────────────────────────────────────────
export const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default api;

// ─── Applicant & Assessment ───────────────────────────────────────────────────

export interface ApplicantFormData {
  applicant_id?: string;
  name?: string;
  age: number;
  employment_status: string;
  educational_background: string;
  bank_account_tenure: string;
  residential_stability: string;
  utility_payment_history: string;
  rent_payment_history: string;
  telecommunications_payment_history: string;
  savings_pattern: string;
  gig_economy_participation?: string;
  persist?: boolean;
}

export interface ScoreResponse {
  applicant_id: string;
  assessment_id: string;
  score: number;
  risk_level: string;
  predicted_category: string;
  repayment_probability: number;
  class_probabilities: Record<string, number>;
  key_factors: Record<string, number>;
  suggestions: string[];
  summary_text: string;
  model_version: string;
  created_at: string;
  disclaimer: string;
}

export interface AssessmentDetail {
  assessment_id: string;
  applicant_id: string;
  score: number;
  risk_level: string;
  predicted_category: string;
  repayment_probability: number;
  class_probabilities: Record<string, number>;
  key_factors: Record<string, number>;
  suggestions: string[];
  model_version: string;
  created_at: string;
  date: string;
  applicant_data?: Partial<ApplicantFormData>;
  disclaimer: string;
}

export interface ApplicantItem {
  id: number;
  applicant_id: string;
  name: string;
  age: number;
  employment_status: string;
  score: number;
  risk_level: string;
  predicted_category: string;
  assessment_id: string;
  created_at: string;
  date: string;
}

export interface PaginatedApplicants {
  items: ApplicantItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApplicantDetail {
  applicant_id: string;
  name: string;
  age: number;
  employment_status: string;
  educational_background: string;
  bank_account_tenure: string;
  residential_stability: string;
  rent_payment_history: string;
  utility_payment_history: string;
  telecommunications_payment_history: string;
  savings_pattern: string;
  gig_economy_participation?: string;
  created_at: string;
  latest_assessment?: AssessmentDetail;
  assessments: AssessmentDetail[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface ScoreDistributionItem {
  range: string;
  label?: string;
  count: number;
  color?: string;
}

export interface RepaymentDistributionItem {
  category: string;
  count: number;
  color?: string;
}

export interface RecentAssessmentItem {
  applicant_id: string;
  assessment_id: string;
  score: number;
  risk_level: string;
  predicted_category: string;
  date: string;
  timestamp: string;
}

export interface DashboardSummary {
  total_applicants: number;
  total_assessments: number;
  average_experimental_score: number;
  low_risk_count: number;
  low_risk_percentage: number;
  high_risk_count: number;
  high_risk_percentage: number;
  score_distribution: ScoreDistributionItem[];
  repayment_distribution: RepaymentDistributionItem[];
  recent_assessments: RecentAssessmentItem[];
  disclaimer: string;
}

export interface DashboardCharts {
  score_distribution: ScoreDistributionItem[];
  repayment_distribution: RepaymentDistributionItem[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface ScoreDonutItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PaymentTrendItem {
  month: string;
  rent: number;
  utilities: number;
  telecom: number;
}

export interface PaymentCategoryItem {
  category: string;
  count: number;
}

export interface RiskByEmploymentItem {
  employment: string;
  count: number;
  avg_estimated_score: number;
}

export interface AnalyticsSummary {
  data_source: string;
  total_applicants: number;
  average_score: number;
  min_score: number;
  max_score: number;
  median_score: number;
  score_donut: ScoreDonutItem[];
  payment_trends: PaymentTrendItem[];
  payment_patterns: {
    rent: PaymentCategoryItem[];
    utilities: PaymentCategoryItem[];
    telecom: PaymentCategoryItem[];
  };
  risk_by_employment: RiskByEmploymentItem[];
  disclaimer: string;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export interface ModelStatus {
  status: string;
  model_type: string;
  model_version: string;
  trained_at: string;
  dataset_path: string;
  total_records: number;
  train_records: number;
  test_records: number;
  features_used: string[];
  excluded_features: string[];
  classes: string[];
  disclaimer: string;
}

export interface ClassificationReportEntry {
  precision: number;
  recall: number;
  'f1-score': number;
  support: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  classes: string[];
  classification_report: Record<string, ClassificationReportEntry>;
  model_information: {
    algorithm: string;
    training_data: string;
    test_accuracy: string;
    last_trained: string;
  };
  disclaimer: string;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface FeatureImportanceResponse {
  feature_importance: FeatureImportanceItem[];
  method: string;
  disclaimer: string;
}

// ─── Data Management ──────────────────────────────────────────────────────────

export interface DatasetUploadResponse {
  status: string;
  valid: boolean;
  filename: string;
  row_count: number;
  columns?: string[];
  missing_columns?: string[];
  errors?: string[];
  target_distribution?: Record<string, number>;
  preview?: Record<string, any>[];
  message?: string;
}

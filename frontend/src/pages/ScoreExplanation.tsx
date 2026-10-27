import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText,
  RotateCw,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  Download,
  Shield,
  Layers,
  ArrowLeft,
  User,
} from 'lucide-react';
import {
  getAssessment,
  reassessApplicant,
  downloadAssessmentReport,
  triggerDownload,
} from '../services/api';
import type { AssessmentDetail } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  RiskBadge,
  RepaymentBadge,
  LoadingSpinner,
  DisclaimerBanner,
  ErrorState,
} from '../components/ui';

export default function ScoreExplanation() {
  const { assessmentId } = useParams<{ assessmentId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassessing, setReassessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If state was passed via navigate, we can use it immediately or fetch fresh data
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (assessmentId) {
          const res = await getAssessment(assessmentId);
          setAssessment(res.data);
          if (res.data.score >= 700) {
            triggerConfetti();
          }
        } else {
          // If no assessment ID passed in route, check if we have one in location.state or fetch latest
          const stateData = (location.state as any)?.scoreData;
          if (stateData?.assessment_id) {
            const res = await getAssessment(stateData.assessment_id);
            setAssessment(res.data);
            if (res.data.score >= 700) {
              triggerConfetti();
            }
          } else {
            // Default to empty or redirect
            setError('No assessment ID specified. Please select an applicant from Records or create a New Applicant.');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Unable to load assessment details.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [assessmentId, location.state]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if confetti not supported
    }
  };

  const handleDownloadPDF = async () => {
    if (!assessment) return;
    setDownloading(true);
    try {
      const res = await downloadAssessmentReport(assessment.assessment_id);
      triggerDownload(new Blob([res.data], { type: 'application/pdf' }), `AltScore_Assessment_${assessment.applicant_id}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF report. Check server logs.');
    } finally {
      setDownloading(false);
    }
  };

  const handleReassess = async () => {
    if (!assessment) return;
    setReassessing(true);
    try {
      const res = await reassessApplicant(assessment.applicant_id);
      // Navigate to new assessment
      navigate(`/score/${res.data.assessment_id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to re-run assessment.');
    } finally {
      setReassessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <LoadingSpinner size={36} className="text-blue-600" />
        <p className="text-sm text-slate-500">Retrieving experimental credit assessment...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-10">
        <DisclaimerBanner />
        <ErrorState
          title="Assessment Not Found"
          message={error || 'No assessment data available'}
        />
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/records')}>
            Browse Records
          </Button>
          <Button onClick={() => navigate('/new-applicant')}>
            Evaluate New Applicant
          </Button>
        </div>
      </div>
    );
  }

  const probPaid = Math.round((assessment.class_probabilities?.['Paid on Time'] ?? 0) * 100);
  const probLate = Math.round((assessment.class_probabilities?.['Late Payment'] ?? 0) * 100);
  const probDefault = Math.round((assessment.class_probabilities?.['Default'] ?? 0) * 100);

  // Key factors format
  const factorEntries = Object.entries(assessment.key_factors || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/records')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition mb-1"
          >
            <ArrowLeft size={13} /> Back to Records
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            Assessment Results: <span className="font-mono text-blue-600">{assessment.applicant_id}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Assessment ID: <span className="font-mono">{assessment.assessment_id}</span> • Evaluated on {assessment.date || assessment.created_at}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw size={14} className={reassessing ? 'animate-spin' : ''} />}
            loading={reassessing}
            onClick={handleReassess}
          >
            Re-Assess
          </Button>
          <Button
            size="sm"
            leftIcon={<Download size={14} />}
            loading={downloading}
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Download PDF Report
          </Button>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Main Score & Metrics Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gauge Arc & Primary Result */}
        <Card className="lg:col-span-5 flex flex-col items-center justify-center p-6 text-center bg-white">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Experimental Credit Score
          </span>

          <ScoreGauge score={assessment.score} size={220} strokeWidth={18} />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <RiskBadge risk={assessment.risk_level} size="lg" />
            <RepaymentBadge label={assessment.predicted_category} />
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Model Version: <span className="font-mono text-slate-600">{assessment.model_version || 'rf-v1'}</span>
          </div>
        </Card>

        {/* Right: Repayment Probability & Model Confidence */}
        <Card className="lg:col-span-7 flex flex-col justify-between">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>Repayment Category Probabilities</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Machine learning multi-class prediction probabilities for repayment behavior
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Probability Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Paid on Time
                  </span>
                  <span>{probPaid}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${probPaid}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Late Payment
                  </span>
                  <span>{probLate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${probLate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Default Risk
                  </span>
                  <span>{probDefault}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${probDefault}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Applicant Profile Snapshot if available */}
            {assessment.applicant_data && (
              <div className="pt-4 mt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Applicant Profile Highlights
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Employment</span>
                    <span className="font-semibold text-slate-700">{assessment.applicant_data.employment_status || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Rent Payment</span>
                    <span className="font-semibold text-slate-700">{assessment.applicant_data.rent_payment_history || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Utility Payment</span>
                    <span className="font-semibold text-slate-700">{assessment.applicant_data.utility_payment_history || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Bank Tenure</span>
                    <span className="font-semibold text-slate-700">{assessment.applicant_data.bank_account_tenure || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Savings Pattern</span>
                    <span className="font-semibold text-slate-700">{assessment.applicant_data.savings_pattern || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Res. Stability</span>
                    <span className="font-semibold text-slate-700">{assessment.applicant_data.residential_stability || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section: Key Factors & Actionable Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Influencing Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              <CardTitle>Key Influencing Features</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Relative importance weights calculated from model feature significance
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {factorEntries.length > 0 ? (
              factorEntries.map(([key, weight]) => {
                const pct = Math.round(weight * 100);
                const isHigh = pct >= 15;
                const cleanKey = key.replace(/_/g, ' ');

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{cleanKey}</span>
                      <span className={`font-semibold ${isHigh ? 'text-blue-600' : 'text-slate-500'}`}>
                        {pct}% weight
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh ? 'bg-blue-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Feature factor weights calculated globally from training set
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actionable Improvement Suggestions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              <CardTitle>Actionable Steps for Score Improvement</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized guidance derived from alternative stability rules
            </p>
          </CardHeader>
          <CardContent className="p-5">
            {assessment.suggestions && assessment.suggestions.length > 0 ? (
              <ul className="space-y-3">
                {assessment.suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Maintain on-time utility and telecommunication bill payments.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Establish recurring monthly savings contributions.</span>
                </li>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

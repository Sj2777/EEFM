import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Cpu,
  Target,
  CheckCircle2,
  TrendingUp,
  RotateCw,
  Info,
  ShieldAlert,
  Sliders,
  Layers,
} from 'lucide-react';
import {
  getModelMetrics,
  getModelStatus,
  getFeatureImportance,
  retrainModel,
} from '../services/api';
import type {
  ModelMetrics,
  ModelStatus,
  FeatureImportanceItem,
} from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  LoadingSpinner,
  DisclaimerBanner,
  MetricCard,
  ErrorState,
} from '../components/ui';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [importance, setImportance] = useState<FeatureImportanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, sRes, fRes] = await Promise.all([
        getModelMetrics(),
        getModelStatus(),
        getFeatureImportance(),
      ]);
      setMetrics(mRes.data);
      setStatus(sRes.data);
      setImportance(fRes.data.feature_importance || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load model performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetrain = async () => {
    if (!window.confirm('Do you want to retrain the Random Forest model on the current dataset?')) {
      return;
    }
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const res = await retrainModel();
      setRetrainSuccess(
        `Model retrained successfully! New version: ${res.data.version || 'v2'}. Test Accuracy: ${(
          (res.data.metrics?.accuracy ?? 0.8) * 100
        ).toFixed(1)}%`
      );
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Model retraining failed.');
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <LoadingSpinner size={36} className="text-blue-600" />
        <p className="text-sm text-slate-500">Evaluating model metrics on held-out test split...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-4">
        <DisclaimerBanner />
        <ErrorState message={error || 'Unable to retrieve model metrics'} retry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Model Performance & Evaluation</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              RandomForest (v1)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Held-out test set evaluation (80/20 stratified split) on synthetic alternative credit dataset.
          </p>
        </div>

        <Button
          leftIcon={<RotateCw size={14} className={retraining ? 'animate-spin' : ''} />}
          loading={retraining}
          onClick={handleRetrain}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Retrain Model
        </Button>
      </div>

      <DisclaimerBanner />

      {/* Retrain Alert */}
      {retrainSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>{retrainSuccess}</span>
        </div>
      )}

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Test Accuracy"
          value={`${metrics.accuracy}%`}
          subtitle="Overall correct predictions"
          icon={<Target size={18} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Macro Precision"
          value={`${metrics.precision}%`}
          subtitle="Avg true positive rate per class"
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
        <MetricCard
          title="Macro Recall"
          value={`${metrics.recall}%`}
          subtitle="Coverage of actual outcomes"
          icon={<TrendingUp size={18} className="text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <MetricCard
          title="Macro F1-Score"
          value={`${metrics.f1_score}%`}
          subtitle="Harmonic mean of precision & recall"
          icon={<Cpu size={18} className="text-amber-600" />}
          iconBg="bg-amber-100"
        />
      </div>

      {/* Grid: Confusion Matrix & Model Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Confusion Matrix (Held-out Test Partition)</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating predicted labels against true test labels
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-slate-400 font-normal">True \ Predicted</th>
                    {metrics.classes.map((cls) => (
                      <th key={cls} className="p-2 font-semibold text-slate-700 bg-slate-50 rounded">
                        {cls}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.confusion_matrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="p-2.5 font-semibold text-slate-700 bg-slate-50 text-left rounded">
                        {metrics.classes[rIdx] || `Class ${rIdx}`}
                      </td>
                      {row.map((val, cIdx) => {
                        const isDiagonal = rIdx === cIdx;
                        return (
                          <td
                            key={cIdx}
                            className={`p-3 font-mono font-bold rounded text-sm transition-all ${
                              isDiagonal
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : val > 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-slate-50/50 text-slate-400'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                Correct Predictions (Diagonal)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
                Misclassifications
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Model Information Card */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Model Specifications</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Architecture & training hyper-parameters</p>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Algorithm</span>
              <span className="font-semibold text-slate-800">
                {metrics.model_information.algorithm} (100 Trees)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Training Partition</span>
              <span className="font-semibold text-slate-800">
                {status?.train_records ?? 800} records (80%)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Test Partition</span>
              <span className="font-semibold text-slate-800">
                {status?.test_records ?? 200} records (20%)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Last Trained</span>
              <span className="font-semibold text-slate-800">
                {status?.trained_at || metrics.model_information.last_trained}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Model Version</span>
              <span className="font-mono font-semibold text-blue-600">
                {status?.model_version || 'rf-v1'}
              </span>
            </div>

            {/* Ethical Safeguard Note */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldAlert size={14} className="text-blue-600" />
                Ethical Fairness Safeguard
              </div>
              <span>
                Protected demographic attributes (<strong>Age</strong>, <strong>Educational Background</strong>)
                and invasive tracking signals (<strong>Social Media Footprint</strong>, <strong>Online Shopping Habits</strong>)
                are explicitly excluded from model training to prevent algorithmic bias.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance Horizontal Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Importance (Permutation Method)</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative statistical impact of alternative financial indicators on model accuracy
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Permutation Importance (n_repeats=10)
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={importance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <YAxis
                  dataKey="feature"
                  type="category"
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: any) => [`${(Number(v) * 100).toFixed(2)}% accuracy drop`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Classification Report Table */}
      {metrics.classification_report && Object.keys(metrics.classification_report).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Classification Report</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Class-level precision, recall, and F1-score performance breakdown
            </p>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase">Class</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase">Precision</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase">Recall</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase">F1-Score</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(metrics.classification_report).map(([className, report]) => {
                  if (typeof report !== 'object' || report === null) return null;
                  const isAvg = className.includes('avg') || className.includes('accuracy');
                  return (
                    <tr key={className} className={isAvg ? 'bg-slate-50/60 font-semibold' : 'hover:bg-slate-50/40'}>
                      <td className="px-5 py-3 text-slate-800">{className}</td>
                      <td className="px-5 py-3 text-right font-mono">
                        {(report.precision * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        {(report.recall * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-blue-600">
                        {(report['f1-score'] * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-500">
                        {report.support}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

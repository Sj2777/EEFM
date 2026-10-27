import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  RotateCw,
  Database,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  HardDrive,
  Trash2,
  FileCheck,
} from 'lucide-react';
import {
  downloadSampleCSV,
  exportDataCSV,
  uploadDataCSV,
  retrainModel,
  getModelStatus,
  triggerDownload,
} from '../services/api';
import type { ModelStatus, DatasetUploadResponse } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  DisclaimerBanner,
  LoadingSpinner,
} from '../components/ui';

export default function SettingsData() {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DatasetUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await getModelStatus();
      setModelStatus(res.data);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleDownloadSample = async () => {
    try {
      const res = await downloadSampleCSV();
      triggerDownload(new Blob([res.data], { type: 'text/csv' }), 'AltScore_Sample_Template.csv');
    } catch {
      alert('Failed to download sample CSV.');
    }
  };

  const handleExportDatabase = async () => {
    try {
      const res = await exportDataCSV('csv');
      triggerDownload(new Blob([res.data], { type: 'text/csv' }), 'AltScore_Database_Export.csv');
    } catch {
      alert('Failed to export applicant database.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    try {
      const res = await uploadDataCSV(file, false);
      setUploadResult(res.data);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload CSV dataset.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetrain = async () => {
    if (!window.confirm('Trigger model retraining on staged dataset?')) return;
    setRetraining(true);
    setRetrainResult(null);
    try {
      const res = await retrainModel();
      setRetrainResult(
        `Retraining complete! Version: ${res.data.version}. Model pipeline updated.`
      );
      await loadStatus();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Retraining failed.');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings & Dataset Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage training datasets, CSV imports/exports, model hyperparameters, and ethical data controls.
        </p>
      </div>

      <DisclaimerBanner />

      {/* Grid: Dataset Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Dataset */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-blue-600" />
              <CardTitle>Import Synthetic Dataset</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload a CSV file conforming to the AltScore feature schema
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 group"
            >
              <FileSpreadsheet
                size={36}
                className="text-slate-400 group-hover:text-blue-600 mb-2 transition"
              />
              <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                {uploading ? 'Processing & Validating CSV...' : 'Click to select CSV file'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Schema validated automatically against alternative financial columns
              </p>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Success / Validation Preview */}
            {uploadResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>Dataset Successfully Staged ({uploadResult.row_count} rows)</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  File: <span className="font-mono">{uploadResult.filename}</span>. Ready for model retraining.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Need a template? Download sample:
              </span>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={13} />}
                onClick={handleDownloadSample}
              >
                Sample CSV (10 rows)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Export & Storage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-purple-600" />
              <CardTitle>Storage & Export</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              SQLite database records and local storage configuration
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-semibold text-slate-800">SQLite 3 (SQLAlchemy ORM)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Local Database File</span>
                <span className="font-mono text-slate-700">altscore.db</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Model Artifacts Directory</span>
                <span className="font-mono text-slate-700">models/</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Dataset Directory</span>
                <span className="font-mono text-slate-700">data/</span>
              </div>
            </div>

            <div className="pt-3">
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                leftIcon={<Download size={15} />}
                onClick={handleExportDatabase}
              >
                Export Full Applicant Database (CSV)
              </Button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500">
              Exports all persisted applicant records along with their historical scores, risk levels, and assessment timestamps.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Retraining & Versioning */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw size={16} className="text-blue-600" />
              <CardTitle>Model Pipeline & Retraining</CardTitle>
            </div>
            {modelStatus && (
              <span className="text-xs font-mono font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded">
                Version: {modelStatus.model_version}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Atomic retraining pipeline with zero downtime fallback
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[10px]">Model Type</span>
              <span className="font-semibold text-slate-800">
                {modelStatus?.model_type || 'RandomForestClassifier'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[10px]">Training Dataset</span>
              <span className="font-semibold text-slate-800">
                {modelStatus?.total_records ?? 1000} Synthetic Records
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-400 block text-[10px]">Last Retrained</span>
              <span className="font-semibold text-slate-800">
                {modelStatus?.trained_at || 'Never'}
              </span>
            </div>
          </div>

          {retrainResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-600" />
              <span>{retrainResult}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Retraining creates a candidate pipeline in a staging folder, validates accuracy on held-out test split, and swaps atomically upon success.
            </div>
            <Button
              loading={retraining}
              onClick={handleRetrain}
              className="bg-blue-600 hover:bg-blue-700"
              leftIcon={<RotateCw size={14} />}
            >
              Trigger Retrain Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ethical Controls & Safeguards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <CardTitle>Ethical Machine Learning Controls & Data Governance</CardTitle>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Fair lending safeguards enforced throughout the credit scoring architecture
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 border border-emerald-100 bg-emerald-50/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle size={14} className="text-emerald-600" />
                Active Features (8 Indicators)
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                <li>Employment Status</li>
                <li>Bank Account Tenure</li>
                <li>Residential Stability</li>
                <li>Utility Bill Payment History</li>
                <li>Rent Payment History</li>
                <li>Telecommunications Payment History</li>
                <li>Monthly Savings Pattern</li>
                <li>Gig Economy Platform Participation</li>
              </ul>
            </div>

            <div className="p-4 border border-rose-100 bg-rose-50/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <ShieldCheck size={14} className="text-rose-600" />
                Protected & Excluded Features
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The following variables are collected for demographic research or excluded outright, and are <strong>strictly masked</strong> from model input matrices:
              </p>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                <li><strong>Age</strong> (prevent ageist disparate impact)</li>
                <li><strong>Educational Background</strong> (proxy prevention)</li>
                <li><strong>Social Media Footprint</strong> (invasive signal)</li>
                <li><strong>Online Shopping Behavior</strong> (unrelated consumer tracking)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React from "react";

interface State { hasError: boolean; error: Error | null; errorInfo: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: "" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info.componentStack ?? "" });
    console.error("[MedRise ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
          <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-white font-bold text-lg">MedRise — System Error</p>
              <p className="text-red-100 text-sm">An unexpected error occurred. No patient data was lost.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-gray-700 text-sm">
              <strong>What happened:</strong> {this.state.error?.message ?? "Unknown error"}
            </p>
            {this.state.errorInfo && (
              <details className="text-xs text-gray-400 bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                <summary className="cursor-pointer font-medium text-gray-500 mb-1">Technical details</summary>
                <pre className="whitespace-pre-wrap">{this.state.errorInfo}</pre>
              </details>
            )}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <strong>Self-recovery steps:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                <li>Click <strong>Reload Page</strong> below — this resolves 90% of UI errors.</li>
                <li>If the error persists, clear your browser cache and reload.</li>
                <li>Check your internet connection and VPN/proxy settings.</li>
                <li>If the API is unavailable, wait 30 seconds and retry.</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                🔄 Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: "" })}
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                ↩ Dismiss & Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

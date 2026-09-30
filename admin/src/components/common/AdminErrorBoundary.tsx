import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ADMIN ERROR BOUNDARY] Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-[#FCA5A5] rounded-[8px] p-6 max-w-2xl mx-auto my-8 text-left shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-[8px] border border-red-100 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-serif font-bold text-[#0F3D3C]">
                {this.props.fallbackTitle || "An unexpected error occurred in this admin module"}
              </h3>
              <p className="text-xs text-[#4A7C79] leading-relaxed">
                The console caught a runtime exception in this view. Other tabs remain active, and no database records or pending mutations were lost.
              </p>
              {this.state.error?.message && (
                <div className="bg-red-50/60 border border-red-100 p-2.5 rounded-[4px] font-mono text-[11px] text-red-700 break-words">
                  {this.state.error.message}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#278C7B] hover:bg-[#1F7062] text-white text-xs font-semibold rounded-[4px] transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry Section
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#E8F4F1] hover:bg-[#d5ece7] text-[#0F3D3C] text-xs font-semibold rounded-[4px] border border-[#CCE5E1] transition cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5 text-[#278C7B]" />
                  Reload Console
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
    this.handleReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="glass-strong mx-auto max-w-md rounded-2xl p-8 text-center shadow-lift">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20">
              <AlertTriangle size={28} className="text-rose-300" strokeWidth={1.5} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-ink-100">Something went wrong</h2>
            <p className="mb-6 text-sm text-ink-400">
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-600"
              >
                <RefreshCw size={16} strokeWidth={2} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-700 px-5 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:bg-ink-800"
              >
                <Home size={16} strokeWidth={2} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

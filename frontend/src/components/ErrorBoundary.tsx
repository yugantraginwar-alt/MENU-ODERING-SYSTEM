'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering crash:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col justify-center items-center p-6">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto animate-bounce">
              <AlertOctagon className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-display font-black text-lg text-white uppercase tracking-wide">
                Something Went Wrong
              </h2>
              <p className="text-xxs text-neutral-400 font-light leading-relaxed">
                An unexpected runtime crash occurred. The system has sandboxed the error to safeguard your active session.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl text-left">
                <span className="text-[9px] font-bold text-red-400 block font-mono uppercase tracking-wider mb-1">Error Trace</span>
                <span className="font-mono text-[10px] text-neutral-400 break-all leading-normal block">
                  {this.state.error.message || 'Unknown Exception'}
                </span>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

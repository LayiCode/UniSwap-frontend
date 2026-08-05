"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render-time errors anywhere below it so a single crashing component
// (bad data from the API, a thrown layout, etc.) can't blank out the whole app.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-500">
            An unexpected error happened while rendering this page.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

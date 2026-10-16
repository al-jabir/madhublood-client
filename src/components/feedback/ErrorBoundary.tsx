import React, { Component } from "react";

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="page">
        <h1>Something went wrong</h1>
        <button onClick={() => location.reload()}>Reload page</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

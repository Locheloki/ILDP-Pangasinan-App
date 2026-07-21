import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "40px",
          margin: "20px",
          backgroundColor: "#fff0f0",
          border: "2px solid #ff4444",
          borderRadius: "12px",
          fontFamily: "monospace",
          color: "#cc0000"
        }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "18px" }}>Runtime Error</h2>
          <pre style={{
            whiteSpace: "pre-wrap",
            fontSize: "13px",
            lineHeight: "1.6",
            margin: 0,
            color: "#333"
          }}>{this.state.error.stack || this.state.error.message}</pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: "16px",
              padding: "8px 24px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

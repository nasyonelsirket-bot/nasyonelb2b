import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 text-center">
          <h2 className="text-lg font-bold text-red-700">Bir hata oluştu</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md">{this.state.error.message}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              Tekrar dene
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-brand-300 px-4 py-2 text-sm text-brand-800 hover:bg-brand-50"
            >
              Sayfayı yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


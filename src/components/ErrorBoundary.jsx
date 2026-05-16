import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 text-center">
          <h2 className="text-lg font-bold text-red-700">Bir hata oluştu</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
          >
            Sayfayı yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

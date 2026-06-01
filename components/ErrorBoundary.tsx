'use client';
import { Component, createElement } from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return createElement('div', {
        style: {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#ededed',
          padding: '24px',
          textAlign: 'center' as const,
          direction: 'rtl',
        }
      },
        createElement('h1', {
          style: { fontSize: '24px', marginBottom: '12px', fontFamily: 'system-ui, sans-serif' }
        }, 'عذراً، حدث خطأ غير متوقع'),
        createElement('p', {
          style: { fontSize: '14px', color: '#999', marginBottom: '24px', fontFamily: 'system-ui, sans-serif' }
        }, 'يرجى إعادة تحميل الصفحة'),
        createElement('button', {
          onClick: () => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          },
          style: {
            padding: '12px 32px',
            borderRadius: '12px',
            border: 'none',
            background: '#c5a059',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }
        }, 'إعادة تحميل'),
        createElement('details', {
          style: { marginTop: '24px', maxWidth: '400px', fontSize: '11px', color: '#666', fontFamily: 'monospace' }
        },
          createElement('summary', { style: { cursor: 'pointer' } }, 'تفاصيل الخطأ'),
          createElement('pre', { style: { marginTop: '8px', whiteSpace: 'pre-wrap', textAlign: 'left' as const, direction: 'ltr' as const } }, this.state.error?.message || '')
        )
      );
    }
    return this.props.children;
  }
}

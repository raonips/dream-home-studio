import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">
            {this.props.fallbackTitle || 'Algo deu errado'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a seção.
          </p>
          <Button variant="outline" onClick={this.handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

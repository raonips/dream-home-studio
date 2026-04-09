import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; blockTitle?: string; }
interface State { hasError: boolean; error: Error | null; }

class BlockItemErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BlockItemErrorBoundary]', this.props.blockTitle, error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/30 bg-destructive/5 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Erro ao renderizar bloco{this.props.blockTitle ? `: ${this.props.blockTitle}` : ''}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export default BlockItemErrorBoundary;

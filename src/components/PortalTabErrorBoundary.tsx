/**
 * Sprint D — Per-tab error boundary for ClientPortal tabs.
 * Prevents one tab failure from crashing the entire portal shell.
 */
import { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  tabName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PortalTabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error(`[PortalTab:${this.props.tabName}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="rounded-[24px] border-destructive/30">
          <CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <h3 className="font-bold">Couldn't load {this.props.tabName}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {this.state.error?.message || "Something went wrong loading this section."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

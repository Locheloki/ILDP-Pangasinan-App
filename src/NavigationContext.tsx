import React, { createContext, useContext, useState, useCallback } from "react";

type TabName = "home" | "add" | "view" | "rapid" | "import" | "seminars";

interface NavigationReturnContext {
  returnTab: TabName;
  returnParams?: {
    shouldRematch?: boolean;
    employeeName?: string;
    [key: string]: any;
  };
}

interface NavigationContextValue {
  returnContext: NavigationReturnContext | null;
  setReturnContext: (ctx: NavigationReturnContext | null) => void;
  consumeReturnContext: () => NavigationReturnContext | null;
}

const NavigationContext = createContext<NavigationContextValue>({
  returnContext: null,
  setReturnContext: () => {},
  consumeReturnContext: () => null,
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [returnContext, setReturnContext] = useState<NavigationReturnContext | null>(null);

  const consumeReturnContext = useCallback(() => {
    const ctx = returnContext;
    if (ctx) {
      // Don't clear here - let the caller clear after processing
      // This avoids stale state issues
    }
    return ctx;
  }, [returnContext]);

  return (
    <NavigationContext.Provider value={{ returnContext, setReturnContext, consumeReturnContext }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}

/**
 * Convenience hook for navigating back to the originating page after completing a task.
 *
 * Usage:
 *   const { navigateBack } = useNavigateBack();
 *   // After saving employee:
 *   navigateBack({ shouldRematch: true, employeeName: "Juan Dela Cruz" });
 */
export function useNavigateBack() {
  const { returnContext, setReturnContext } = useNavigation();

  const navigateBack = useCallback(
    (params?: NavigationReturnContext["returnParams"]) => {
      if (returnContext) {
        setReturnContext({
          ...returnContext,
          returnParams: { ...returnContext.returnParams, ...params },
        });
      }
    },
    [returnContext, setReturnContext]
  );

  const canGoBack = !!returnContext;

  return { navigateBack, canGoBack, returnContext };
}

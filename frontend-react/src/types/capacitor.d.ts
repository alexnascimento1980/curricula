export {};

interface PluginListenerHandle {
  remove: () => Promise<void>;
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      Plugins: {
        Browser: {
          open: (opts: { url: string }) => Promise<void>;
          close: () => Promise<void>;
        };
        App: {
          addListener(
            event: "appUrlOpen",
            callback: (data: { url: string }) => void,
          ): Promise<PluginListenerHandle>;
          addListener(
            event: "backButton",
            callback: (data: { canGoBack: boolean }) => void,
          ): Promise<PluginListenerHandle>;
          exitApp: () => void;
        };
        Filesystem: {
          writeFile: (opts: {
            path: string;
            data: string;
            directory: string;
          }) => Promise<{ uri: string }>;
        };
        Share: {
          share: (opts: {
            title: string;
            url: string;
            dialogTitle: string;
          }) => Promise<void>;
        };
      };
    };
  }
}



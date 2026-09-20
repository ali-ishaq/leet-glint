/// <reference types="vite/client" />

declare const chrome: {
  storage?: {
    local?: {
      get: (
        keys: string[] | Record<string, unknown>,
        callback?: (items: Record<string, unknown>) => void,
      ) => void;
      set: (items: Record<string, unknown>, callback?: () => void) => void;
    };
  };
  runtime?: {
    getURL: (path: string) => string;
    onMessage?: {
      addListener: (
        listener: (
          message: any,
          sender: any,
          sendResponse: (response?: any) => void,
        ) => boolean | void,
      ) => void;
    };
    sendMessage?: (message: any, callback?: (response?: any) => void) => void;
  };
  tabs?: {
    create: (details: { url: string }) => void;
  };
};

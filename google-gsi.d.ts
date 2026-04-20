export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (credential: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: string | number;
              text?: string;
              type?: string;
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

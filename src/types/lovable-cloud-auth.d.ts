declare module "@lovable.dev/cloud-auth-js" {
  interface LovableAuth {
    signInWithOAuth: (
      provider: "google" | "apple" | "microsoft",
      opts?: {
        redirect_uri?: string;
        extraParams?: Record<string, string>;
      },
    ) => Promise<any>;
  }
}

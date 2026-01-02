/// <reference types="node" />

declare global {
  interface ImportMeta {
    readonly url: string;
  }

  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      DATABASE_PATH?: string;
      EMAIL_HOST?: string;
      EMAIL_PORT?: string;
      EMAIL_USER?: string;
      EMAIL_PASS?: string;
      EMAIL_FROM?: string;
    }
  }
}

export {};

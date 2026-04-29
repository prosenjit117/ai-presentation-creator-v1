/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_AI_AGENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

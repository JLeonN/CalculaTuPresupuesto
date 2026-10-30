/**
 * Add types (that are not auto-magically added by Quasar CLI already)
 * for your custom variables to avoid TypeScript errors, like dynamic
 * process.env variables or definitions in dotenv files configured ONLY
 * for the /quasar.config file itself.
 *
 * https://quasar.dev/quasar-cli-vite/handling-import-meta-env#type-inference
 *
 * @example
 * interface ImportMetaEnv {
 *   readonly MY_VAR: string;
 *   readonly MY_OTHER_VAR: string;
 * }
 */
interface ImportMetaEnv {
  readonly QCLI_FIREBASE_API_KEY?: string;
  readonly QCLI_FIREBASE_AUTH_DOMAIN?: string;
  readonly QCLI_FIREBASE_PROJECT_ID?: string;
  readonly QCLI_FIREBASE_APP_ID?: string;
  readonly QCLI_FIREBASE_STORAGE_BUCKET?: string;
  readonly QCLI_FIREBASE_MESSAGING_SENDER_ID?: string;
}

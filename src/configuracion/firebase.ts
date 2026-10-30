import { Capacitor } from '@capacitor/core';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  type Firestore,
} from 'firebase/firestore';

const CONFIGURACION = {
  apiKey: String(import.meta.env?.QCLI_FIREBASE_API_KEY ?? ''),
  authDomain: String(import.meta.env?.QCLI_FIREBASE_AUTH_DOMAIN ?? ''),
  projectId: String(import.meta.env?.QCLI_FIREBASE_PROJECT_ID ?? ''),
  appId: String(import.meta.env?.QCLI_FIREBASE_APP_ID ?? ''),
  storageBucket: String(import.meta.env?.QCLI_FIREBASE_STORAGE_BUCKET ?? ''),
  messagingSenderId: String(import.meta.env?.QCLI_FIREBASE_MESSAGING_SENDER_ID ?? ''),
};

let aplicacion: FirebaseApp | null = null;
let autenticacion: Auth | null = null;
let baseDatos: Firestore | null = null;

export function estaFirebaseConfigurado(): boolean {
  return Boolean(
    CONFIGURACION.apiKey &&
    CONFIGURACION.authDomain &&
    CONFIGURACION.projectId &&
    CONFIGURACION.appId,
  );
}

export function obtenerFirebase(): {
  aplicacion: FirebaseApp;
  autenticacion: Auth;
  baseDatos: Firestore;
} {
  if (!estaFirebaseConfigurado()) {
    throw new Error('Firebase no está configurado para este entorno.');
  }

  aplicacion ??=
    getApps().find((actual) => actual.name === '[DEFAULT]') ?? initializeApp(CONFIGURACION);
  autenticacion ??= getAuth(aplicacion);
  baseDatos ??= initializeFirestore(aplicacion, {
    localCache: Capacitor.isNativePlatform() ? persistentLocalCache() : memoryLocalCache(),
  });

  return { aplicacion, autenticacion, baseDatos };
}

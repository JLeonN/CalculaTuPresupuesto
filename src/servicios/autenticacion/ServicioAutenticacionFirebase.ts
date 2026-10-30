import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { obtenerFirebase } from '@/configuracion/firebase';
import type { CredencialesAcceso, UsuarioAutenticado } from '@/dominio/autenticacion';
import type { ServicioAutenticacion } from './ServicioAutenticacion';

const PROVEEDOR_GOOGLE = new GoogleAuthProvider();

function convertirUsuario(usuario: User | null): UsuarioAutenticado | null {
  if (!usuario || !usuario.emailVerified) return null;
  return {
    id: usuario.uid,
    nombre: usuario.displayName?.trim() || usuario.email || 'Usuario',
    correo: usuario.email,
    correoVerificado: usuario.emailVerified,
    proveedores: usuario.providerData.map((proveedor) => proveedor.providerId),
    proveedor: 'firebase',
  };
}

export function obtenerMensajeErrorAcceso(error: unknown): string {
  if (error instanceof FirebaseError) {
    const mensajes: Record<string, string> = {
      'auth/email-already-in-use':
        'Ese correo ya tiene una cuenta. Iniciá sesión y vinculá Google desde el menú de usuario.',
      'auth/account-exists-with-different-credential':
        'Ese correo ya tiene una cuenta. Entrá con el método existente y vinculá Google desde el menú.',
      'auth/invalid-email': 'Ingresá un correo electrónico válido.',
      'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
      'auth/wrong-password': 'El correo o la contraseña no son correctos.',
      'auth/weak-password': 'La contraseña debe tener al menos seis caracteres.',
      'auth/network-request-failed': 'No hay conexión. Revisá Internet e intentá nuevamente.',
      'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el acceso.',
      'auth/popup-blocked':
        'El navegador bloqueó la ventana de Google. Permití ventanas emergentes para esta página.',
      'auth/credential-already-in-use': 'Esta cuenta de Google ya está vinculada a otro usuario.',
      'auth/provider-already-linked': 'Google ya está vinculado a esta cuenta.',
    };
    return mensajes[error.code] ?? 'No se pudo completar el acceso. Intentá nuevamente.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar el acceso.';
}

export class ServicioAutenticacionFirebase implements ServicioAutenticacion {
  private readonly autenticacion: Auth = obtenerFirebase().autenticacion;

  async obtenerUsuarioActual(): Promise<UsuarioAutenticado | null> {
    await this.autenticacion.authStateReady();
    return convertirUsuario(this.autenticacion.currentUser);
  }

  observarCambios(escuchar: (usuario: UsuarioAutenticado | null) => void): () => void {
    return onAuthStateChanged(this.autenticacion, (usuario) => escuchar(convertirUsuario(usuario)));
  }

  async iniciarSesion({ usuario, contrasena }: CredencialesAcceso): Promise<UsuarioAutenticado> {
    const resultado = await signInWithEmailAndPassword(
      this.autenticacion,
      usuario.trim(),
      contrasena,
    );
    await reload(resultado.user);
    if (!resultado.user.emailVerified) {
      await signOut(this.autenticacion);
      throw new Error(
        'Verificá tu correo antes de entrar. Revisá la bandeja de entrada o reenviá el mensaje.',
      );
    }
    await resultado.user.getIdToken(true);
    return convertirUsuario(resultado.user)!;
  }

  async registrarConCorreo(correo: string, contrasena: string, nombre: string): Promise<void> {
    const resultado = await createUserWithEmailAndPassword(
      this.autenticacion,
      correo.trim(),
      contrasena,
    );
    try {
      await updateProfile(resultado.user, { displayName: nombre.trim() });
      await sendEmailVerification(resultado.user);
    } finally {
      await signOut(this.autenticacion);
    }
  }

  async iniciarSesionConGoogle(): Promise<UsuarioAutenticado> {
    const resultado = Capacitor.isNativePlatform()
      ? await signInWithCredential(this.autenticacion, await this.obtenerCredencialGoogleNativa())
      : await signInWithPopup(this.autenticacion, PROVEEDOR_GOOGLE);
    return convertirUsuario(resultado.user)!;
  }

  async vincularGoogle(): Promise<UsuarioAutenticado> {
    const usuario = this.autenticacion.currentUser;
    if (!usuario || !usuario.emailVerified)
      throw new Error('Iniciá sesión antes de vincular Google.');
    const resultado = Capacitor.isNativePlatform()
      ? await linkWithCredential(usuario, await this.obtenerCredencialGoogleNativa())
      : await linkWithPopup(usuario, PROVEEDOR_GOOGLE);
    return convertirUsuario(resultado.user)!;
  }

  async enviarRecuperacionContrasena(correo: string): Promise<void> {
    await sendPasswordResetEmail(this.autenticacion, correo.trim());
  }

  async reenviarVerificacion(correo: string, contrasena: string): Promise<void> {
    const resultado = await signInWithEmailAndPassword(
      this.autenticacion,
      correo.trim(),
      contrasena,
    );
    try {
      if (resultado.user.emailVerified)
        throw new Error('Ese correo ya está verificado. Podés iniciar sesión.');
      await sendEmailVerification(resultado.user);
    } finally {
      await signOut(this.autenticacion);
    }
  }

  async cerrarSesion(): Promise<void> {
    await signOut(this.autenticacion);
    if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut();
  }

  private async obtenerCredencialGoogleNativa() {
    const resultado = await FirebaseAuthentication.signInWithGoogle();
    const token = resultado.credential?.idToken;
    if (!token)
      throw new Error('Google no entregó una credencial válida. Revisá la configuración Android.');
    return GoogleAuthProvider.credential(token, resultado.credential?.accessToken);
  }
}

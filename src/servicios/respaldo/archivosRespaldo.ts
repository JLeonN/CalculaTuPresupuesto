import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { RespaldoDatos } from '@/dominio/respaldo';

export function crearNombreArchivoRespaldo(fecha = new Date()): string {
  const sello = [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-');
  const hora = [
    String(fecha.getHours()).padStart(2, '0'),
    String(fecha.getMinutes()).padStart(2, '0'),
    String(fecha.getSeconds()).padStart(2, '0'),
  ].join('-');
  return `Respaldo CalculaTuPresupuesto ${sello} ${hora}.json`;
}

export async function descargarArchivoRespaldo(
  respaldo: RespaldoDatos,
): Promise<'navegador' | 'compartido'> {
  const nombre = crearNombreArchivoRespaldo();
  const contenido = JSON.stringify(respaldo, null, 2);

  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(
      new Blob([contenido], { type: 'application/json;charset=utf-8' }),
    );
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'navegador';
  }

  const archivo = await Filesystem.writeFile({
    path: nombre,
    data: contenido,
    encoding: Encoding.UTF8,
    directory: Directory.Cache,
  });
  await Share.share({
    title: nombre,
    text: 'Guardá esta copia fuera de la aplicación para poder recuperarla.',
    files: [archivo.uri],
    dialogTitle: 'Guardar copia de seguridad',
  });
  return 'compartido';
}

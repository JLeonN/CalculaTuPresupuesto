package com.calculatupresupuesto.app;

import android.app.Instrumentation;
import android.content.Context;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

/** Comprobación incluida únicamente en la APK de depuración. */
public class RelojConfiableInstrumentacion extends Instrumentation {
    private static class LlamadaPrueba extends PluginCall {
        JSObject resultado;
        String error;

        LlamadaPrueba() {
            super(null, "RelojConfiable", "prueba", "obtenerReferencia", new JSObject());
        }

        @Override
        public void resolve(JSObject datos) {
            resultado = datos;
        }

        @Override
        public void reject(String mensaje) {
            error = mensaje;
        }

        @Override
        public void reject(String mensaje, Exception causa) {
            error = mensaje;
        }
    }

    @Override
    public void onCreate(Bundle argumentos) {
        super.onCreate(argumentos);
        start();
    }

    @Override
    public void onStart() {
        Bundle informe = new Bundle();
        try {
            Context contexto = getTargetContext();
            RelojConfiablePlugin plugin = new RelojConfiablePlugin() {
                @Override
                public Context getContext() {
                    return contexto;
                }
            };
            int arranques = Settings.Global.getInt(contexto.getContentResolver(), Settings.Global.BOOT_COUNT);
            long antes = SystemClock.elapsedRealtime();
            LlamadaPrueba primera = new LlamadaPrueba();
            LlamadaPrueba segunda = new LlamadaPrueba();
            plugin.obtenerReferencia(primera);
            plugin.obtenerReferencia(segunda);
            long despues = SystemClock.elapsedRealtime();
            if (primera.error != null || segunda.error != null || primera.resultado == null || segunda.resultado == null) {
                throw new IllegalStateException("El plugin no devolvió ambas referencias.");
            }
            long tiempoPrimero = primera.resultado.getLong("milisegundosTranscurridos");
            long tiempoSegundo = segunda.resultado.getLong("milisegundosTranscurridos");
            if (primera.resultado.getInt("arranques") != arranques ||
                segunda.resultado.getInt("arranques") != arranques ||
                tiempoPrimero < antes || tiempoSegundo < tiempoPrimero || tiempoSegundo > despues) {
                throw new IllegalStateException("Las referencias del reloj no coinciden con Android.");
            }
            informe.putString("resultado", "reloj y contador de arranques correctos");
            finish(0, informe);
        } catch (Exception error) {
            informe.putString("error", error.getClass().getSimpleName() + ": " + error.getMessage());
            finish(1, informe);
        }
    }

}

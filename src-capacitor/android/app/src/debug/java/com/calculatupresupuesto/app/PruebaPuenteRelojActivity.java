package com.calculatupresupuesto.app;

import android.os.Bundle;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import android.webkit.WebView;
import org.json.JSONObject;
import org.json.JSONTokener;

/** Comprueba el puente de Capacitor solo en la APK de depuración. */
public class PruebaPuenteRelojActivity extends MainActivity {
    private static final String ETIQUETA = "CH_PUENTE_RELOJ";
    private static final long LIMITE_MS = 20000;
    private long inicio;
    private boolean iniciada;
    private boolean terminada;

    @Override
    public void onCreate(Bundle estado) {
        super.onCreate(estado);
        inicio = SystemClock.elapsedRealtime();
        getBridge().getWebView().postDelayed(() -> {
            if (!terminada) terminar(false, "El puente no respondió a tiempo");
        }, LIMITE_MS);
        comprobar();
    }

    private void comprobar() {
        WebView web = getBridge().getWebView();
        if (terminada) return;
        if (SystemClock.elapsedRealtime() - inicio >= LIMITE_MS) {
            terminar(false, "El puente no respondió a tiempo");
            return;
        }
        String codigo = iniciada
            ? "window.__chPruebaReloj || null"
            : "(function(){if(!window.Capacitor || !window.Capacitor.Plugins || " +
              "!window.Capacitor.Plugins.RelojConfiable)return false;" +
              "window.__chPruebaReloj=null;window.Capacitor.Plugins.RelojConfiable.obtenerReferencia()" +
              ".then(x=>window.__chPruebaReloj=JSON.stringify(x))" +
              ".catch(()=>window.__chPruebaReloj='error');return true})()";
        web.evaluateJavascript(codigo, valor -> {
            if (terminada) return;
            if (!iniciada) {
                iniciada = "true".equals(valor);
            } else if (valor != null && !"null".equals(valor)) {
                try {
                    Object texto = new JSONTokener(valor).nextValue();
                    if (!(texto instanceof String) || "error".equals(texto)) {
                        throw new IllegalStateException("La llamada JavaScript fue rechazada");
                    }
                    JSONObject referencia = new JSONObject((String) texto);
                    int arranques = Settings.Global.getInt(getContentResolver(), Settings.Global.BOOT_COUNT);
                    long tiempo = referencia.getLong("milisegundosTranscurridos");
                    if (referencia.getInt("arranques") != arranques || tiempo < inicio ||
                        tiempo > SystemClock.elapsedRealtime()) {
                        throw new IllegalStateException("La referencia del puente es incoherente");
                    }
                    terminar(true, "JavaScript recibió una referencia coherente de Android");
                    return;
                } catch (Exception error) {
                    terminar(false, error.getClass().getSimpleName() + ": " + error.getMessage());
                    return;
                }
            }
            web.postDelayed(this::comprobar, 200);
        });
    }

    private void terminar(boolean correcto, String mensaje) {
        terminada = true;
        Log.i(ETIQUETA, (correcto ? "OK: " : "ERROR: ") + mensaje);
        finish();
    }
}

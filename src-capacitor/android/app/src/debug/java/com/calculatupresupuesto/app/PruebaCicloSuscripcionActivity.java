package com.calculatupresupuesto.app;

import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.webkit.WebView;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.json.JSONTokener;

/** Ejecuta el store real con servidor ficticio y almacenamiento de prueba aislado. */
public class PruebaCicloSuscripcionActivity extends MainActivity {
    private static final String ETIQUETA = "CH_CICLO_SUSCRIPCION";
    private long inicio;
    private String modulo;
    private String accion;
    private boolean iniciada;
    private boolean terminada;

    @Override public void onCreate(Bundle estado) {
        super.onCreate(estado);
        inicio = SystemClock.elapsedRealtime();
        accion = getIntent().getStringExtra("accion");
        if (!"iniciar".equals(accion) && !"sin-conexion".equals(accion) &&
            !"reinicio".equals(accion) && !"reconectar".equals(accion) &&
            !"iniciar-margen".equals(accion) && !"iniciar-vencido".equals(accion) &&
            !"sin-conexion-vencido".equals(accion)) {
            terminar(false, "Acción inválida");
            return;
        }
        try (BufferedReader lector = new BufferedReader(new InputStreamReader(
            getAssets().open("ciclo-suscripcion.debug.js"), StandardCharsets.UTF_8))) {
            StringBuilder contenido = new StringBuilder();
            String linea;
            while ((linea = lector.readLine()) != null) contenido.append(linea).append('\n');
            modulo = contenido.toString();
        } catch (Exception error) {
            terminar(false, "Falta preparar el módulo de prueba");
            return;
        }
        comprobar();
    }

    private void comprobar() {
        if (terminada) return;
        if (SystemClock.elapsedRealtime() - inicio > 30000) {
            terminar(false, "El puente no respondió a tiempo");
            return;
        }
        WebView web = getBridge().getWebView();
        String codigo = iniciada ? "window.__chCiclo || null" :
            "(function(){if(!window.Capacitor || !window.Capacitor.Plugins || " +
            "!window.Capacitor.Plugins.RelojConfiable || !window.Capacitor.Plugins.Preferences)return false;" +
            modulo + "\nwindow.__chCiclo=null;window.chEjecutarCiclo(" + JSONObject.quote(accion) + ")" +
            ".then(x=>window.__chCiclo=x).catch(()=>window.__chCiclo='error');return true})()";
        web.evaluateJavascript(codigo, valor -> {
            if (terminada) return;
            if (!iniciada) iniciada = "true".equals(valor);
            else if (valor != null && !"null".equals(valor)) {
                try {
                    Object texto = new JSONTokener(valor).nextValue();
                    JSONObject resultado = new JSONObject((String) texto);
                    terminar(resultado.getBoolean("correcto"), resultado.toString());
                    return;
                } catch (Exception error) {
                    terminar(false, "Resultado inválido: " + error.getClass().getSimpleName());
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

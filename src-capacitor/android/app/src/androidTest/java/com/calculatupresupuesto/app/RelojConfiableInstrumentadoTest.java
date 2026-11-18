package com.calculatupresupuesto.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.os.SystemClock;
import android.provider.Settings;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class RelojConfiableInstrumentadoTest {
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

    @Test
    public void entregaRelojMonotonoYContadorDeArranques() throws Exception {
        Context contexto = InstrumentationRegistry.getInstrumentation().getTargetContext();
        RelojConfiablePlugin reloj = new RelojConfiablePlugin() {
            @Override
            public Context getContext() {
                return contexto;
            }
        };
        int arranquesEsperados = Settings.Global.getInt(
            contexto.getContentResolver(), Settings.Global.BOOT_COUNT
        );
        long antes = SystemClock.elapsedRealtime();
        LlamadaPrueba primera = new LlamadaPrueba();
        reloj.obtenerReferencia(primera);
        LlamadaPrueba segunda = new LlamadaPrueba();
        reloj.obtenerReferencia(segunda);
        long despues = SystemClock.elapsedRealtime();

        assertNull(primera.error);
        assertNull(segunda.error);
        assertNotNull(primera.resultado);
        assertNotNull(segunda.resultado);
        assertEquals(arranquesEsperados, primera.resultado.getInt("arranques"));
        assertEquals(arranquesEsperados, segunda.resultado.getInt("arranques"));
        long tiempoPrimero = primera.resultado.getLong("milisegundosTranscurridos");
        long tiempoSegundo = segunda.resultado.getLong("milisegundosTranscurridos");
        assertTrue(tiempoPrimero >= antes);
        assertTrue(tiempoSegundo >= tiempoPrimero);
        assertTrue(tiempoSegundo <= despues);
    }
}

package com.calculatupresupuesto.app;

import android.os.SystemClock;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RelojConfiable")
public class RelojConfiablePlugin extends Plugin {
    @PluginMethod
    public void obtenerReferencia(PluginCall llamada) {
        try {
            int arranques = Settings.Global.getInt(
                getContext().getContentResolver(), Settings.Global.BOOT_COUNT
            );
            if (arranques < 0) {
                llamada.reject("No se pudo verificar el contador de arranques.");
                return;
            }
            JSObject resultado = new JSObject();
            resultado.put("milisegundosTranscurridos", SystemClock.elapsedRealtime());
            resultado.put("arranques", arranques);
            llamada.resolve(resultado);
        } catch (Settings.SettingNotFoundException | SecurityException error) {
            llamada.reject("No se pudo verificar el contador de arranques.", error);
        }
    }
}

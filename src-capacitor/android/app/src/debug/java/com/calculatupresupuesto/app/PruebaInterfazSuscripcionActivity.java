package com.calculatupresupuesto.app;

import android.os.Bundle;

/** Interfaz aislada con datos y servicios ficticios; solo existe en depuración. */
public class PruebaInterfazSuscripcionActivity extends MainActivity {
    @Override public void onCreate(Bundle estado) {
        super.onCreate(estado);
        getBridge().getWebView().loadUrl("https://localhost/ch-interfaz/aplicacion-suscripcion.html");
    }
}

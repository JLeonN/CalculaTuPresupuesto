import { computed, ref, watch, type ComputedRef, type WatchSource } from 'vue';

const REGISTROS_POR_PAGINA = 20;

export function usePaginacionListado<T>(
  registros: ComputedRef<T[]>,
  criteriosReinicio: WatchSource[],
) {
  const paginaActual = ref(1);
  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(registros.value.length / REGISTROS_POR_PAGINA)),
  );
  const registrosPagina = computed(() => {
    const inicio = (paginaActual.value - 1) * REGISTROS_POR_PAGINA;
    return registros.value.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  });

  watch(criteriosReinicio, () => {
    paginaActual.value = 1;
  });

  watch(totalPaginas, (total) => {
    if (paginaActual.value > total) paginaActual.value = total;
  });

  return { paginaActual, totalPaginas, registrosPagina };
}

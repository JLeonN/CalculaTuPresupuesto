import { defineBoot } from '#q-app';
import { useAutenticacionStore } from '@/stores/autenticacion';

export default defineBoot(async ({ store }) => {
  const autenticacionStore = useAutenticacionStore(store);
  await autenticacionStore.inicializarSesion();
});

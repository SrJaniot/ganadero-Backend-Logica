import {UserProfile} from '@loopback/security';

// FUNCIONES DE APOYO PARA LEER EL USUARIO QUE HACE LA PETICION
// EL PERFIL LO ARMA AuthStrategy CON LO QUE DEVUELVE ms-seguridad (/validar-permisos: {permitido, id_usuario, rol, nombre})
// NUNCA SE CONFIA EN UN ID QUE VENGA EN EL BODY
// EL id_usuario DE SEGURIDAD ES UN UUID EN TEXTO (TAB_FINCAS_PERSONAS.ID_USUARIO)

//RETORNA EL id_usuario DEL USUARIO AUTENTICADO ('' SI EL TOKEN NO TRAE UNO)
export function obtenerIdUsuario(perfil: UserProfile): string {
  return String(perfil?.id_usuario ?? '').trim();
}

//RETORNA EL NOMBRE DEL USUARIO AUTENTICADO ('' SI NO VIENE)
export function obtenerNombre(perfil: UserProfile): string {
  return String(perfil?.nombre ?? '').trim().replace(/\s+/g, ' ');
}

//RETORNA EL ROL DE SEGURIDAD DEL USUARIO AUTENTICADO (1 ADMINISTRADOR, 2 DUEÑO, 3 VAQUERO, 4 VETERINARIO; 0 SI NO VIENE)
export function obtenerRol(perfil: UserProfile): number {
  const rol = Number(perfil?.rol);
  return Number.isInteger(rol) ? rol : 0;
}

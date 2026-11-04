export namespace SQLConfig {
  //funciones generales (acceso a la finca)
  export const ValidarAccesoDuenio = "SELECT FUN_VALIDAR_ACCESO_FINCA($1,$2,ARRAY['DUENIO']::VARCHAR[]) as resultado";

  //funciones de fincas y personas de la finca (fincas.controller.ts)
  export const CrearFinca = 'SELECT FUN_CREAR_FINCA_JSON($1,$2,$3,$4,$5,$6,$7) as resultado';
  export const ActualizarFinca = 'SELECT FUN_ACTUALIZAR_FINCA_JSON($1,$2,$3,$4,$5,$6,$7) as resultado';
  export const ObtenerMisFincas = 'SELECT FUN_OBTENER_MIS_FINCAS_JSON($1) as resultado';
  export const ObtenerFincaID = 'SELECT FUN_OBTENER_FINCA_POR_ID_JSON($1,$2) as resultado';
  export const ObtenerPersonasFinca = 'SELECT FUN_OBTENER_PERSONAS_FINCA_JSON($1,$2) as resultado';
  export const AgregarPersonaFinca = 'SELECT FUN_AGREGAR_PERSONA_FINCA_JSON($1,$2,$3,$4,$5) as resultado';
  export const ActualizarPersonaFinca = 'SELECT FUN_ACTUALIZAR_PERSONA_FINCA_JSON($1,$2,$3,$4) as resultado';

  //funciones de los catalogos (catalogos.controller.ts)
  export const ObtenerRazas = 'SELECT FUN_OBTENER_RAZAS_JSON() as resultado';
  export const CrearRaza = 'SELECT FUN_CREAR_RAZA_JSON($1,$2) as resultado';
  export const ObtenerVacunas = 'SELECT FUN_OBTENER_VACUNAS_JSON($1) as resultado';
  export const CrearVacuna = 'SELECT FUN_CREAR_VACUNA_JSON($1,$2,$3,$4,$5,$6) as resultado';
  export const ActualizarVacuna = 'SELECT FUN_ACTUALIZAR_VACUNA_JSON($1,$2,$3,$4,$5,$6,$7,$8) as resultado';
  export const ObtenerCiclosIca = 'SELECT FUN_OBTENER_CICLOS_ICA_JSON() as resultado';
  export const CrearCicloIca = 'SELECT FUN_CREAR_CICLO_ICA_JSON($1,$2,$3,$4,$5) as resultado';
  export const AnularCicloIca = 'SELECT FUN_ANULAR_CICLO_ICA_JSON($1,$2) as resultado';

  //funciones del hato (hato.controller.ts)
  export const ObtenerLotes = 'SELECT FUN_OBTENER_LOTES_JSON($1,$2) as resultado';
  export const ObtenerAnimales = 'SELECT FUN_OBTENER_ANIMALES_JSON($1,$2,$3) as resultado';
  export const ObtenerAnimalUUID = 'SELECT FUN_OBTENER_ANIMAL_POR_UUID_JSON($1,$2,$3) as resultado';
  export const ActualizarFotoAnimal = 'SELECT FUN_ACTUALIZAR_FOTO_ANIMAL_JSON($1,$2,$3,$4) as resultado';
  export const ObtenerLineaTiempo = 'SELECT FUN_OBTENER_LINEA_TIEMPO_JSON($1,$2,$3) as resultado';
  export const ObtenerHistorialRegistro = 'SELECT FUN_OBTENER_HISTORIAL_REGISTRO_JSON($1,$2,$3,$4) as resultado';

  //funciones de la auditoria (auditoria.controller.ts)
  export const ObtenerAuditoriaFinca = 'SELECT FUN_OBTENER_AUDITORIA_FINCA_JSON($1,$2,$3,$4) as resultado';

  //funciones de la sincronizacion (sincronizacion.controller.ts)
  export const SincronizarRegistros = 'SELECT FUN_SINCRONIZAR_REGISTROS_JSON($1,$2,$3) as resultado';
  export const ObtenerCambiosDesde = 'SELECT FUN_OBTENER_CAMBIOS_JSON($1,$2,$3) as resultado';
  export const ObtenerSincronizaciones = 'SELECT FUN_OBTENER_SINCRONIZACIONES_JSON($1,$2) as resultado';

  //funciones de las alertas (alertas.controller.ts). EL TERCER PARAMETRO ES LA FECHA (NULL = HOY)
  export const ObtenerAlertas = 'SELECT FUN_OBTENER_ALERTAS_JSON($1,$2,$3::DATE) as resultado';

  //funciones de los indicadores (indicadores.controller.ts). DESDE Y HASTA COMO FECHA (NULL = LOS ULTIMOS 12 MESES)
  export const ObtenerIndicadores = 'SELECT FUN_OBTENER_INDICADORES_JSON($1,$2,$3::DATE,$4::DATE) as resultado';
}

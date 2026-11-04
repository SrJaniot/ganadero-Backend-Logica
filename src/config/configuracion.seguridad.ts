export namespace ConfiguracionSeguridad{
  //-------------------------VARIABLES DE ENTORNO  -------------------------------------
    //instalar el paquete dotenv npm i dotenv para poder leer variables de entorno  y importar en application.ts require('dotenv').config();
    export const connection_user_postgres = process.env.CONNECTION_USER_POSTGRES ;
    export const connection_password_postgres = process.env.CONNECTION_PASSWORD_POSTGRES ;
    export const connection_database_postgres = process.env.CONNECTION_DATABASE_POSTGRES ;
    export const connection_port_postgres = process.env.CONNECTION_PORT_POSTGRES ;
    //
    //cambiar esta ruta por la url del server con el puerto a la api de seguridad
    export const hostSeguridad = process.env.CONECTION_SEGURIDAD ;
    //CLAVE COMPARTIDA CON ms-seguridad-ganadero PARA LAS LLAMADAS SIN USUARIO (BUSCAR, CREAR Y ACTIVAR CUENTAS)
    export const claveServicios = process.env.CLAVE_SERVICIOS ;



    //-------------------------menus -------------------------------------
    //DEBEN SER LOS MISMOS IDS DE ms-seguridad-ganadero
  export const MenuUsuarios = 1; //ADMINISTRADOR: USUARIOS, ROLES Y PERMISOS
  export const MenuMiFinca = 2; //DATOS DE LA FINCA, PERSONAS Y AUDITORIA
  export const MenuHato = 3; //FINCAS, LOTES, ANIMALES, FICHA Y LINEA DE TIEMPO
  export const MenuQuePasoHoy = 4; //REGISTRAR LO QUE PASO EN EL POTRERO
  export const MenuHoyAlertas = 5; //PANTALLA HOY Y ALERTAS (CICLOS DEL ICA)
  export const MenuIndicadores = 6; //INDICADORES DE LA FINCA
  export const MenuConfiguracion = 7; //CATALOGOS: RAZAS, VACUNAS Y CICLOS DEL ICA
  export const MenuSincronizacion = 8; //SUBIR Y BAJAR CAMBIOS DEL CELULAR
  export const MenuMiPerfil = 9; //MIS DATOS Y CAMBIAR LA CLAVE


  //-------------------------acciones -------------------------------------
  export const listarAccion = "listar";
  export const guardarAccion = "guardar";
  export const eliminarAccion = "eliminar";
  export const editarAccion = "editar";
  export const buscarAccion_id = "buscar_id";

  //-------------------------rol -------------------------------------
  export const rolAdministradorID = 1;
  export const rolDuenioID = 2;
  export const rolVaqueroID = 3;
  export const rolVeterinarioID = 4;

  //ROL DE LA FINCA (TAB_FINCAS_PERSONAS.ROL_FINCA) -> ROL DE SEGURIDAD (rolid) AL CREAR LA CUENTA
  export const rolSeguridadPorRolFinca: {[rolFinca: string]: number} = {
    DUENIO: rolDuenioID,
    VAQUERO: rolVaqueroID,
    VETERINARIO: rolVeterinarioID,
  };

  //-------------------------seguridad -------------------------------------
  //LONGITUD MINIMA DE LA CONTRASEÑA (LA MISMA DE ms-seguridad-ganadero)
  export const longitudMinimaClave = 8;



}

const fetch = require('node-fetch');

import {injectable, BindingScope} from '@loopback/core';
import {ConfiguracionSeguridad} from '../config/configuracion.seguridad';

// SERVICIO PARA COMUNICARSE CON ms-seguridad-ganadero
// TODAS LAS LLAMADAS VAN CON EL HEADER x-clave-servicio: LOS PERMISOS (MENU MI FINCA) YA LOS REVISO ms-logica CON @authenticate
// Y QUE QUIEN LLAMA SEA DUEÑO DE LA FINCA LO REVISA LA BASE (FUN_VALIDAR_ACCESO_FINCA)
@injectable({scope: BindingScope.TRANSIENT})
export class SeguridadApiService {

  constructor() {}

  //HEADERS PARA LAS LLAMADAS ENTRE MICROSERVICIOS
  private headersServicio() {
    return {
      'Content-Type': 'application/json',
      'x-clave-servicio': ConfiguracionSeguridad.claveServicios ?? '',
    };
  }

  //HACE UN POST A ms-seguridad Y DEVUELVE SU RESPUESTA {CODIGO, MENSAJE, DATOS}
  private async enviar(ruta: string, cuerpo: object) {
    const respuesta = await fetch(`${ConfiguracionSeguridad.hostSeguridad}/${ruta}`, {
      method: 'POST',
      body: JSON.stringify(cuerpo),
      headers: this.headersServicio(),
    });
    return await respuesta.json();
  }


  //BUSCA LA CUENTA DE UNA PERSONA POR SU CELULAR: DATOS {id_usuario, nombre, rolid, aceptado} O CODIGO 404 SI NO TIENE CUENTA
  async buscarUsuarioCelular(datos: {celular: string}) {
    return this.enviar('buscar-usuario-celular-servicio', datos);
  }

  //CREA LA CUENTA DE UNA PERSONA DE LA FINCA (ENTRA CON EL CELULAR, CLAVE CIFRADA CON BCRYPT): DATOS {id_usuario}
  async crearUsuario(datos: {nombre: string, celular: string, clave: string, rolid: number}) {
    return this.enviar('crear-usuario-servicio', datos);
  }

  //ACTIVA O DESACTIVA UNA CUENTA (AL DESACTIVAR, ms-seguridad CIERRA SUS SESIONES)
  async cambiarEstadoUsuario(datos: {id_usuario: string, aceptado: boolean}) {
    return this.enviar('cambiar-estado-usuario-servicio', datos);
  }

  //EL DUEÑO LE PONE UNA CONTRASEÑA NUEVA A UNA PERSONA DE SU FINCA QUE LA OLVIDO
  async restablecerClave(datos: {id_usuario: string, clave: string}) {
    return this.enviar('restablecer-clave-usuario-servicio', datos);
  }

}

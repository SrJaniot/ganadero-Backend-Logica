import {authenticate} from "@loopback/authentication";
import {inject, service} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {get, post, getModelSchemaRef, param, requestBody, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario, obtenerNombre} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel, ModelInsertFinca, ModelInsertPersonaFinca, ModelRestablecerClavePersonaFinca, ModelUpdateFinca, ModelUpdatePersonaFinca} from "../models";
import {SeguridadApiService} from "../services";

//UN TEXTO OPCIONAL VACIO SE ENVIA COMO NULL
function textoONulo(texto?: string | null): string | null {
  const limpio = (texto ?? '').toString().trim();
  return limpio === '' ? null : limpio;
}

//EL CELULAR SE MANDA A SEGURIDAD SOLO CON NUMEROS (SEGURIDAD QUITA EL +57 Y LO VALIDA)
function soloNumeros(texto?: string | null): string {
  return (texto ?? '').toString().replace(/\D/g, '');
}

//EL ROL DE LA FINCA SE COMPARA EN MAYUSCULAS Y SIN ESPACIOS
function rolFincaLimpio(texto?: string | null): string {
  return (texto ?? '').toString().trim().toUpperCase();
}


//FINCAS (MENU 2 MI FINCA Y MENU 3 HATO) Y LAS PERSONAS QUE TRABAJAN EN CADA FINCA
//QUE QUIEN LLAMA TRABAJE EN LA FINCA Y SU ROL (DUEÑO, VAQUERO, VETERINARIO) LO REVISA LA BASE CON FUN_VALIDAR_ACCESO_FINCA
//LAS CUENTAS DE INGRESO VIVEN EN ms-seguridad: CrearPersonaFinca Y RestablecerClavePersonaFinca ORQUESTAN LAS 2 BASES
export class FincasController {
  //Generacion de un repositorio generico para conectarme a la base de datos postgresql
  private genericRepository: DefaultCrudRepository<GenericModel, typeof GenericModel.prototype.id>;


  constructor(
    // inyectar el datasource de postgresql
    @inject('datasources.postgres') dataSource: juggler.DataSource,
    // servicio para comunicarse con ms-seguridad
    @service(SeguridadApiService)
    public seguridadApiService: SeguridadApiService,
  ) {
    //configuracion del genericRepository para que se conecte a la base de datos postgresql
    this.genericRepository = new DefaultCrudRepository<any, any>(
      GenericModel,
      dataSource
    );
  }



  //FUNCION PARA CREAR UNA FINCA (QUIEN LA CREA QUEDA COMO DUEÑO)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.guardarAccion]
  })
  @post('/CrearFinca')
  @response(200, {
    description: 'Crear una finca (quien la crea queda como dueño)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelInsertFinca),
      },
    },
  })
  async crearFinca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelInsertFinca),
        },
      },
    })
    data: ModelInsertFinca,
  ): Promise<object> {
    try {
      const sql = SQLConfig.CrearFinca;
      const params = [
        data.nom_finca,
        data.municipio_finca,
        textoONulo(data.vereda_finca),
        textoONulo(data.registro_ica_finca),
        textoONulo(data.hierro_finca),
        obtenerIdUsuario(perfil),
        obtenerNombre(perfil)
      ];
      const result = await this.genericRepository.dataSource.execute(sql, params);
      if (result[0].resultado.CODIGO != 200) {
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }
      return {
        "CODIGO": result[0].resultado.CODIGO,
        "MENSAJE": result[0].resultado.MENSAJE,
        "DATOS": result[0].resultado.DATOS
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al crear la finca ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA ACTUALIZAR LOS DATOS DE UNA FINCA (SOLO EL DUEÑO)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.editarAccion]
  })
  @post('/ActualizarFinca')
  @response(200, {
    description: 'Actualizar los datos de una finca (solo el dueño)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelUpdateFinca),
      },
    },
  })
  async actualizarFinca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelUpdateFinca),
        },
      },
    })
    data: ModelUpdateFinca,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ActualizarFinca;
      const params = [
        data.id_finca,
        data.nom_finca,
        data.municipio_finca,
        textoONulo(data.vereda_finca),
        textoONulo(data.registro_ica_finca),
        textoONulo(data.hierro_finca),
        obtenerIdUsuario(perfil)
      ];
      const result = await this.genericRepository.dataSource.execute(sql, params);
      if (result[0].resultado.CODIGO != 200) {
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }
      return {
        "CODIGO": result[0].resultado.CODIGO,
        "MENSAJE": result[0].resultado.MENSAJE,
        "DATOS": result[0].resultado.DATOS
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al actualizar la finca ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LAS FINCAS DONDE TRABAJA EL USUARIO----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerMisFincas')
  @response(200, {
    description: 'Obtener las fincas donde trabaja el usuario',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerMisFincas(
    @inject(SecurityBindings.USER) perfil: UserProfile,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerMisFincas;
      const params = [
        obtenerIdUsuario(perfil)
      ];
      const result = await this.genericRepository.dataSource.execute(sql, params);
      if (result[0].resultado.CODIGO != 200) {
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }
      return {
        "CODIGO": result[0].resultado.CODIGO,
        "MENSAJE": result[0].resultado.MENSAJE,
        "DATOS": result[0].resultado.DATOS
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al obtener las fincas ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER UNA FINCA POR SU ID----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.buscarAccion_id]
  })
  @get('/ObtenerFincaID/{id_finca}')
  @response(200, {
    description: 'Obtener una finca por su id',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerFincaID(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerFincaID;
      const params = [
        id_finca,
        obtenerIdUsuario(perfil)
      ];
      const result = await this.genericRepository.dataSource.execute(sql, params);
      if (result[0].resultado.CODIGO != 200) {
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }
      return {
        "CODIGO": result[0].resultado.CODIGO,
        "MENSAJE": result[0].resultado.MENSAJE,
        "DATOS": result[0].resultado.DATOS
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al obtener la finca ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LAS PERSONAS QUE TRABAJAN EN UNA FINCA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerPersonasFinca/{id_finca}')
  @response(200, {
    description: 'Obtener las personas que trabajan en una finca',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerPersonasFinca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerPersonasFinca;
      const params = [
        id_finca,
        obtenerIdUsuario(perfil)
      ];
      const result = await this.genericRepository.dataSource.execute(sql, params);
      if (result[0].resultado.CODIGO != 200) {
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }
      return {
        "CODIGO": result[0].resultado.CODIGO,
        "MENSAJE": result[0].resultado.MENSAJE,
        "DATOS": result[0].resultado.DATOS
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al obtener las personas de la finca ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //REVISA EN LA BASE QUE QUIEN LLAMA SEA DUEÑO DE LA FINCA (DEVUELVE LA RESPUESTA DE FUN_VALIDAR_ACCESO_FINCA)
  private async validarDuenio(idFinca: number, idUsuario: string): Promise<any> {
    const result = await this.genericRepository.dataSource.execute(SQLConfig.ValidarAccesoDuenio, [idFinca, idUsuario]);
    return result[0].resultado;
  }



  //FUNCION PARA AGREGAR UNA PERSONA A LA FINCA Y, SI NO TIENE CUENTA, CREARLA----------------------------------------------------------------------------------------------------------
  // 1. LA BASE REVISA QUE QUIEN LLAMA SEA DUEÑO DE LA FINCA (FUN_VALIDAR_ACCESO_FINCA)
  // 2. SE BUSCA EL CELULAR EN ms-seguridad: SI YA TIENE CUENTA (TRABAJA EN OTRA FINCA) SE USA ESA Y SE IGNORA LA CLAVE
  //    SI NO TIENE, SE CREA LA CUENTA CON EL ROL DE SEGURIDAD QUE CORRESPONDE AL ROL DE LA FINCA
  // 3. SE AGREGA A LA FINCA (FUN_AGREGAR_PERSONA_FINCA_JSON VALIDA TODO)
  // 4. SI ESTO FALLA Y LA CUENTA SE ACABABA DE CREAR, SE DESACTIVA (SON 2 BASES DIFERENTES)
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.guardarAccion]
  })
  @post('/CrearPersonaFinca')
  @response(200, {
    description: 'Agregar una persona a la finca y crear su cuenta si no tiene',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelInsertPersonaFinca),
      },
    },
  })
  async crearPersonaFinca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelInsertPersonaFinca),
        },
      },
    })
    data: ModelInsertPersonaFinca,
  ): Promise<object> {
    try {
      //1. SOLO EL DUEÑO DE LA FINCA AGREGA PERSONAS
      const acceso = await this.validarDuenio(data.id_finca, obtenerIdUsuario(perfil));
      if (acceso?.CODIGO != 200) {
        return {
          "CODIGO": acceso?.CODIGO ?? 500,
          "MENSAJE": acceso?.MENSAJE ?? "No fue posible revisar el acceso a la finca",
          "DATOS": null
        };
      }

      //LO MINIMO PARA NO LLAMAR A SEGURIDAD EN VANO (LA BASE Y SEGURIDAD VUELVEN A VALIDAR TODO)
      const rolFinca = rolFincaLimpio(data.rol_finca);
      const rolid = ConfiguracionSeguridad.rolSeguridadPorRolFinca[rolFinca];
      if (!rolid) {
        return {
          "CODIGO": 400,
          "MENSAJE": "Elige un rol válido: dueño, vaquero o veterinario",
          "DATOS": null
        };
      }
      const celular = soloNumeros(data.celular);
      if (celular === '') {
        return {
          "CODIGO": 400,
          "MENSAJE": "Escribe el celular de la persona",
          "DATOS": null
        };
      }

      //2. BUSCAR SI EL CELULAR YA TIENE CUENTA
      let respuestaBuscar: any;
      try {
        respuestaBuscar = await this.seguridadApiService.buscarUsuarioCelular({celular: celular});
      } catch (errorSeguridad) {
        respuestaBuscar = {CODIGO: 500, MENSAJE: "No fue posible buscar la cuenta, intenta de nuevo"};
      }

      let idUsuarioPersona: string;
      let nombrePersona: string;
      let cuentaNueva = false;
      if (respuestaBuscar?.CODIGO == 200 && respuestaBuscar?.DATOS?.id_usuario) {
        //YA TIENE CUENTA: SE USA SU id_usuario Y SU NOMBRE (LA CLAVE SE IGNORA)
        idUsuarioPersona = String(respuestaBuscar.DATOS.id_usuario);
        nombrePersona = String(respuestaBuscar.DATOS.nombre ?? data.nom_persona);
      } else if (respuestaBuscar?.CODIGO == 404) {
        //NO TIENE CUENTA: SE CREA CON LA CLAVE QUE ESCRIBIO EL DUEÑO
        if (!data.clave || data.clave.length < ConfiguracionSeguridad.longitudMinimaClave) {
          return {
            "CODIGO": 400,
            "MENSAJE": `La contraseña debe tener mínimo ${ConfiguracionSeguridad.longitudMinimaClave} caracteres`,
            "DATOS": null
          };
        }
        let respuestaCrear: any;
        try {
          respuestaCrear = await this.seguridadApiService.crearUsuario({
            nombre: (data.nom_persona ?? '').trim().replace(/\s+/g, ' '),
            celular: celular,
            clave: data.clave,
            rolid: rolid,
          });
        } catch (errorSeguridad) {
          respuestaCrear = {CODIGO: 500, MENSAJE: "No fue posible crear la cuenta de ingreso, intenta de nuevo"};
        }
        if (respuestaCrear?.CODIGO != 200 || !respuestaCrear?.DATOS?.id_usuario) {
          return {
            "CODIGO": respuestaCrear?.CODIGO ?? 500,
            "MENSAJE": respuestaCrear?.MENSAJE ?? "No fue posible crear la cuenta de ingreso, intenta de nuevo",
            "DATOS": null
          };
        }
        idUsuarioPersona = String(respuestaCrear.DATOS.id_usuario);
        nombrePersona = data.nom_persona;
        cuentaNueva = true;
      } else {
        return {
          "CODIGO": respuestaBuscar?.CODIGO ?? 500,
          "MENSAJE": respuestaBuscar?.MENSAJE ?? "No fue posible buscar la cuenta, intenta de nuevo",
          "DATOS": null
        };
      }

      //3. AGREGAR LA PERSONA A LA FINCA
      const sql = SQLConfig.AgregarPersonaFinca;
      const params = [
        data.id_finca,
        idUsuarioPersona,
        nombrePersona,
        rolFinca,
        obtenerIdUsuario(perfil)
      ];
      let result: any;
      try {
        result = await this.genericRepository.dataSource.execute(sql, params);
      } catch (errorBase) {
        result = [{resultado: {CODIGO: 500, MENSAJE: "Error al agregar la persona a la finca ERROR POSTGRES"}}];
      }
      if (result[0].resultado.CODIGO != 200) {
        //4. REVERTIR: DESACTIVAR LA CUENTA QUE SE ACABABA DE CREAR
        if (cuentaNueva) {
          try {
            await this.seguridadApiService.cambiarEstadoUsuario({id_usuario: idUsuarioPersona, aceptado: false});
          } catch (errorSeguridad) {
            //SI NO SE PUDO DESACTIVAR, LA CUENTA QUEDA SIN FINCA (NO VE NADA) Y SE DEVUELVE EL ERROR DE LA BASE
          }
        }
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }

      return {
        "CODIGO": 200,
        "MENSAJE": result[0].resultado.MENSAJE,
        "DATOS": {
          "ID_FINCA_PERSONA": result[0].resultado.DATOS?.ID_FINCA_PERSONA ?? null,
          "ID_USUARIO": idUsuarioPersona,
          "CUENTA_NUEVA": cuentaNueva
        }
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al agregar la persona a la finca ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA QUE EL DUEÑO LE PONGA UNA CONTRASEÑA NUEVA A UNA PERSONA DE SU FINCA----------------------------------------------------------------------------------------------------------
  //SE REVISA QUE QUIEN LLAMA SEA DUEÑO Y QUE LA PERSONA TRABAJE (ACTIVA) EN ESA FINCA; SEGURIDAD CIERRA SUS SESIONES
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.editarAccion]
  })
  @post('/RestablecerClavePersonaFinca')
  @response(200, {
    description: 'Restablecer la contraseña de una persona de la finca',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelRestablecerClavePersonaFinca),
      },
    },
  })
  async restablecerClavePersonaFinca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelRestablecerClavePersonaFinca),
        },
      },
    })
    data: ModelRestablecerClavePersonaFinca,
  ): Promise<object> {
    try {
      const idUsuario = obtenerIdUsuario(perfil);
      const acceso = await this.validarDuenio(data.id_finca, idUsuario);
      if (acceso?.CODIGO != 200) {
        return {
          "CODIGO": acceso?.CODIGO ?? 500,
          "MENSAJE": acceso?.MENSAJE ?? "No fue posible revisar el acceso a la finca",
          "DATOS": null
        };
      }

      //LA PERSONA DEBE ESTAR ACTIVA EN ESTA FINCA
      const result = await this.genericRepository.dataSource.execute(SQLConfig.ObtenerPersonasFinca, [data.id_finca, idUsuario]);
      if (result[0].resultado.CODIGO != 200) {
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }
      const personas: any[] = Array.isArray(result[0].resultado.DATOS) ? result[0].resultado.DATOS : [];
      const persona = personas.find(p => String(p.ID_USUARIO) === String(data.id_usuario ?? '').trim() && p.ESTADO_FINCA_PERSONA === 'ACTIVO');
      if (!persona) {
        return {
          "CODIGO": 404,
          "MENSAJE": "Esa persona no trabaja en esta finca",
          "DATOS": null
        };
      }
      if (!data.clave || data.clave.length < ConfiguracionSeguridad.longitudMinimaClave) {
        return {
          "CODIGO": 400,
          "MENSAJE": `La contraseña debe tener mínimo ${ConfiguracionSeguridad.longitudMinimaClave} caracteres`,
          "DATOS": null
        };
      }

      const respuestaSeguridad: any = await this.seguridadApiService.restablecerClave({
        id_usuario: String(persona.ID_USUARIO),
        clave: data.clave,
      });
      return {
        "CODIGO": respuestaSeguridad?.CODIGO ?? 500,
        "MENSAJE": respuestaSeguridad?.MENSAJE ?? "No fue posible restablecer la contraseña, intenta de nuevo",
        "DATOS": null
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "No fue posible restablecer la contraseña, intenta de nuevo",
        "DATOS": null
      };
    }
  }




  //FUNCION PARA CAMBIAR EL ROL O EL ESTADO DE UNA PERSONA DE LA FINCA (SOLO EL DUEÑO)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.editarAccion]
  })
  @post('/ActualizarPersonaFinca')
  @response(200, {
    description: 'Cambiar el rol o el estado de una persona de la finca (solo el dueño)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelUpdatePersonaFinca),
      },
    },
  })
  async actualizarPersonaFinca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelUpdatePersonaFinca),
        },
      },
    })
    data: ModelUpdatePersonaFinca,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ActualizarPersonaFinca;
      const params = [
        data.id_finca_persona,
        data.rol_finca,
        data.estado_finca_persona,
        obtenerIdUsuario(perfil)
      ];
      const result = await this.genericRepository.dataSource.execute(sql, params);
      if (result[0].resultado.CODIGO != 200) {
        return {
          "CODIGO": result[0].resultado.CODIGO,
          "MENSAJE": result[0].resultado.MENSAJE,
          "DATOS": null
        };
      }
      return {
        "CODIGO": result[0].resultado.CODIGO,
        "MENSAJE": result[0].resultado.MENSAJE,
        "DATOS": result[0].resultado.DATOS
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al actualizar la persona de la finca ERROR POSTGRES",
        "DATOS": null
      };
    }
  }

}

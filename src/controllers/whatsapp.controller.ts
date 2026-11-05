import {authenticate} from "@loopback/authentication";
import {inject, service} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {get, getModelSchemaRef, param, post, requestBody, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel, ModelCambiarResumenWhatsapp, ModelConfigWhatsapp, ModelProbarResumenWhatsapp} from "../models";
import {ResumenWhatsappService, WhatsappService} from "../services";


//RESUMEN DIARIO POR WHATSAPP (FASE 5D). RECETA DE DOCUMENTACION_WHATSAPP.md (SECCION 6b), COPIADA DE MONSTERHOUSE
//ADMINISTRADOR (MENU 7 CONFIGURACION): VINCULAR EL NUMERO CON QR, INSTANCIA, HORA, PRENDER EL ENVIO Y "MANDAR YA"
//DUEÑO (MENU 2 MI FINCA): PEDIR O NO SU RESUMEN EN CADA FINCA Y MANDARSE EL DE HOY PARA PROBAR. LA BASE REVISA QUE SEA EL DUEÑO
export class WhatsappController {
  //Generacion de un repositorio generico para conectarme a la base de datos postgresql
  private genericRepository: DefaultCrudRepository<GenericModel, typeof GenericModel.prototype.id>;

  constructor(
    // inyectar el datasource de postgresql
    @inject('datasources.postgres') dataSource: juggler.DataSource,
    // servicio de WhatsApp (Evolution API) y el ciclo del resumen
    @service(WhatsappService)
    private whatsappService: WhatsappService,
    @service(ResumenWhatsappService)
    private resumenService: ResumenWhatsappService,
  ) {
    //configuracion del genericRepository para que se conecte a la base de datos postgresql
    this.genericRepository = new DefaultCrudRepository<any, any>(
      GenericModel,
      dataSource
    );
  }

  //RESPUESTA DE UNA FUNCION DE LA BASE CON EL FORMATO DE SIEMPRE
  private async ejecutar(sql: string, params: unknown[], mensajeError: string): Promise<object> {
    try {
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
        "DATOS": result[0].resultado.DATOS ?? null
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": mensajeError,
        "DATOS": null
      };
    }
  }



  //---------------------------------------------ADMINISTRADOR (MENU 7)------------------------------------------------------------

  //FUNCION PARA OBTENER EL ESTADO DEL NUMERO Y LA CONFIGURACION (200 AUNQUE NO ESTE VINCULADO: estado DICE COMO ESTA)--------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.editarAccion]
  })
  @get('/ObtenerEstadoWhatsapp')
  @response(200, {
    description: 'Estado de WhatsApp y configuración del resumen',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerEstadoWhatsapp(): Promise<object> {
    try {
      const conf = await this.resumenService.configuracion();
      const estado = await this.whatsappService.datosInstancia((conf as any).INSTANCIA);
      return {
        "CODIGO": 200,
        "MENSAJE": estado.MENSAJE,
        "DATOS": {
          configurado: estado.DATOS?.configurado ?? true,
          existe: estado.DATOS?.existe ?? null,
          estado: estado.DATOS?.estado ?? null,
          numero: estado.DATOS?.numero ?? null,
          nombrePerfil: estado.DATOS?.nombrePerfil ?? null,
          ...conf,
        }
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al obtener el estado de WhatsApp ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA GENERAR EL QR DE VINCULACION (SI LA INSTANCIA NO EXISTE LA CREA CON LA LLAVE GLOBAL)-----------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.editarAccion]
  })
  @post('/ConectarWhatsapp')
  @response(200, {
    description: 'QR para vincular WhatsApp',
  })
  async conectarWhatsapp(): Promise<object> {
    try {
      const conf = await this.resumenService.configuracion();
      return await this.whatsappService.conectar(conf.INSTANCIA);
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al generar el QR de WhatsApp",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA DESVINCULAR EL NUMERO (LA INSTANCIA QUEDA PARA VOLVER A VINCULAR)---------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.editarAccion]
  })
  @post('/DesconectarWhatsapp')
  @response(200, {
    description: 'Desvincular WhatsApp',
  })
  async desconectarWhatsapp(): Promise<object> {
    try {
      const conf = await this.resumenService.configuracion();
      const resultado = await this.whatsappService.desconectar(conf.INSTANCIA);
      return {
        "CODIGO": resultado.CODIGO,
        "MENSAJE": resultado.MENSAJE,
        "DATOS": null
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al desconectar WhatsApp",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA GUARDAR LA INSTANCIA, LA HORA Y SI EL ENVIO QUEDA PRENDIDO (TODO O NADA EN LA BASE)----------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.editarAccion]
  })
  @post('/GuardarConfigWhatsapp')
  @response(200, {
    description: 'Guardar la configuración del resumen por WhatsApp',
  })
  async guardarConfigWhatsapp(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelConfigWhatsapp),
        },
      },
    })
    data: ModelConfigWhatsapp,
  ): Promise<object> {
    return this.ejecutar(SQLConfig.GuardarConfigWhatsapp, [data.instancia, data.hora, data.activo, obtenerIdUsuario(perfil)],
      'Error al guardar la configuración de WhatsApp ERROR POSTGRES');
  }



  //FUNCION PARA MANDAR LOS RESUMENES DE HOY YA (SIN ESPERAR LA HORA; LA BASE NO REPITE LOS QUE YA SALIERON)--------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.editarAccion]
  })
  @post('/EnviarResumenesWhatsapp')
  @response(200, {
    description: 'Mandar los resúmenes de hoy ya',
  })
  async enviarResumenesWhatsapp(): Promise<object> {
    return this.resumenService.revisar(true);
  }



  //---------------------------------------------DUEÑO (MENU 2)---------------------------------------------------------------------

  //FUNCION PARA VER SI EL DUEÑO PIDIO EL RESUMEN, SI EL ENVIO ESTA PRENDIDO, LA HORA, EL TEXTO DE HOY Y EL ULTIMO-------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerResumenWhatsapp/{id_finca}')
  @response(200, {
    description: 'El resumen por WhatsApp del dueño en una finca',
  })
  async obtenerResumenWhatsapp(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
  ): Promise<object> {
    return this.ejecutar(SQLConfig.ObtenerResumenWhatsapp, [id_finca, obtenerIdUsuario(perfil)], 'Error al obtener el resumen ERROR POSTGRES');
  }



  //FUNCION PARA QUE EL DUEÑO PRENDA O APAGUE SU RESUMEN EN UNA FINCA-----------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.editarAccion]
  })
  @post('/CambiarResumenWhatsapp')
  @response(200, {
    description: 'Prender o apagar el resumen diario por WhatsApp',
  })
  async cambiarResumenWhatsapp(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelCambiarResumenWhatsapp),
        },
      },
    })
    data: ModelCambiarResumenWhatsapp,
  ): Promise<object> {
    return this.ejecutar(SQLConfig.CambiarResumenWhatsapp, [data.id_finca, obtenerIdUsuario(perfil), data.activo], 'Error al guardar el resumen ERROR POSTGRES');
  }



  //FUNCION PARA QUE EL DUEÑO SE MANDE AHORA EL RESUMEN DE HOY (NO VA A LA COLA NI CUENTA COMO EL DEL DIA)----------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.editarAccion]
  })
  @post('/ProbarResumenWhatsapp')
  @response(200, {
    description: 'Mandarse el resumen de hoy para probar',
  })
  async probarResumenWhatsapp(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelProbarResumenWhatsapp),
        },
      },
    })
    data: ModelProbarResumenWhatsapp,
  ): Promise<object> {
    try {
      const idUsuario = obtenerIdUsuario(perfil);
      //LA BASE REVISA QUE SEA EL DUEÑO Y ARMA EL TEXTO DE HOY
      const resumen: any = await this.ejecutar(SQLConfig.ObtenerResumenWhatsapp, [data.id_finca, idUsuario], 'Error al armar el resumen ERROR POSTGRES');
      if (resumen.CODIGO !== 200) {
        return resumen;
      }
      const numero = await this.resumenService.numeroDe(idUsuario);
      if (!numero) {
        return {"CODIGO": 400, "MENSAJE": "Tu cuenta no tiene un celular válido para WhatsApp", "DATOS": null};
      }
      const conf = await this.resumenService.configuracion();
      const envio = await this.whatsappService.enviarTexto(conf.INSTANCIA, numero, resumen.DATOS.TEXTO_HOY);
      return {
        "CODIGO": envio.CODIGO,
        "MENSAJE": envio.CODIGO === 200 ? 'Listo: te mandamos el resumen de hoy por WhatsApp' : envio.MENSAJE,
        "DATOS": null
      };
    } catch (error) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al mandar el resumen de prueba",
        "DATOS": null
      };
    }
  }
}

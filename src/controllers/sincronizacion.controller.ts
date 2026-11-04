import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {get, post, getModelSchemaRef, param, requestBody, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel, ModelCambiosDesde, ModelSincronizarRegistros} from "../models";

//UN TEXTO OPCIONAL VACIO SE ENVIA COMO NULL
function textoONulo(texto?: string | null): string | null {
  const limpio = (texto ?? '').toString().trim();
  return limpio === '' ? null : limpio;
}


//SINCRONIZACION (MENU 8): PRIMERO SE SUBE LO DEL CELULAR Y DESPUES SE BAJA LO DE LOS DEMAS (PLAN, SECCION 4)
export class SincronizacionController {
  //Generacion de un repositorio generico para conectarme a la base de datos postgresql
  private genericRepository: DefaultCrudRepository<GenericModel, typeof GenericModel.prototype.id>;


  constructor(
    // inyectar el datasource de postgresql
    @inject('datasources.postgres') dataSource: juggler.DataSource,
  ) {
    //configuracion del genericRepository para que se conecte a la base de datos postgresql
    this.genericRepository = new DefaultCrudRepository<any, any>(
      GenericModel,
      dataSource
    );
  }



  //FUNCION PARA SUBIR LA BANDEJA DE SALIDA DEL CELULAR----------------------------------------------------------------------------------------------------------
  // CADA REGISTRO SE CREA, SE OMITE (YA_EXISTIA) O SE RECHAZA POR SEPARADO EN FUN_SINCRONIZAR_REGISTROS_JSON
  // LA LISTA VA COMO TEXTO JSON (EL TERCER PARAMETRO DE LA FUNCION ES JSON)
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuSincronizacion, ConfiguracionSeguridad.guardarAccion]
  })
  @post('/SincronizarRegistros')
  @response(200, {
    description: 'Subir la bandeja de salida del celular',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelSincronizarRegistros),
      },
    },
  })
  async sincronizarRegistros(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelSincronizarRegistros),
        },
      },
    })
    data: ModelSincronizarRegistros,
  ): Promise<object> {
    try {
      const sql = SQLConfig.SincronizarRegistros;
      const params = [
        data.id_finca,
        obtenerIdUsuario(perfil),
        JSON.stringify(data.registros ?? [])
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
        "MENSAJE": "Error al sincronizar los registros ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA BAJAR LOS CAMBIOS DE LA FINCA DESDE LA ULTIMA MARCA----------------------------------------------------------------------------------------------------------
  // desde ES LA MARCA (HORA DEL SERVIDOR) DE LA ULTIMA BAJADA; null BAJA LA FINCA COMPLETA
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuSincronizacion, ConfiguracionSeguridad.listarAccion]
  })
  @post('/ObtenerCambiosDesde')
  @response(200, {
    description: 'Bajar los cambios de la finca desde la ultima marca',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelCambiosDesde),
      },
    },
  })
  async obtenerCambiosDesde(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelCambiosDesde),
        },
      },
    })
    data: ModelCambiosDesde,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerCambiosDesde;
      const params = [
        data.id_finca,
        obtenerIdUsuario(perfil),
        textoONulo(data.desde)
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
        "MENSAJE": "Error al obtener los cambios ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LAS ULTIMAS SINCRONIZACIONES DE UNA FINCA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuSincronizacion, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerSincronizaciones/{id_finca}')
  @response(200, {
    description: 'Obtener las ultimas sincronizaciones de una finca',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerSincronizaciones(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerSincronizaciones;
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
        "MENSAJE": "Error al obtener las sincronizaciones ERROR POSTGRES",
        "DATOS": null
      };
    }
  }

}

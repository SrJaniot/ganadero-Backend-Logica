import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {get, getModelSchemaRef, param, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel} from "../models";


//ALERTAS DE LA FINCA (FASE 3, MENU 5 HOY Y ALERTAS): PARTOS PROXIMOS, PALPAR, VACIAS, VACUNAS POR APLICAR, RETIROS DE LECHE Y CICLOS DEL ICA
//LAS CALCULA FUN_OBTENER_ALERTAS_JSON; EL CELULAR LAS PIDE DESPUES DE CADA SINCRONIZACION Y LAS GUARDA PARA VERLAS SIN SEÑAL
export class AlertasController {
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



  //FUNCION PARA OBTENER LAS ALERTAS DE HOY DE UNA FINCA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHoyAlertas, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerAlertas/{id_finca}')
  @response(200, {
    description: 'Obtener las alertas de hoy de una finca',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerAlertas(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerAlertas;
      const params = [
        id_finca,
        obtenerIdUsuario(perfil),
        null
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
        "MENSAJE": "Error al obtener las alertas ERROR POSTGRES",
        "DATOS": null
      };
    }
  }
}

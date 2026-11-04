import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {getModelSchemaRef, post, requestBody, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel, ModelFiltroIndicadores} from "../models";


//UN TEXTO OPCIONAL VACIO SE ENVIA COMO NULL
function textoONulo(texto?: string | null): string | null {
  const limpio = (texto ?? '').toString().trim();
  return limpio === '' ? null : limpio;
}


//INDICADORES DE LA FINCA (FASE 4, MENU 6 INDICADORES Y EXCEL): NATALIDAD, MORTALIDAD, INTERVALO ENTRE PARTOS, LECHE, GANANCIA DE PESO, VENTAS
//LOS CALCULA FUN_OBTENER_INDICADORES_JSON; LA BASE DECIDE QUIEN LOS VE (DUEÑO Y VETERINARIO). EL CELULAR GUARDA LA ULTIMA RESPUESTA
export class IndicadoresController {
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



  //FUNCION PARA OBTENER LOS INDICADORES DE UNA FINCA EN UN PERIODO----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuIndicadores, ConfiguracionSeguridad.listarAccion]
  })
  @post('/ObtenerIndicadores')
  @response(200, {
    description: 'Obtener los indicadores de una finca en un periodo',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerIndicadores(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelFiltroIndicadores),
        },
      },
    })
    data: ModelFiltroIndicadores,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerIndicadores;
      const params = [
        data.id_finca,
        obtenerIdUsuario(perfil),
        textoONulo(data.desde),
        textoONulo(data.hasta),
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
        "MENSAJE": "Error al obtener los indicadores ERROR POSTGRES",
        "DATOS": null
      };
    }
  }
}

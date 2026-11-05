import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {getModelSchemaRef, post, requestBody, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel, ModelFiltroPlata} from "../models";


//UN TEXTO OPCIONAL VACIO SE ENVIA COMO NULL
function textoONulo(texto?: string | null): string | null {
  const limpio = (texto ?? '').toString().trim();
  return limpio === '' ? null : limpio;
}


//PLATA DE LA FINCA (FASE 5B, MENU 2 MI FINCA: SOLO EL DUEÑO): INGRESOS, GASTOS, SALDO, POR CATEGORIA Y POR MES
//LO CALCULA FUN_OBTENER_PLATA_JSON (LA VENTA DE ANIMALES ENTRA DESDE LAS SALIDAS). EL CELULAR GUARDA LA ULTIMA RESPUESTA
export class PlataController {
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



  //FUNCION PARA OBTENER LA PLATA DE UNA FINCA EN UN PERIODO----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.listarAccion]
  })
  @post('/ObtenerPlata')
  @response(200, {
    description: 'Obtener el resumen de la plata de una finca en un periodo',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerPlata(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelFiltroPlata),
        },
      },
    })
    data: ModelFiltroPlata,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerPlata;
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
        "MENSAJE": "Error al obtener la plata ERROR POSTGRES",
        "DATOS": null
      };
    }
  }
}

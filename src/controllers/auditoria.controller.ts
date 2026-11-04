import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {post, getModelSchemaRef, requestBody, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel, ModelFiltroAuditoria} from "../models";

//UN TEXTO OPCIONAL VACIO SE ENVIA COMO NULL
function textoONulo(texto?: string | null): string | null {
  const limpio = (texto ?? '').toString().trim();
  return limpio === '' ? null : limpio;
}


//AUDITORIA DE LA FINCA (MENU 2 MI FINCA): QUIEN CREO, EDITO O ANULO CADA REGISTRO (TAB_AUDITORIAS, LA LLENAN LOS TRIGGERS)
export class AuditoriaController {
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



  //FUNCION PARA OBTENER LA AUDITORIA DE UNA FINCA EN UN RANGO DE FECHAS (SOLO EL DUEÑO)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiFinca, ConfiguracionSeguridad.listarAccion]
  })
  @post('/ObtenerAuditoriaFinca')
  @response(200, {
    description: 'Obtener la auditoria de una finca en un rango de fechas (solo el dueño)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelFiltroAuditoria),
      },
    },
  })
  async obtenerAuditoriaFinca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelFiltroAuditoria),
        },
      },
    })
    data: ModelFiltroAuditoria,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerAuditoriaFinca;
      const params = [
        data.id_finca,
        textoONulo(data.desde),
        textoONulo(data.hasta),
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
        "MENSAJE": "Error al obtener la auditoria de la finca ERROR POSTGRES",
        "DATOS": null
      };
    }
  }

}

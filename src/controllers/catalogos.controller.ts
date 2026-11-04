import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {get, post, getModelSchemaRef, param, requestBody, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel, ModelIdCicloIca, ModelInsertCicloIca, ModelInsertRaza, ModelInsertVacuna, ModelUpdateVacuna} from "../models";


//CATALOGOS GLOBALES: RAZAS, VACUNAS Y CICLOS DEL ICA
//LOS LEEN TODOS (MENU 3 HATO Y MENU 5 HOY Y ALERTAS) Y LOS MANTIENE EL ADMINISTRADOR (MENU 7 CONFIGURACION)
export class CatalogosController {
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



  //FUNCION PARA OBTENER LAS RAZAS----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerRazas')
  @response(200, {
    description: 'Obtener las razas',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerRazas(): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerRazas;
      const result = await this.genericRepository.dataSource.execute(sql);
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
        "MENSAJE": "Error al obtener las razas ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LAS VACUNAS Y TRATAMIENTOS (SI = SOLO LAS ACTIVAS, NO = TODAS)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerVacunas/{solo_activas}')
  @response(200, {
    description: 'Obtener las vacunas y tratamientos (SI = solo las activas, NO = todas)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerVacunas(
    @param.path.string('solo_activas') solo_activas: string,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerVacunas;
      const params = [
        solo_activas
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
        "MENSAJE": "Error al obtener las vacunas ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LOS CICLOS DE VACUNACION DEL ICA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHoyAlertas, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerCiclosIca')
  @response(200, {
    description: 'Obtener los ciclos de vacunacion del ICA',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerCiclosIca(): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerCiclosIca;
      const result = await this.genericRepository.dataSource.execute(sql);
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
        "MENSAJE": "Error al obtener los ciclos del ICA ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA CREAR UNA RAZA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.guardarAccion]
  })
  @post('/CrearRaza')
  @response(200, {
    description: 'Crear una raza',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelInsertRaza),
      },
    },
  })
  async crearRaza(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelInsertRaza),
        },
      },
    })
    data: ModelInsertRaza,
  ): Promise<object> {
    try {
      const sql = SQLConfig.CrearRaza;
      const params = [
        data.nom_raza,
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
        "MENSAJE": "Error al crear la raza ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA CREAR UNA VACUNA O TRATAMIENTO----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.guardarAccion]
  })
  @post('/CrearVacuna')
  @response(200, {
    description: 'Crear una vacuna o tratamiento',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelInsertVacuna),
      },
    },
  })
  async crearVacuna(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelInsertVacuna),
        },
      },
    })
    data: ModelInsertVacuna,
  ): Promise<object> {
    try {
      const sql = SQLConfig.CrearVacuna;
      const params = [
        data.nom_vacuna,
        data.tipo_vacuna,
        data.dias_refuerzo ?? null,
        data.dias_retiro_leche,
        data.obligatoria_ica,
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
        "MENSAJE": "Error al crear la vacuna ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA ACTUALIZAR UNA VACUNA O TRATAMIENTO----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.editarAccion]
  })
  @post('/ActualizarVacuna')
  @response(200, {
    description: 'Actualizar una vacuna o tratamiento',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelUpdateVacuna),
      },
    },
  })
  async actualizarVacuna(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelUpdateVacuna),
        },
      },
    })
    data: ModelUpdateVacuna,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ActualizarVacuna;
      const params = [
        data.id_vacuna,
        data.nom_vacuna,
        data.tipo_vacuna,
        data.dias_refuerzo ?? null,
        data.dias_retiro_leche,
        data.obligatoria_ica,
        data.estado_vacuna,
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
        "MENSAJE": "Error al actualizar la vacuna ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA CREAR UN CICLO DE VACUNACION DEL ICA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.guardarAccion]
  })
  @post('/CrearCicloIca')
  @response(200, {
    description: 'Crear un ciclo de vacunacion del ICA',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelInsertCicloIca),
      },
    },
  })
  async crearCicloIca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelInsertCicloIca),
        },
      },
    })
    data: ModelInsertCicloIca,
  ): Promise<object> {
    try {
      const sql = SQLConfig.CrearCicloIca;
      const params = [
        data.id_vacuna,
        data.nom_ciclo,
        data.fecha_inicio_ciclo,
        data.fecha_fin_ciclo,
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
        "MENSAJE": "Error al crear el ciclo del ICA ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA ANULAR UN CICLO DE VACUNACION DEL ICA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuConfiguracion, ConfiguracionSeguridad.eliminarAccion]
  })
  @post('/AnularCicloIca')
  @response(200, {
    description: 'Anular un ciclo de vacunacion del ICA',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ModelIdCicloIca),
      },
    },
  })
  async anularCicloIca(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelIdCicloIca),
        },
      },
    })
    data: ModelIdCicloIca,
  ): Promise<object> {
    try {
      const sql = SQLConfig.AnularCicloIca;
      const params = [
        data.id_ciclo,
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
        "MENSAJE": "Error al anular el ciclo del ICA ERROR POSTGRES",
        "DATOS": null
      };
    }
  }

}

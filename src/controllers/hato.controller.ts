import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {get, getModelSchemaRef, param, response} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel} from "../models";


//HATO (MENU 3): LOTES, ANIMALES, FICHA, LINEA DE TIEMPO E HISTORIAL DE CAMBIOS
//SOLO LECTURA: LAS ESCRITURAS DEL HATO Y DE LOS EVENTOS VAN TODAS POR /SincronizarRegistros
export class HatoController {
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



  //FUNCION PARA OBTENER LOS LOTES DE UNA FINCA----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerLotes/{id_finca}')
  @response(200, {
    description: 'Obtener los lotes de una finca',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerLotes(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerLotes;
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
        "MENSAJE": "Error al obtener los lotes ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LOS ANIMALES DE UNA FINCA (ACTIVO O TODOS)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.listarAccion]
  })
  @get('/ObtenerAnimales/{id_finca}/{estado}')
  @response(200, {
    description: 'Obtener los animales de una finca (ACTIVO o TODOS)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerAnimales(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
    @param.path.string('estado') estado: string,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerAnimales;
      const params = [
        id_finca,
        estado,
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
        "MENSAJE": "Error al obtener los animales ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LA FICHA DE UN ANIMAL POR SU UUID----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.buscarAccion_id]
  })
  @get('/ObtenerAnimalUUID/{id_finca}/{uuid_animal}')
  @response(200, {
    description: 'Obtener la ficha de un animal por su uuid',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerAnimalUUID(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
    @param.path.string('uuid_animal') uuid_animal: string,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerAnimalUUID;
      const params = [
        id_finca,
        uuid_animal,
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
        "MENSAJE": "Error al obtener el animal ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER LA LINEA DE TIEMPO DE UN ANIMAL----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.buscarAccion_id]
  })
  @get('/ObtenerLineaTiempo/{id_finca}/{uuid_animal}')
  @response(200, {
    description: 'Obtener la linea de tiempo de un animal',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerLineaTiempo(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
    @param.path.string('uuid_animal') uuid_animal: string,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerLineaTiempo;
      const params = [
        id_finca,
        uuid_animal,
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
        "MENSAJE": "Error al obtener la linea de tiempo ERROR POSTGRES",
        "DATOS": null
      };
    }
  }



  //FUNCION PARA OBTENER EL HISTORIAL DE CAMBIOS DE UN REGISTRO (SOLO EL DUEÑO)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.buscarAccion_id]
  })
  @get('/ObtenerHistorialRegistro/{id_finca}/{tipo}/{uuid}')
  @response(200, {
    description: 'Obtener el historial de cambios de un registro (solo el dueño)',
    content: {
      'application/json': {
        schema: getModelSchemaRef(GenericModel),
      },
    },
  })
  async obtenerHistorialRegistro(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
    @param.path.string('tipo') tipo: string,
    @param.path.string('uuid') uuid: string,
  ): Promise<object> {
    try {
      const sql = SQLConfig.ObtenerHistorialRegistro;
      const params = [
        id_finca,
        tipo,
        uuid,
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
        "MENSAJE": "Error al obtener el historial del registro ERROR POSTGRES",
        "DATOS": null
      };
    }
  }

}

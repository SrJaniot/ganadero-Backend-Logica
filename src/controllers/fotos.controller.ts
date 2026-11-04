import {authenticate} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {DefaultCrudRepository, juggler} from "@loopback/repository";
import {get, HttpErrors, oas, param, post, Request, requestBody, response, Response, RestBindings} from "@loopback/rest";
import {SecurityBindings, UserProfile} from "@loopback/security";
import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {obtenerIdUsuario} from "../auth/usuario-sesion";
import {ConfiguracionGeneral} from "../config/configuracion.general";
import {ConfiguracionSeguridad} from "../config/configuracion.seguridad";
import {SQLConfig} from "../config/sql.config";
import {GenericModel} from "../models";


//FOTO DEL ANIMAL (FASE 1). SE SUBE CON SEÑAL, DESPUES DE QUE EL ANIMAL YA LLEGO AL SERVIDOR
//EL ARCHIVO SE GUARDA EN archivos/fotos CON UN NOMBRE QUE GENERA EL SERVIDOR; LA BASE GUARDA ESE NOMBRE (FUN_ACTUALIZAR_FOTO_ANIMAL_JSON)
//QUIEN PUEDE CAMBIARLA Y QUIEN PUEDE VERLA LO DECIDE LA BASE: SUBIR = DUEÑO DE LA FINCA; VER = CUALQUIERA QUE TRABAJE EN ELLA
//LAS FOTOS NUNCA SON PUBLICAS: SE PIDEN CON EL TOKEN Y EL CELULAR LAS GUARDA EN DEXIE PARA VERLAS SIN SEÑAL
export class FotosController {
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


  //CARPETA DE LAS FOTOS (RELATIVA A dist/controllers: QUEDA EN ms-logica-ganadero/archivos/fotos)
  private carpetaFotos(): string {
    return path.join(__dirname, ConfiguracionGeneral.carpetaFotos);
  }

  //RUTA COMPLETA DE UNA FOTO SIN DEJAR SALIRSE DE LA CARPETA (EVITA "../")
  private rutaSegura(nombre: string): string | null {
    const carpeta = path.resolve(this.carpetaFotos());
    const resuelto = path.resolve(carpeta, nombre ?? '');
    if (nombre && /^[A-Za-z0-9._-]{1,200}$/.test(nombre) && resuelto.startsWith(carpeta + path.sep)) {
      return resuelto;
    }
    return null;
  }

  //BORRA UNA FOTO DEL DISCO SIN FALLAR SI NO EXISTE
  private borrarArchivo(nombre?: string | null) {
    const ruta = nombre ? this.rutaSegura(nombre) : null;
    if (ruta && fs.existsSync(ruta)) {
      try { fs.unlinkSync(ruta); } catch { }
    }
  }

  //LEE EL ANIMAL CON LAS REGLAS DE LA BASE (SOLO SI LA PERSONA TRABAJA EN ESA FINCA). DEVUELVE {CODIGO, MENSAJE, ANIMAL}
  private async leerAnimal(id_finca: number, uuid_animal: string, id_usuario: string): Promise<{CODIGO: number, MENSAJE: string, ANIMAL: any}> {
    const result = await this.genericRepository.dataSource.execute(SQLConfig.ObtenerAnimalUUID, [id_finca, uuid_animal, id_usuario]);
    const r = result[0].resultado;
    return {CODIGO: r.CODIGO, MENSAJE: r.MENSAJE, ANIMAL: r.DATOS?.ANIMAL ?? null};
  }



  //SUBIR (O CAMBIAR) LA FOTO DE UN ANIMAL. CAMPO DEL FORMULARIO: "file". JPG, PNG O WEBP DE HASTA 5 MB----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.editarAccion]
  })
  @post('/SubirFotoAnimal/{id_finca}/{uuid_animal}', {
    responses: {
      200: {
        content: {'application/json': {schema: {type: 'object'}}},
        description: 'Foto del animal (JPG, PNG o WEBP)',
      },
    },
  })
  async subirFotoAnimal(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
    @param.path.string('uuid_animal') uuid_animal: string,
    @inject(RestBindings.Http.RESPONSE) respuestaHttp: Response,
    @requestBody.file() request: Request,
  ): Promise<object> {
    const id_usuario = obtenerIdUsuario(perfil);
    let nombreNuevo: string | null = null;
    try {
      //EL ANIMAL DEBE EXISTIR EN ESA FINCA (Y LA PERSONA TRABAJAR AHI) ANTES DE GUARDAR NADA
      const antes = await this.leerAnimal(id_finca, uuid_animal, id_usuario);
      if (antes.CODIGO != 200 || !antes.ANIMAL) {
        return {"CODIGO": antes.CODIGO, "MENSAJE": antes.MENSAJE, "DATOS": null};
      }

      //GUARDAR EL ARCHIVO
      await this.guardarArchivo(request, respuestaHttp);
      nombreNuevo = (request as any).file?.filename ?? null;
      if (!nombreNuevo) {
        return {"CODIGO": 400, "MENSAJE": "No se recibió ninguna foto", "DATOS": null};
      }

      //LA BASE DECIDE SI PUEDE CAMBIARLA (SOLO EL DUEÑO). SI NO, SE BORRA LO QUE SE ACABA DE GUARDAR
      const result = await this.genericRepository.dataSource.execute(SQLConfig.ActualizarFotoAnimal, [uuid_animal, id_finca, nombreNuevo, id_usuario]);
      const r = result[0].resultado;
      if (r.CODIGO != 200) {
        this.borrarArchivo(nombreNuevo);
        return {"CODIGO": r.CODIGO, "MENSAJE": r.MENSAJE, "DATOS": null};
      }
      //LA FOTO ANTERIOR YA NO SE USA
      if (antes.ANIMAL.FOTO_ANIMAL && antes.ANIMAL.FOTO_ANIMAL !== nombreNuevo) {
        this.borrarArchivo(antes.ANIMAL.FOTO_ANIMAL);
      }
      return {"CODIGO": 200, "MENSAJE": r.MENSAJE, "DATOS": {"FOTO_ANIMAL": nombreNuevo}};
    } catch (error: any) {
      this.borrarArchivo(nombreNuevo);
      return {
        "CODIGO": 400,
        "MENSAJE": error?.code === 'LIMIT_FILE_SIZE' ? 'La foto no puede pesar más de 5 MB' : (error?.message ?? 'No fue posible guardar la foto'),
        "DATOS": null
      };
    }
  }



  //QUITAR LA FOTO DE UN ANIMAL (SOLO EL DUEÑO, LO DECIDE LA BASE)----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.editarAccion]
  })
  @post('/QuitarFotoAnimal/{id_finca}/{uuid_animal}')
  @response(200, {description: 'Quitar la foto de un animal'})
  async quitarFotoAnimal(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
    @param.path.string('uuid_animal') uuid_animal: string,
  ): Promise<object> {
    const id_usuario = obtenerIdUsuario(perfil);
    try {
      const antes = await this.leerAnimal(id_finca, uuid_animal, id_usuario);
      if (antes.CODIGO != 200 || !antes.ANIMAL) {
        return {"CODIGO": antes.CODIGO, "MENSAJE": antes.MENSAJE, "DATOS": null};
      }
      const result = await this.genericRepository.dataSource.execute(SQLConfig.ActualizarFotoAnimal, [uuid_animal, id_finca, null, id_usuario]);
      const r = result[0].resultado;
      if (r.CODIGO != 200) {
        return {"CODIGO": r.CODIGO, "MENSAJE": r.MENSAJE, "DATOS": null};
      }
      this.borrarArchivo(antes.ANIMAL.FOTO_ANIMAL);
      return {"CODIGO": 200, "MENSAJE": r.MENSAJE, "DATOS": null};
    } catch (error) {
      return {"CODIGO": 500, "MENSAJE": "Error al quitar la foto ERROR POSTGRES", "DATOS": null};
    }
  }



  //VER LA FOTO DE UN ANIMAL (CUALQUIERA QUE TRABAJE EN LA FINCA). RESPONDE EL ARCHIVO O HTTP 404----------------------------------------------------------------------------------------------------------
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuHato, ConfiguracionSeguridad.buscarAccion_id]
  })
  @get('/ObtenerFotoAnimal/{id_finca}/{uuid_animal}')
  @oas.response.file()
  async obtenerFotoAnimal(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @param.path.number('id_finca') id_finca: number,
    @param.path.string('uuid_animal') uuid_animal: string,
    @inject(RestBindings.Http.RESPONSE) respuestaHttp: Response,
  ) {
    const animal = await this.leerAnimal(id_finca, uuid_animal, obtenerIdUsuario(perfil));
    const ruta = animal.ANIMAL?.FOTO_ANIMAL ? this.rutaSegura(animal.ANIMAL.FOTO_ANIMAL) : null;
    if (animal.CODIGO != 200 || !ruta || !fs.existsSync(ruta)) {
      throw new HttpErrors[404]('Ese animal no tiene foto');
    }
    //PRIVADO: EL NAVEGADOR LA PUEDE GUARDAR SOLO PARA ESTA PERSONA
    respuestaHttp.setHeader('Cache-Control', 'private, max-age=86400');
    respuestaHttp.sendFile(ruta);
    return respuestaHttp;
  }



  //GUARDA EL ARCHIVO CON MULTER: NOMBRE GENERADO POR EL SERVIDOR, SOLO IMAGENES, TAMAÑO MAXIMO DE LA CONFIGURACION
  private guardarArchivo(request: Request, respuestaHttp: Response): Promise<void> {
    const carpeta = this.carpetaFotos();
    const almacen = multer.diskStorage({
      destination: function (req, file, cb) {
        fs.mkdirSync(carpeta, {recursive: true});
        cb(null, carpeta);
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`);
      },
    });
    return new Promise<void>((resolve, reject) => {
      const subir = multer({
        storage: almacen,
        limits: {fileSize: ConfiguracionGeneral.tamanioMaximoFoto},
        fileFilter: function (req, file, callback) {
          const ext = path.extname(file.originalname).toUpperCase();
          if (ConfiguracionGeneral.extensionesFotos.includes(ext)) {
            return callback(null, true);
          }
          return callback(new HttpErrors[400]('La foto debe ser JPG, PNG o WEBP'));
        },
      }).single(ConfiguracionGeneral.campodeNombreArchivo);
      subir(request, respuestaHttp, (err: unknown) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }
}

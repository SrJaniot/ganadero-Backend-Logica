import {Model, model, property} from '@loopback/repository';

//DATOS PARA AGREGAR UNA PERSONA A LA FINCA (FUN_AGREGAR_PERSONA_FINCA_JSON) Y, SI NO TIENE CUENTA, CREARLA EN ms-seguridad
//LA CLAVE NO VA A LA BASE DE NEGOCIO: SOLO A ms-seguridad (/crear-usuario-servicio). SI EL CELULAR YA TIENE CUENTA SE IGNORA
@model()
export class ModelInsertPersonaFinca extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca: number;

  @property({
    type: 'string',
    required: true,
  })
  nom_persona: string;

  @property({
    type: 'string',
    required: true,
  })
  celular: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  clave?: string | null;

  @property({
    type: 'string',
    required: true,
  })
  rol_finca: string;


  constructor(data?: Partial<ModelInsertPersonaFinca>) {
    super(data);
  }
}

export interface ModelInsertPersonaFincaRelations {
  // describe navigational properties here
}

export type ModelInsertPersonaFincaWithRelations = ModelInsertPersonaFinca & ModelInsertPersonaFincaRelations;

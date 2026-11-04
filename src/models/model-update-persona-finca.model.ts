import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_ACTUALIZAR_PERSONA_FINCA_JSON (EL USUARIO SALE DEL TOKEN)
@model()
export class ModelUpdatePersonaFinca extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca_persona: number;

  @property({
    type: 'string',
    required: true,
  })
  rol_finca: string;

  @property({
    type: 'string',
    required: true,
  })
  estado_finca_persona: string;


  constructor(data?: Partial<ModelUpdatePersonaFinca>) {
    super(data);
  }
}

export interface ModelUpdatePersonaFincaRelations {
  // describe navigational properties here
}

export type ModelUpdatePersonaFincaWithRelations = ModelUpdatePersonaFinca & ModelUpdatePersonaFincaRelations;

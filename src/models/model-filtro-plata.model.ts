import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_OBTENER_PLATA_JSON (FECHAS COMO TEXTO YYYY-MM-DD; NULL = ESTE MES; LA BASE LAS VALIDA)
@model()
export class ModelFiltroPlata extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca: number;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  desde?: string | null;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  hasta?: string | null;


  constructor(data?: Partial<ModelFiltroPlata>) {
    super(data);
  }
}

export interface ModelFiltroPlataRelations {
  // describe navigational properties here
}

export type ModelFiltroPlataWithRelations = ModelFiltroPlata & ModelFiltroPlataRelations;

import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_OBTENER_INDICADORES_JSON (FECHAS COMO TEXTO YYYY-MM-DD; NULL = LOS ULTIMOS 12 MESES; LA BASE LAS VALIDA)
@model()
export class ModelFiltroIndicadores extends Model {
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


  constructor(data?: Partial<ModelFiltroIndicadores>) {
    super(data);
  }
}

export interface ModelFiltroIndicadoresRelations {
  // describe navigational properties here
}

export type ModelFiltroIndicadoresWithRelations = ModelFiltroIndicadores & ModelFiltroIndicadoresRelations;

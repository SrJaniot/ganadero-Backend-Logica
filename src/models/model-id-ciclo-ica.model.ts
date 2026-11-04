import {Model, model, property} from '@loopback/repository';

//PARAMETRO DE FUN_ANULAR_CICLO_ICA_JSON (EL USUARIO SALE DEL TOKEN)
@model()
export class ModelIdCicloIca extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_ciclo: number;


  constructor(data?: Partial<ModelIdCicloIca>) {
    super(data);
  }
}

export interface ModelIdCicloIcaRelations {
  // describe navigational properties here
}

export type ModelIdCicloIcaWithRelations = ModelIdCicloIca & ModelIdCicloIcaRelations;

import {Model, model, property} from '@loopback/repository';

//PARAMETROS DE FUN_SINCRONIZAR_REGISTROS_JSON (EL USUARIO SALE DEL TOKEN)
//registros: LA BANDEJA DE SALIDA DEL CELULAR [{orden, uuid, tipo, operacion, datos}] (PLAN, SECCION 4.1). LA BASE VALIDA CADA UNO
@model()
export class ModelSincronizarRegistros extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca: number;

  @property({
    type: 'array',
    required: true,
    jsonSchema: {type: 'array', items: {type: 'object'}},
  })
  registros: object[];


  constructor(data?: Partial<ModelSincronizarRegistros>) {
    super(data);
  }
}

export interface ModelSincronizarRegistrosRelations {
  // describe navigational properties here
}

export type ModelSincronizarRegistrosWithRelations = ModelSincronizarRegistros & ModelSincronizarRegistrosRelations;

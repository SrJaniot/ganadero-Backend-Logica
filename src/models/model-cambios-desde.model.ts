import {Model, model, property} from '@loopback/repository';

//PARAMETROS DE FUN_OBTENER_CAMBIOS_JSON (EL USUARIO SALE DEL TOKEN)
//desde: LA MARCA QUE DEVOLVIO EL SERVIDOR EN LA ULTIMA BAJADA, O null PARA BAJAR LA FINCA COMPLETA
@model()
export class ModelCambiosDesde extends Model {
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


  constructor(data?: Partial<ModelCambiosDesde>) {
    super(data);
  }
}

export interface ModelCambiosDesdeRelations {
  // describe navigational properties here
}

export type ModelCambiosDesdeWithRelations = ModelCambiosDesde & ModelCambiosDesdeRelations;

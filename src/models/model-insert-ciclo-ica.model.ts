import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_CREAR_CICLO_ICA_JSON (FECHAS COMO TEXTO YYYY-MM-DD; EL USUARIO SALE DEL TOKEN)
@model()
export class ModelInsertCicloIca extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_vacuna: number;

  @property({
    type: 'string',
    required: true,
  })
  nom_ciclo: string;

  @property({
    type: 'string',
    required: true,
  })
  fecha_inicio_ciclo: string;

  @property({
    type: 'string',
    required: true,
  })
  fecha_fin_ciclo: string;


  constructor(data?: Partial<ModelInsertCicloIca>) {
    super(data);
  }
}

export interface ModelInsertCicloIcaRelations {
  // describe navigational properties here
}

export type ModelInsertCicloIcaWithRelations = ModelInsertCicloIca & ModelInsertCicloIcaRelations;

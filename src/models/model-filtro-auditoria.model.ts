import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_OBTENER_AUDITORIA_FINCA_JSON (FECHAS COMO TEXTO YYYY-MM-DD; LA BASE LAS VALIDA)
@model()
export class ModelFiltroAuditoria extends Model {
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


  constructor(data?: Partial<ModelFiltroAuditoria>) {
    super(data);
  }
}

export interface ModelFiltroAuditoriaRelations {
  // describe navigational properties here
}

export type ModelFiltroAuditoriaWithRelations = ModelFiltroAuditoria & ModelFiltroAuditoriaRelations;

import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_ACTUALIZAR_VACUNA_JSON (EL USUARIO SALE DEL TOKEN)
@model()
export class ModelUpdateVacuna extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_vacuna: number;

  @property({
    type: 'string',
    required: true,
  })
  nom_vacuna: string;

  @property({
    type: 'string',
    required: true,
  })
  tipo_vacuna: string;

  @property({
    type: 'number',
    jsonSchema: {nullable: true},
  })
  dias_refuerzo?: number | null;

  @property({
    type: 'number',
    required: true,
  })
  dias_retiro_leche: number;

  @property({
    type: 'string',
    required: true,
  })
  obligatoria_ica: string;

  @property({
    type: 'string',
    required: true,
  })
  estado_vacuna: string;


  constructor(data?: Partial<ModelUpdateVacuna>) {
    super(data);
  }
}

export interface ModelUpdateVacunaRelations {
  // describe navigational properties here
}

export type ModelUpdateVacunaWithRelations = ModelUpdateVacuna & ModelUpdateVacunaRelations;

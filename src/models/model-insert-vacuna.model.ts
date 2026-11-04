import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_CREAR_VACUNA_JSON (EL USUARIO SALE DEL TOKEN)
@model()
export class ModelInsertVacuna extends Model {
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


  constructor(data?: Partial<ModelInsertVacuna>) {
    super(data);
  }
}

export interface ModelInsertVacunaRelations {
  // describe navigational properties here
}

export type ModelInsertVacunaWithRelations = ModelInsertVacuna & ModelInsertVacunaRelations;

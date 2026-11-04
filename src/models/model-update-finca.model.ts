import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_ACTUALIZAR_FINCA_JSON (EL USUARIO SALE DEL TOKEN)
@model()
export class ModelUpdateFinca extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca: number;

  @property({
    type: 'string',
    required: true,
  })
  nom_finca: string;

  @property({
    type: 'string',
    required: true,
  })
  municipio_finca: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  vereda_finca?: string | null;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  registro_ica_finca?: string | null;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  hierro_finca?: string | null;


  constructor(data?: Partial<ModelUpdateFinca>) {
    super(data);
  }
}

export interface ModelUpdateFincaRelations {
  // describe navigational properties here
}

export type ModelUpdateFincaWithRelations = ModelUpdateFinca & ModelUpdateFincaRelations;

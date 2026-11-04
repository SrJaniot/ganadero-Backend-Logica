import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_CREAR_FINCA_JSON (EL ID Y EL NOMBRE DEL DUEÑO SALEN DEL TOKEN)
@model()
export class ModelInsertFinca extends Model {
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


  constructor(data?: Partial<ModelInsertFinca>) {
    super(data);
  }
}

export interface ModelInsertFincaRelations {
  // describe navigational properties here
}

export type ModelInsertFincaWithRelations = ModelInsertFinca & ModelInsertFincaRelations;

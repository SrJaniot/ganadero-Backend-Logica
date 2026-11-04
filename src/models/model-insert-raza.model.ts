import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE LOS PARAMETROS DE FUN_CREAR_RAZA_JSON (EL USUARIO SALE DEL TOKEN)
@model()
export class ModelInsertRaza extends Model {
  @property({
    type: 'string',
    required: true,
  })
  nom_raza: string;


  constructor(data?: Partial<ModelInsertRaza>) {
    super(data);
  }
}

export interface ModelInsertRazaRelations {
  // describe navigational properties here
}

export type ModelInsertRazaWithRelations = ModelInsertRaza & ModelInsertRazaRelations;

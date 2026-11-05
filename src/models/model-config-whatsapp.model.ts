import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE FUN_GUARDAR_CONFIG_WHATSAPP_JSON (EL USUARIO SALE DEL TOKEN). activo: SI / NO
@model()
export class ModelConfigWhatsapp extends Model {
  @property({
    type: 'string',
    required: true,
  })
  instancia: string;

  @property({
    type: 'string',
    required: true,
  })
  hora: string;

  @property({
    type: 'string',
    required: true,
  })
  activo: string;


  constructor(data?: Partial<ModelConfigWhatsapp>) {
    super(data);
  }
}

export interface ModelConfigWhatsappRelations {
  // describe navigational properties here
}

export type ModelConfigWhatsappWithRelations = ModelConfigWhatsapp & ModelConfigWhatsappRelations;

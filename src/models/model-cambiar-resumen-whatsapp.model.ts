import {Model, model, property} from '@loopback/repository';

//MISMO ORDEN DE FUN_CAMBIAR_RESUMEN_WHATSAPP_JSON (EL USUARIO SALE DEL TOKEN). activo: SI / NO
@model()
export class ModelCambiarResumenWhatsapp extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca: number;

  @property({
    type: 'string',
    required: true,
  })
  activo: string;


  constructor(data?: Partial<ModelCambiarResumenWhatsapp>) {
    super(data);
  }
}

export interface ModelCambiarResumenWhatsappRelations {
  // describe navigational properties here
}

export type ModelCambiarResumenWhatsappWithRelations = ModelCambiarResumenWhatsapp & ModelCambiarResumenWhatsappRelations;

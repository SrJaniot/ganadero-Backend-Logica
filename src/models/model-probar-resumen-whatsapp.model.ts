import {Model, model, property} from '@loopback/repository';

//LA FINCA DE LA QUE EL DUEÑO QUIERE SU RESUMEN DE HOY YA
@model()
export class ModelProbarResumenWhatsapp extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca: number;


  constructor(data?: Partial<ModelProbarResumenWhatsapp>) {
    super(data);
  }
}

export interface ModelProbarResumenWhatsappRelations {
  // describe navigational properties here
}

export type ModelProbarResumenWhatsappWithRelations = ModelProbarResumenWhatsapp & ModelProbarResumenWhatsappRelations;

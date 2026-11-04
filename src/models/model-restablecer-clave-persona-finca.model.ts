import {Model, model, property} from '@loopback/repository';

//EL DUEÑO LE PONE UNA CLAVE NUEVA A UNA PERSONA DE SU FINCA (LA CLAVE SOLO VA A ms-seguridad)
@model()
export class ModelRestablecerClavePersonaFinca extends Model {
  @property({
    type: 'number',
    required: true,
  })
  id_finca: number;

  @property({
    type: 'string',
    required: true,
  })
  id_usuario: string;

  @property({
    type: 'string',
    required: true,
  })
  clave: string;


  constructor(data?: Partial<ModelRestablecerClavePersonaFinca>) {
    super(data);
  }
}

export interface ModelRestablecerClavePersonaFincaRelations {
  // describe navigational properties here
}

export type ModelRestablecerClavePersonaFincaWithRelations = ModelRestablecerClavePersonaFinca & ModelRestablecerClavePersonaFincaRelations;

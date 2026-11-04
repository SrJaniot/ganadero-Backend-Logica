import {Model, model, property} from '@loopback/repository';

@model()
export class IdEntero extends Model {
  @property({
    type: 'number',
    id: true,
    generated: false,
    required: true,
  })
  id: number;


  constructor(data?: Partial<IdEntero>) {
    super(data);
  }
}

export interface IdEnteroRelations {
  // describe navigational properties here
}

export type IdEnteroWithRelations = IdEntero & IdEnteroRelations;

import {Model, model, property} from '@loopback/repository';

@model()
export class IdString extends Model {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id: string;


  constructor(data?: Partial<IdString>) {
    super(data);
  }
}

export interface IdStringRelations {
  // describe navigational properties here
}

export type IdStringWithRelations = IdString & IdStringRelations;

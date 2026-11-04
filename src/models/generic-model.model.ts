import {Entity, model, property} from '@loopback/repository';

@model()
export class GenericModel extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;


  constructor(data?: Partial<GenericModel>) {
    super(data);
  }
}

export interface GenericModelRelations {
  // describe navigational properties here
}

export type GenericModelWithRelations = GenericModel & GenericModelRelations;

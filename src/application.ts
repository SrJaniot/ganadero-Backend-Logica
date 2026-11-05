//IMPORTANTE PARA QUE FUNCIONE EL .ENV EN EL PROYECTO ES DECIR QUE SE PUEDAN USAR LAS VARIABLES DE ENTORNO GRACIAS A LA LIBRERIA DOTENV
//npm i dotenv
require('dotenv').config();


import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import { AuthenticationComponent, registerAuthenticationStrategy } from '@loopback/authentication';
import { AuthStrategy } from './auth/strategy';

import {ResumenWhatsappObserver} from './observers/resumen-whatsapp.observer';
export {ApplicationConfig};

export class MsLogicaGanaderoApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // aca estoy registrando la estrategia de autenticacion que esta en la carpeta auth
    registerAuthenticationStrategy(this, AuthStrategy);
    // Registra el componente de autenticación una sola vez
    this.component(AuthenticationComponent);

    // vigilante del resumen diario por WhatsApp (fase 5d): cada 5 minutos
    this.lifeCycleObserver(ResumenWhatsappObserver);
  }
}

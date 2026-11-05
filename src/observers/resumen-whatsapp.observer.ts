import {lifeCycleObserver, LifeCycleObserver, service} from '@loopback/core';
import {ResumenWhatsappService} from '../services';

// VIGILANTE DEL RESUMEN DIARIO POR WHATSAPP (FASE 5D, COPIADO DEL DE MONSTERHOUSE): CADA 5 MINUTOS MIENTRAS EL SERVIDOR ESTA PRENDIDO
// A QUIEN LE TOCA Y QUE DICE LO DECIDE LA BASE (FUN_ENCOLAR_RESUMENES_JSON); CON EL ENVIO APAGADO NO HACE NADA
// SE REGISTRA EN application.ts (this.lifeCycleObserver): ARRANCA Y PARA CON EL SERVIDOR
@lifeCycleObserver('resumen-whatsapp')
export class ResumenWhatsappObserver implements LifeCycleObserver {
  private readonly minutosEntreRevisiones = 5;
  private temporizador: NodeJS.Timeout | undefined;

  constructor(
    @service(ResumenWhatsappService) private resumenService: ResumenWhatsappService,
  ) {}

  start(): void {
    //LA PRIMERA REVISION AL MINUTO DE ARRANCAR (DA TIEMPO A QUE TODO ESTE LISTO)
    this.temporizador = setTimeout(() => this.revisar(), 60 * 1000);
  }

  stop(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }
  }

  private async revisar() {
    try {
      await this.resumenService.revisar(false);
    } catch {
      //UNA REVISION QUE FALLA NO DETIENE AL VIGILANTE
    }
    this.temporizador = setTimeout(() => this.revisar(), this.minutosEntreRevisiones * 60 * 1000);
  }
}

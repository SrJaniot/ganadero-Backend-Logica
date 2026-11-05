import {BindingScope, injectable} from '@loopback/core';
import {ConfiguracionSeguridad} from '../config/configuracion.seguridad';

// SERVICIO DE WHATSAPP CON EVOLUTION API (COPIADO DE MONSTERHOUSE, QUE LO COPIO DEL PANEL; DOCUMENTACION_WHATSAPP.md SECCION 6b), SIN GRUPOS
// LA LLAVE GLOBAL VA EN EL .env (WHATSAPP_API_KEY); LA INSTANCIA Y LA HORA DEL RESUMEN, EN TAB_CONFIGURACION (PANTALLA DEL ADMINISTRADOR)
// LOS MENSAJES SALEN DE A UNO, CON 3 SEGUNDOS ENTRE CADA UNO (COLA), SIN ENLACES
const SEGUNDOS_ENTRE_MENSAJES = 3;

export interface ResultadoWhatsapp {
  CODIGO: number;
  MENSAJE: string;
}

@injectable({scope: BindingScope.SINGLETON})
export class WhatsappService {
  private cola: Promise<unknown> = Promise.resolve();

  get configurado(): boolean {
    return !!ConfiguracionSeguridad.whatsappApiKey;
  }

  //ENVIA UN TEXTO (EN COLA). numero: CON INDICATIVO, SOLO DIGITOS, O EL JID DE UN GRUPO
  enviarTexto(instancia: string, numero: string, texto: string): Promise<ResultadoWhatsapp> {
    const envio = this.cola.then(() => this.enviarAhora(instancia, numero, texto));
    this.cola = envio.then(() => new Promise(r => setTimeout(r, SEGUNDOS_ENTRE_MENSAJES * 1000)));
    return envio;
  }

  private async enviarAhora(instancia: string, numero: string, texto: string): Promise<ResultadoWhatsapp> {
    if (!this.configurado) {
      return {CODIGO: 400, MENSAJE: 'Falta la llave de Evolution (WHATSAPP_API_KEY en el .env de ms-logica)'};
    }
    if (!/^(\d{10,15}|[0-9-]{5,60}@g\.us)$/.test(numero ?? '') || !/^[A-Za-z0-9_-]{1,50}$/.test(instancia ?? '')) {
      return {CODIGO: 400, MENSAJE: 'Falta el número (o el grupo) o la instancia de WhatsApp en Configuración'};
    }
    try {
      const respuesta = await fetch(`${ConfiguracionSeguridad.evolutionUrl}/message/sendText/${instancia}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'apikey': ConfiguracionSeguridad.whatsappApiKey ?? ''},
        body: JSON.stringify({number: numero, text: texto}),
        signal: AbortSignal.timeout(20000),
      });
      if (respuesta.ok) {
        return {CODIGO: 200, MENSAJE: 'Mensaje enviado'};
      }
      return {CODIGO: 500, MENSAJE: `Evolution respondió ${respuesta.status}: revisa que la instancia ${instancia} esté vinculada`};
    } catch (error: any) {
      return {CODIGO: 500, MENSAJE: `No hubo conexión con Evolution API (${error?.cause?.code ?? error?.name ?? 'error'})`};
    }
  }

  //---------------- VINCULAR EL NUMERO DESDE LA APP (IGUAL QUE EN MONCHIS Y EL PANEL: QR EN LA PANTALLA) ----------------

  //LLAMADA GENERICA A EVOLUTION: ok = HTTP 2XX
  private async llamar(metodo: 'GET' | 'POST' | 'DELETE', ruta: string, cuerpo?: object): Promise<{ok: boolean; status: number; datos: any}> {
    const respuesta = await fetch(`${ConfiguracionSeguridad.evolutionUrl}${ruta}`, {
      method: metodo,
      headers: {'Content-Type': 'application/json', 'apikey': ConfiguracionSeguridad.whatsappApiKey ?? ''},
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    const texto = await respuesta.text();
    let datos: any = null;
    try {
      datos = texto ? JSON.parse(texto) : null;
    } catch {
      datos = texto;
    }
    return {ok: respuesta.ok, status: respuesta.status, datos};
  }

  //DATOS DE LA INSTANCIA: ESTADO, NUMERO VINCULADO Y NOMBRE EN WHATSAPP. existe = false SI EVOLUTION NO LA TIENE
  async datosInstancia(instancia: string): Promise<{CODIGO: number; MENSAJE: string; DATOS: any}> {
    if (!this.configurado) {
      return {CODIGO: 404, MENSAJE: 'Falta la llave de Evolution (WHATSAPP_API_KEY en el .env de ms-logica)', DATOS: {configurado: false}};
    }
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(instancia ?? '')) {
      return {CODIGO: 400, MENSAJE: 'Instancia no válida', DATOS: null};
    }
    try {
      const r = await this.llamar('GET', `/instance/fetchInstances?instanceName=${instancia}`);
      const datos = Array.isArray(r.datos) ? r.datos.find((i: any) => i?.name === instancia) ?? null : null;
      if (r.status === 401 || r.status === 403) {
        return {CODIGO: 401, MENSAJE: 'Evolution no aceptó la llave del .env (WHATSAPP_API_KEY)', DATOS: {configurado: true, existe: null, estado: null}};
      }
      if (!datos) {
        return {CODIGO: 404, MENSAJE: `La instancia ${instancia} todavía no existe: pulsa "Vincular con QR" y la app la crea`, DATOS: {configurado: true, existe: false, estado: null}};
      }
      const estado = datos.connectionStatus ?? null;
      return {
        CODIGO: 200,
        MENSAJE: estado === 'open' ? 'WhatsApp vinculado' : `WhatsApp no está vinculado (${estado ?? 'sin estado'})`,
        DATOS: {
          configurado: true, existe: true, estado,
          numero: datos.ownerJid ? String(datos.ownerJid).split('@')[0] : null,
          nombrePerfil: datos.profileName ?? null,
        },
      };
    } catch (error: any) {
      return {CODIGO: 500, MENSAJE: `No hubo conexión con Evolution API (${error?.cause?.code ?? error?.name ?? 'error'})`, DATOS: {configurado: true, existe: null, estado: null}};
    }
  }

  //QR PARA VINCULAR. SI LA INSTANCIA NO EXISTE LA CREA (ESO NECESITA LA LLAVE GLOBAL DE EVOLUTION EN EL .env)
  async conectar(instancia: string): Promise<{CODIGO: number; MENSAJE: string; DATOS: any}> {
    const actual = await this.datosInstancia(instancia);
    if (actual.CODIGO !== 200 && actual.DATOS?.existe !== false) {
      return {CODIGO: actual.CODIGO, MENSAJE: actual.MENSAJE, DATOS: null};
    }
    if (actual.DATOS?.estado === 'open') {
      return {CODIGO: 400, MENSAJE: 'WhatsApp ya está vinculado. Para cambiar de número, primero desconéctalo', DATOS: null};
    }
    try {
      let qr: any;
      if (actual.DATOS?.existe === false) {
        const creada = await this.llamar('POST', '/instance/create', {
          instanceName: instancia, integration: 'WHATSAPP-BAILEYS', qrcode: true, groupsIgnore: true, syncFullHistory: false,
        });
        if (creada.status === 401 || creada.status === 403) {
          return {CODIGO: 403, MENSAJE: `La llave del .env no puede crear instancias: pon la llave global de Evolution en WHATSAPP_API_KEY (ver la guía) o crea la instancia ${instancia} en el manager`, DATOS: null};
        }
        if (!creada.ok) {
          return {CODIGO: 500, MENSAJE: `Evolution no creó la instancia (respondió ${creada.status})`, DATOS: null};
        }
        qr = creada.datos?.qrcode;
      }
      //RECIEN CREADA A VECES NO TRAE EL QR TODAVIA: SE PIDE CON connect
      if (!qr?.base64) {
        const r = await this.llamar('GET', `/instance/connect/${instancia}`);
        if (!r.ok) {
          return {CODIGO: 500, MENSAJE: `Evolution no generó el QR (respondió ${r.status})`, DATOS: null};
        }
        if (r.datos?.instance?.state === 'open') {
          return {CODIGO: 400, MENSAJE: 'WhatsApp ya está vinculado', DATOS: null};
        }
        qr = r.datos;
      }
      if (!qr?.base64) {
        return {CODIGO: 500, MENSAJE: 'Evolution no devolvió el QR: intenta de nuevo en unos segundos', DATOS: null};
      }
      return {
        CODIGO: 200,
        MENSAJE: actual.DATOS?.existe === false ? `Instancia ${instancia} creada: escanea el QR` : 'Escanea el QR',
        DATOS: {QR: qr.base64, CODIGO_VINCULACION: qr.pairingCode ?? null},
      };
    } catch (error: any) {
      return {CODIGO: 500, MENSAJE: `No hubo conexión con Evolution API (${error?.cause?.code ?? error?.name ?? 'error'})`, DATOS: null};
    }
  }

  //DESVINCULA EL NUMERO (LA INSTANCIA SIGUE EXISTIENDO PARA VOLVER A VINCULAR)
  async desconectar(instancia: string): Promise<ResultadoWhatsapp> {
    if (!this.configurado) {
      return {CODIGO: 400, MENSAJE: 'Falta la llave de Evolution (WHATSAPP_API_KEY en el .env de ms-logica)'};
    }
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(instancia ?? '')) {
      return {CODIGO: 400, MENSAJE: 'Instancia no válida'};
    }
    try {
      const r = await this.llamar('DELETE', `/instance/logout/${instancia}`);
      if (!r.ok) {
        return {CODIGO: 400, MENSAJE: `Evolution no desconectó la instancia (respondió ${r.status}); puede que ya estuviera desconectada`};
      }
      return {CODIGO: 200, MENSAJE: `WhatsApp desconectado: la instancia ${instancia} quedó sin número`};
    } catch (error: any) {
      return {CODIGO: 500, MENSAJE: `No hubo conexión con Evolution API (${error?.cause?.code ?? error?.name ?? 'error'})`};
    }
  }
}

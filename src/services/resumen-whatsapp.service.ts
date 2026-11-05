import {BindingScope, inject, injectable, service} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {SQLConfig} from '../config/sql.config';
import {SeguridadApiService} from './seguridad-api.service';
import {WhatsappService} from './whatsapp.service';

// CICLO DEL RESUMEN DIARIO POR WHATSAPP (FASE 5D). LO CORREN EL VIGILANTE CADA 5 MINUTOS Y EL BOTON "MANDAR YA" DEL ADMINISTRADOR
// 1. A PARTIR DE LA HORA CONFIGURADA, LA BASE PONE EN LA COLA EL RESUMEN DE CADA DUEÑO QUE LO PIDIO (FUN_ENCOLAR_RESUMENES_JSON, UNO POR DIA)
// 2. TOMA LOS PENDIENTES, PIDE EL CELULAR A ms-seguridad (SOLO ESTA ALLA) Y LOS MANDA POR LA COLA DEL SERVICIO (3 S ENTRE CADA UNO)
// 3. LE DICE A LA BASE COMO LE FUE (FUN_MARCAR_MENSAJE_WHATSAPP_JSON: A LOS 3 ERRORES QUEDA FALLIDO)
// NADA DE ESTO PASA CON EL ENVIO APAGADO (WHATSAPP_ACTIVO = NO)
export interface ResultadoResumen {
  CODIGO: number;
  MENSAJE: string;
  DATOS: {ENCOLADOS: number; ENVIADOS: number; SIN_NUMERO: number; ERRORES: number} | null;
}

//EL CELULAR DE LA CUENTA (10 DIGITOS QUE EMPIEZAN POR 3) CON EL INDICATIVO DE COLOMBIA
export function numeroWhatsapp(celular: string | null | undefined): string | null {
  const digitos = String(celular ?? '').replace(/\D/g, '');
  if (/^3\d{9}$/.test(digitos)) return '57' + digitos;
  if (/^573\d{9}$/.test(digitos)) return digitos;
  return null;
}

//LA FECHA Y LA HORA DEL SERVIDOR (EN COLOMBIA): AAAA-MM-DD Y HH:MM
function ahoraLocal(): {dia: string; hora: string} {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return {dia: `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`, hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`};
}

@injectable({scope: BindingScope.SINGLETON})
export class ResumenWhatsappService {
  //UNA SOLA REVISION A LA VEZ (EL VIGILANTE Y EL BOTON NO SE PISAN) Y EL DIA EN QUE YA SE ENCOLO (LA BASE IGUAL NO REPITE)
  private revisando = false;
  private encoladoEl: string | null = null;

  constructor(
    @inject('datasources.postgres') private dataSource: juggler.DataSource,
    @service(WhatsappService) private whatsappService: WhatsappService,
    @service(SeguridadApiService) private seguridadApi: SeguridadApiService,
  ) {}

  private async sql(consulta: string, parametros: unknown[] = []): Promise<any> {
    const resultado = await this.dataSource.execute(consulta, parametros);
    return resultado[0].resultado;
  }

  async configuracion(): Promise<{INSTANCIA: string; HORA: string; ACTIVO: boolean}> {
    return (await this.sql(SQLConfig.ObtenerConfigWhatsapp)).DATOS;
  }

  //EL CELULAR DE UNA CUENTA YA CON INDICATIVO; null SI NO TIENE UNO VALIDO. LANZA SI ms-seguridad NO RESPONDE (ES UN ERROR, NO "SIN NUMERO")
  async numeroDe(idUsuario: string): Promise<string | null> {
    const r = await this.seguridadApi.obtenerCelular({id_usuario: idUsuario});
    if (r?.CODIGO === 200) return numeroWhatsapp(r.DATOS?.celular);
    if (r?.CODIGO === 404 || r?.CODIGO === 400) return null;
    throw new Error(r?.MENSAJE ?? 'ms-seguridad no respondió');
  }

  //forzar: EL BOTON DEL ADMINISTRADOR (ENCOLA AUNQUE NO SEA LA HORA)
  async revisar(forzar = false): Promise<ResultadoResumen> {
    if (this.revisando) {
      return {CODIGO: 400, MENSAJE: 'Ya se están mandando los resúmenes: espera un momento', DATOS: null};
    }
    this.revisando = true;
    const cuenta = {ENCOLADOS: 0, ENVIADOS: 0, SIN_NUMERO: 0, ERRORES: 0};
    try {
      const conf = await this.configuracion();
      if (!conf.ACTIVO) {
        return {CODIGO: 400, MENSAJE: 'El envío por WhatsApp está apagado: prende «Enviar el resumen» y guarda', DATOS: null};
      }

      //1. ENCOLAR (UNA VEZ AL DIA, A PARTIR DE LA HORA)
      const {dia, hora} = ahoraLocal();
      if (forzar || (hora >= conf.HORA && this.encoladoEl !== dia)) {
        const r = await this.sql(SQLConfig.EncolarResumenesWhatsapp);
        cuenta.ENCOLADOS = Number(r?.DATOS?.ENCOLADOS ?? 0);
        this.encoladoEl = dia;
      }

      //2. Y 3. MANDAR LO PENDIENTE (TAMBIEN LO QUE FALLO EN UNA REVISION ANTERIOR)
      const pendientes = await this.sql(SQLConfig.ObtenerMensajesPendientesWhatsapp, [20]);
      for (const m of (pendientes?.CODIGO === 200 ? pendientes.DATOS : []) as {ID_MENSAJE: number; ID_USUARIO: string; TEXTO_MENSAJE: string}[]) {
        let resultado = 'ERROR';
        let error: string | null = null;
        try {
          const numero = await this.numeroDe(m.ID_USUARIO);
          if (!numero) {
            resultado = 'SIN_NUMERO';
            error = 'La cuenta no tiene un celular válido';
          } else {
            const envio = await this.whatsappService.enviarTexto(conf.INSTANCIA, numero, m.TEXTO_MENSAJE);
            resultado = envio.CODIGO === 200 ? 'ENVIADO' : 'ERROR';
            error = envio.CODIGO === 200 ? null : envio.MENSAJE;
          }
        } catch (e: any) {
          error = `No se pudo pedir el celular a ms-seguridad (${e?.message ?? 'error'})`;
        }
        await this.sql(SQLConfig.MarcarMensajeWhatsapp, [m.ID_MENSAJE, resultado, error]);
        if (resultado === 'ENVIADO') cuenta.ENVIADOS++;
        else if (resultado === 'SIN_NUMERO') cuenta.SIN_NUMERO++;
        else cuenta.ERRORES++;
      }
      return {
        CODIGO: 200,
        MENSAJE: `${cuenta.ENCOLADOS} en la cola, ${cuenta.ENVIADOS} enviados, ${cuenta.SIN_NUMERO} sin número y ${cuenta.ERRORES} con error`,
        DATOS: cuenta,
      };
    } catch (e) {
      return {CODIGO: 500, MENSAJE: 'Error al mandar los resúmenes ERROR POSTGRES', DATOS: null};
    } finally {
      this.revisando = false;
    }
  }
}

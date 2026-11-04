# ms-logica-ganadero

Microservicio de lógica de **Ganadero** (LoopBack 4): fincas de doble propósito que funcionan sin internet y sincronizan después. SQL-first: la lógica de negocio vive en funciones `FUN_*_JSON` de la base `ganadero` (repo `ganadero-DB`); LoopBack solo pasa los datos. Cada endpoint protegido pregunta a ms-seguridad-ganadero (`/validar-permisos`) y el id del usuario sale del token, nunca del body.

Contrato: `V:\proyectos\documentacion general\proyectos\ganadero\PLAN_GANADERO.md`, secciones 4 y 8.3.

## Instalación

```sh
npm install
# copiar ejemplo.env.txt como .env y llenarlo
npm start   # puerto 3021 (ms-seguridad-ganadero en 3020)
```

El primer administrador se crea en ms-seguridad-ganadero (`npm run crear-admin`).

## Endpoints (fase 0)

| Controlador | Endpoints | Menú |
|---|---|---|
| `fincas` | `/CrearFinca`, `/ActualizarFinca`, `/ObtenerMisFincas`, `/ObtenerFincaID/{id_finca}`, `/ObtenerPersonasFinca/{id_finca}`, `/CrearPersonaFinca`, `/ActualizarPersonaFinca`, `/RestablecerClavePersonaFinca` | Mi finca (2), Hato (3) |
| `catalogos` | `/ObtenerRazas`, `/ObtenerVacunas/{solo_activas}`, `/ObtenerCiclosIca`, `/CrearRaza`, `/CrearVacuna`, `/ActualizarVacuna`, `/CrearCicloIca`, `/AnularCicloIca` | Hato (3), Hoy (5), Configuración (7) |
| `hato` | `/ObtenerLotes/{id_finca}`, `/ObtenerAnimales/{id_finca}/{estado}`, `/ObtenerAnimalUUID/{id_finca}/{uuid_animal}`, `/ObtenerLineaTiempo/{id_finca}/{uuid_animal}`, `/ObtenerHistorialRegistro/{id_finca}/{tipo}/{uuid}` | Hato (3) |
| `auditoria` | `/ObtenerAuditoriaFinca` | Mi finca (2) |
| `sincronizacion` | `/SincronizarRegistros`, `/ObtenerCambiosDesde`, `/ObtenerSincronizaciones/{id_finca}` | Sincronización (8) |

Las escrituras del hato y de los eventos van todas por `/SincronizarRegistros`, también con señal.

export namespace ConfiguracionGeneral {
  //-------------------------carpetas -------------------------------------
  //RUTA RELATIVA A dist/controllers (QUEDA EN ms-logica-ganadero/archivos/fotos). FOTOS DE LOS ANIMALES: NUNCA PUBLICAS, SE PIDEN CON EL TOKEN
  export const carpetaFotos: string = "../../archivos/fotos";
  //-------------------------archivos -------------------------------------
  //NOMBRE DEL CAMPO DEL ARCHIVO EN LOS FORMULARIOS MULTIPART
  export const campodeNombreArchivo: string = "file";
  //SVG NO SE PERMITE PORQUE PUEDE LLEVAR CODIGO. EL CELULAR YA REDUCE LA FOTO A JPEG ANTES DE SUBIRLA
  export const extensionesFotos: string[] = ['.PNG', '.JPG', '.JPEG', '.WEBP'];
  //TAMAÑO MAXIMO DE UNA FOTO (5 MB)
  export const tamanioMaximoFoto: number = 5 * 1024 * 1024;
}

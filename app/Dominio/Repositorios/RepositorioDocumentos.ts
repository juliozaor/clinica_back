import { Factura } from '../Datos/Entidades/factura';
import { PayloadJWT } from '../Dto/PayloadJWT';
import { Paginador } from '../Paginador';

export interface RepositorioDocumentos {
  obtenerDocumentos(param: any, documento:number): Promise<{}>
  obtenerCausas(): Promise<{}>
  actualizarFactura(estado:number, factura:Factura, documento:string,boton:number, rol:string): Promise<{}>
}

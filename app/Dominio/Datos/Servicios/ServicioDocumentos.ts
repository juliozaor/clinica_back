/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { RepositorioDocumentos } from 'App/Dominio/Repositorios/RepositorioDocumentos'
//import { Documentos } from '../Entidades/Autorizacion/Documentos'
import { Paginador } from '../../Paginador';
import { Factura } from '../Entidades/factura';

export class ServicioDocumentos{
  constructor (private repositorio: RepositorioDocumentos) { }

  async obtenerDocumentos (params: any, documento:number): Promise<{}> {
    return this.repositorio.obtenerDocumentos(params, documento);
  }

  async obtenerCausas (): Promise<{}> {
    return this.repositorio.obtenerCausas();
  }

  async actualizarFactura (estado:number, factura:Factura, documento:string,boton:number, rol:string): Promise<{}> {
    return this.repositorio.actualizarFactura(estado, factura,documento,boton, rol);
  }

}

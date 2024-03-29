import { RepositorioDocumentos } from "App/Dominio/Repositorios/RepositorioDocumentos";

import Database from "@ioc:Adonis/Lucid/Database";
import { ConsultasDB } from "App/Infraestructura/Servicios/Consultas";
import { Factura } from "App/Dominio/Datos/Entidades/factura";
import { DateTime } from "luxon";
import { ServicioActualizacion } from "App/Infraestructura/Servicios/Actualizar";
import { ServicioLogs } from "App/Dominio/Datos/Servicios/ServicioLogs";
import { TblCausas } from "App/Infraestructura/Datos/Entidad/Causas";

export class RepositorioDocumentosDB implements RepositorioDocumentos {
  private servicioActualizacion = new ServicioActualizacion();
  private servicioLogs = new ServicioLogs();
  async obtenerDocumentos(params: any, documento: number): Promise<{}> {
    const { estado = 2, parametro } = params;
    let factura;
    factura = await this.consultarFactura(estado, documento, parametro);

    const servicioConsultas = new ConsultasDB();
    if (!factura) {
      const sql = servicioConsultas.actualizarAnalizar(documento, parametro);

      try {
        await Database.rawQuery(sql);
      } catch (error) {
        console.log(error);

        throw new Error("Error al ejecutar la consulta SQL");
      }

      //Realizar nuevamente la consulta inicial
      factura = await this.consultarFactura(estado, documento, parametro);

      if (!factura) {
        return "No hay facturas disponibles para este proceso";
      }
    }

    const sqlDetalles = servicioConsultas.consultardetalles(
      factura.RPA_FOR_NUMERFORMU
    );
    const detalles = await Database.rawQuery(sqlDetalles);
    factura.detalles = detalles;
    const fechaDigit = factura.RPA_FOR_FECHADIGIT;
    const fechaTencion = factura.RPA_FOR_FECHATENCION;

    const fechaFormateadaDigit = fechaDigit?.toISOString().slice(0, 16);
    const fechaFormateadaTencion = fechaTencion?.toISOString().slice(0, 16);

    factura.RPA_FOR_FECHADIGIT = fechaFormateadaDigit;
    factura.RPA_FOR_FECHATENCION = fechaFormateadaTencion;

    return factura;
  }

  consultarFactura = async (
    estado: number,
    documento: number,
    parametro: string
  ) => {
    const servicioConsultas = new ConsultasDB();
    const sql = servicioConsultas.consultarFormulario(
      documento,
      parametro,
      estado
    );
    try {
      const f = await Database.rawQuery(sql);
      return f[0];
    } catch (error) {
      console.log(error);

      throw new Error("Error al ejecutar la consulta SQL");
    }
  };

  async actualizarFactura(
    estado: number,
    factura: Factura,
    documento: string,
    boton: number,
    rol: string
  ): Promise<{}> {
    const fechaActual = DateTime.now().toFormat("yyyy-MM-dd HH:mm:ss.SSS");
    const datos = this.servicioActualizacion.obtenerKeys(boton);


    try {
      factura.estadoId = estado;
      factura.fultestado = fechaActual;
      factura[datos.fechaUsuario] = fechaActual;
      factura[datos.usuario] = documento;

      if (factura.RPA_FOR_FECHADIGIT) {
        factura.RPA_FOR_FECHADIGIT = await this.formatearfecha(
          factura.RPA_FOR_FECHADIGIT
        );
      }
      if (factura.RPA_FOR_FECHATENCION) {
        factura.RPA_FOR_FECHATENCION = await this.formatearfecha(
          factura.RPA_FOR_FECHATENCION
        );
      }

      delete factura.estado_id;

      console.log(factura);

      await Database.from("BOTF_FACTURACION")
        .where("RPA_FOR_NUMERFORMU", factura.RPA_FOR_NUMERFORMU!)
        .update(factura);

      this.servicioLogs.Forms(
        documento,
        rol,
        factura.RPA_FOR_NUMERFORMU!,
        boton,
        estado
      );

      return true;
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  async obtenerCausas(): Promise<{}> {
    return await TblCausas.query();
  }

  formatearfecha = (fecha: string): string => {
    const date = new Date(fecha);

    // Obtener los componentes de la fecha (año, mes, día, hora, minutos)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Agregar ceros a la izquierda si es necesario
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  };
}

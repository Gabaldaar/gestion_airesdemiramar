/**
 * Biblioteca de plantillas modelo para contratos y correos electrónicos.
 * Estos textos se proporcionan como base para que el usuario los personalice.
 */

export const CONTRACT_TEMPLATES = [
  {
    id: 'temporario',
    name: 'Modelo Temporario (Turístico)',
    content: `CONTRATO DE LOCACIÓN TEMPORARIA CON FINES TURÍSTICOS
<Ingresá el lugar>, {{fechaActual}}, {{propietario.nombre}}, con DNI {{propietario.dni}}, en adelante "EL LOCADOR, y {{inquilino.nombre}}, con DNI {{inquilino.dni}} y domicilio en {{inquilino.direccion}}, en adelante "EL LOCATARIO", convienen en celebrar el presente contrato de locación temporaria, el cual se regirá por las siguientes cláusulas y condiciones:
PRIMERA: OBJETO. EL LOCADOR cede en locación temporaria con fines de descanso y turismo al LOCATARIO, y este acepta de conformidad, el inmueble denominado "{{propiedad.nombre}}", sito en {{propiedad.direccion}}. El inmueble se entrega en perfecto estado de conservación y funcionamiento, con todo el mobiliario y enseres que se detallan en inventario verbal al momento del ingreso, obligándose el LOCATARIO a restituirlo en las mismas condiciones.
SEGUNDA: PLAZO. El presente contrato se estipula por el término comprendido entre las siguientes fechas:
           Check-in:  {{fechaCheckIn}} a las 15:00 hs
          Check-out:  {{fechaCheckOut}} a las 10:00 hs. 
El LOCATARIO se compromete a desalojar el inmueble en la fecha y hora pactada sin necesidad de notificación o requerimiento alguno. La no restitución del inmueble en el plazo convenido dará derecho al LOCADOR a reclamar una multa diaria equivalente al doble del valor diario del alquiler.
TERCERA: PRECIO. El precio total de la presente locación se pacta en la suma de {{moneda}} {{monto}} ({{montoEnLetras}} {{monedaNombre}}). Dicho importe deberá ser abonado por EL LOCATARIO, 30% a la firma del presente contrato y el saldo previamente al ingreso a la propiedad.
CUARTA: OBLIGACIONES DEL LOCATARIO. EL LOCATARIO se obliga a:
a) No exceder la capacidad máxima de <xx> personas para pernoctar en el inmueble. b) No subalquilar ni ceder total o parcialmente el presente contrato. c) No introducir modificaciones ni realizar obra alguna en el inmueble. d) Utilizar el inmueble exclusivamente para fines de descanso y turismo, quedando prohibida cualquier otra actividad. e) Respetar las normas de convivencia del edificio/barrio, evitando ruidos molestos. f) Hacerse cargo de cualquier daño o rotura que se produzca en el inmueble o en sus enseres por su culpa o la de las personas que con él habiten.
QUINTA: DEPÓSITO EN GARANTÍA. EL LOCATARIO entregará al LOCADOR la suma de {{monedaGarantia}}{{montoGarantia}} en concepto de depósito en garantía, el cual será restituido al finalizar la locación, una vez verificado el correcto estado del inmueble y sus bienes. 
SEXTA: POLÍTICA DE CANCELACIÓN. En caso de que el inquilino desistiera de avanzar con el presente contrato, y una vez abonada la reserva, la misma se reintegrará según las siguientes condiciones:
Cancelando hasta 30 días antes de la fecha de ingreso, se reintegrará el 80% del monto de la reserva, menos gastos administrativos, si los hubiera. Cancelando desde 30 días antes y hasta el día anterior a la fecha de ingreso, se reintegrará el 50% del monto de la reserva, menos gastos administrativos, si los hubiera. Si el cliente no se presentara para tomar posesión de la reserva o cancela el mismo día de ingreso, no se reintegrará el monto de la reserva, perdiendo todo derecho a reclamo.
De conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto.`
  },
  {
    id: 'largo-plazo',
    name: 'Modelo Largo Plazo (Vivienda)',
    content: `CONTRATO DE LOCACIÓN DE INMUEBLE

Entre {{propietario.nombre}}, DNI {{propietario.dni}}, con domicilio en {{propietario.domicilio}}, en adelante EL LOCADOR, y {{inquilino.nombre}}, DNI {{inquilino.dni}}, con domicilio en {{inquilino.direccion}}, en adelante EL LOCATARIO, se celebra el presente Contrato de Locación de Vivienda, sujeto a las siguientes cláusulas:

1. Objeto
El LOCADOR da en locación al LOCATARIO el inmueble ubicado en {{propiedad.direccion}}, destinado exclusivamente a vivienda familiar.
El LOCATARIO declara haber inspeccionado el inmueble y recibirlo en buen estado de uso y conservación.

2. Plazo
El plazo de la locación será de x meses, iniciando el día {{fechaCheckIn}} y finalizando el día {{fechaCheckOut}}.
Cualquier renovación deberá pactarse por escrito.

3. Precio y forma de pago
El precio mensual de la locación será de {{moneda}}{{monto}} ({{montoEnLetras}} {{monedaNombre}} ), pagadero por mes adelantado entre los días 1 y 5 de cada mes, mediante [transferencia bancaria / efectivo / otro medio] a la cuenta o medio indicado por el LOCADOR.

4. Actualización del precio (ICL – BCRA)
El precio de la locación se actualizará de manera trimestral utilizando el Índice de Contratos de Locación (ICL) publicado por el Banco Central de la República Argentina (BCRA), o el índice que en el futuro lo reemplace oficialmente.

La actualización se realizará aplicando la variación acumulada del índice entre el mes de inicio del período que se actualiza y el mes en que corresponda efectuar el ajuste.

El LOCADOR notificará al LOCATARIO el nuevo valor del alquiler con al menos 10 días de anticipación al inicio del período actualizado.
En caso de que el índice dejara de publicarse, las partes acuerdan utilizar el último valor disponible y, de ser necesario, reemplazarlo por un índice oficial de características similares.

5. Depósito en garantía
El LOCATARIO entrega en este acto la suma de {{monedaGarantia}}{{montoGarantia}} en concepto de depósito en garantía, equivalente a [1 mes / 2 meses] de alquiler.
El depósito será devuelto al finalizar la locación, una vez verificado el estado del inmueble y descontados, en su caso, importes por daños imputables al LOCATARIO.

6. Servicios e impuestos
Serán a cargo del LOCATARIO: luz, gas, agua, internet, expensas ordinarias y cualquier servicio que contrate.

Serán a cargo del LOCADOR: impuesto inmobiliario, tasas municipales y expensas extraordinarias.

7. Conservación y mejoras
El LOCATARIO se obliga a mantener el inmueble en buen estado.
Las reparaciones por mal uso serán a su cargo.
Las mejoras no reclamables deberán ser autorizadas por escrito por el LOCADOR.

8. Prohibiciones
El LOCATARIO no podrá:
Subalquilar o ceder la locación sin autorización escrita.
Realizar actividades comerciales o contrarias al destino de vivienda.
Tener animales que generen daños o molestias sin autorización del LOCADOR (opcional).

9. Estado del inmueble
Al finalizar la locación, el LOCATARIO deberá restituir el inmueble en condiciones similares a las recibidas, salvo el desgaste normal por uso.

10. Resolución anticipada
El LOCATARIO podrá rescindir el contrato luego de transcurridos 6 meses, notificando con 30 días de anticipación.
Podrá corresponder una penalidad conforme al Código Civil y Comercial, según el tiempo restante del contrato.

11. Garantía
El LOCATARIO presenta como garantía:
[Garantía propietaria / seguro de caución / recibos de sueldo / otra], cuyos datos se adjuntan como Anexo I.

12. Notificaciones
Toda notificación será válida si se realiza en los domicilios constituidos por las partes o por medios electrónicos previamente informados.

13. Jurisdicción
Para cualquier controversia, las partes se someten a los tribunales ordinarios de [Ciudad/Provincia].`
  }
];

export const EMAIL_TEMPLATES = [
  {
    name: 'Recepción de garantía',
    subject: 'Garantía recibida - {{propiedad.nombre}}',
    body: `Hola {{inquilino.nombre}},
Confirmamos que hemos recibido el depósito de garantía para tu reserva en {{propiedad.nombre}}.
Fecha: {{fechaGarantiaRecibida}}
Monto recibido: {{montoGarantia}}

Este depósito será reembolsado al finalizar tu estancia, sujeto a la inspección de la propiedad.
¡Gracias!
Saludos.`
  },
  {
    name: 'Confirmación de pago',
    subject: 'Confirmación de pago - {{propiedad.nombre}}',
    body: `Hola {{inquilino.nombre}},

Te escribimos para confirmar que hemos recibido tu pago para la reserva en {{propiedad.nombre}}.

Detalles de la reserva:
Check-in: {{fechaCheckIn}}
Check-out: {{fechaCheckOut}}
Monto total: {{montoReserva}}

Detalles del pago realizado:
Fecha de pago: {{fechaPago}}
Monto abonado: {{montoPago}}

SALDO PENDIENTE: {{saldoReserva}}
¡Muchas gracias por tu pago!
Saludos.`
  },
  {
    name: 'Mail Previo al Ingreso',
    subject: 'Recordatorio de ingreso - {{propiedad.nombre}}',
    body: `Hola  {{inquilino.nombre}}

¡Ya falta muy poco para tu ingreso!
Queremos dejarte algunos recordatorios y recomendaciones para que todo salga como lo venís planeando.

Detalles de la reserva:
Check-in: {{fechaCheckIn}}
Check-out: {{fechaCheckOut}}
Monto total: {{montoReserva}}
SALDO PENDIENTE: {{saldoReserva}}

En la casa encontrarás todo lo que necesitás para la cocina: vajilla, cubiertos, fuentes, ensaladeras, ollas e implementos para cocinar. También encontraras, los elementos para la parrilla.  
Tu alquiler incluye 1 (una) hora de limpieza semanal.
Recordá llevar ropa de cama, sábanas y toallas, ya que estos elementos no están incluidos.

Datos para acceder a Internet:  
Red: <nombre de la red>
Clave de Wifi: <ingresá la clave>
Te enviaremos por WhatsApp la ubicación en Google Maps, para que la tengas a mano.
¡Esperamos, que tengan un lindo viaje y disfruten de sus vacaciones!
Gracias por elegirnos.`
  }
];

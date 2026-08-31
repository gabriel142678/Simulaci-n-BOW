const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Definición de bloques por Zona para Pindo y Sayo
const ZONAS_CONFIG = {
  "Zona 1": {
    pindo: ["Bloque azul de 2 pines", "Bloque amarillo de 2 pines", "2 bloques Blanco de 1 pines"],
    sayo: ["1 bloque blanco de 1 pines", "1 bloque rojo de 4 pines", "1 bloque azul de 6 pines", "1 bloque verde de 8 pines"]
  },
  "Zona 2": {
    pindo: ["1 bloque verde de 6 pines", "1 bloque amarillo de 6 pines", "1 bloque azul de 8 pines"],
    sayo: ["1 bloque rojo de 6 pines", "1 bloque azul de 4 pines", "1 bloque amarillo de 8 pines"]
  },
  "Zona 3": {
    pindo: ["1 bloque blanco de 1 pines", "1 bloque rojo de 2 pines", "1 bloque azul de 2 pines", "1 bloque rojo de 8 pines"],
    sayo: ["2 bloques blancos de 1 pines", "1 bloque rojo de 2 pines", "1 bloque verde de 4 pines", "1 bloque amarillo de 4 pines"]
  },
  "Zona 4": {
    pindo: ["1 bloque rojo de 4 pines", "1 bloque azul de 4 pines", "1 bloque verde de 4 pines"],
    sayo: ["1 bloque amarillo de 2 pines", "1 bloque verde de 2 pines", "1 bloque azul de 2 pines"]
  }
};

let pedidos = [];
let contadorPedidos = 1;

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar historial de pedidos al conectar
  socket.emit('cargar_pedidos_iniciales', pedidos);

  // Evento cuando Almacén crea un pedido
  socket.on('nuevo_pedido', (datos) => {
    let detalleBloques = [];
    
    if (datos.zona && ZONAS_CONFIG[datos.zona]) {
      const config = ZONAS_CONFIG[datos.zona];
      if (parseInt(datos.pindo) > 0) {
        detalleBloques.push({ producto: "PINDO", bloques: config.pindo });
      }
      if (parseInt(datos.sanyo) > 0) {
        detalleBloques.push({ producto: "SAYO", bloques: config.sayo });
      }
    }

    const nuevoPedido = {
      id: contadorPedidos++,
      pindo: datos.pindo || 0,
      sanyo: datos.sanyo || 0,
      zona: datos.zona || "Personalizado",
      bloques: detalleBloques,
      estado: 'Pendiente' // Estados: 'Pendiente' -> 'Recibido' -> 'En Camino'
    };

    pedidos.push(nuevoPedido);

    // Notificar a Proveedor y Almacén
    io.emit('nuevo_pedido_proveedor', nuevoPedido);
    socket.emit('orden_confirmada_almacen', nuevoPedido);
  });

  // Evento 1 del Proveedor: Marcar como RECIBIDO
  socket.on('pedido_recibido', (idOrden) => {
    const orden = pedidos.find(p => p.id === idOrden);
    if (orden) {
      orden.estado = 'Recibido';
      io.emit('orden_recibida_almacen', idOrden);
      io.emit('orden_recibida_proveedor', idOrden);
    }
  });

  // Evento 2 del Proveedor: Marcar como EN CAMINO / DESPACHADO
  socket.on('despachar_pedido', (idOrden) => {
    const orden = pedidos.find(p => p.id === idOrden);
    if (orden) {
      orden.estado = 'En Camino';
      io.emit('orden_despachada_almacen', idOrden);
      io.emit('orden_despachada_proveedor', idOrden);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});

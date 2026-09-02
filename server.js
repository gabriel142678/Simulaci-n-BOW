const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Estado global en memoria
let pedidos = [];
let contadorPedidos = 1;
let inventarioSobrante = {}; // { codigoPieza: cantidad }

// Catálogo maestro de piezas
const CATALOGO_PIEZAS = [
  { codigo: "P-R6", descripcion: "Bloque 6 Pines - Rojo", color: "Rojo", pines: 6 },
  { codigo: "P-R8", descripcion: "Bloque 8 Pines - Rojo", color: "Rojo", pines: 8 },
  { codigo: "P-A4", descripcion: "Bloque 4 Pines - Azul", color: "Azul", pines: 4 },
  { codigo: "P-A6", descripcion: "Bloque 6 Pines - Azul", color: "Azul", pines: 6 },
  { codigo: "P-V8", descripcion: "Bloque 8 Pines - Verde", color: "Verde", pines: 8 },
  { codigo: "P-N2", descripcion: "Bloque 2 Pines - Negro", color: "Negro", pines: 2 }
];

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar datos iniciales
  socket.emit('cargar_catalogo', CATALOGO_PIEZAS);
  socket.emit('cargar_pedidos_iniciales', pedidos);
  socket.emit('actualizar_sobrantes', inventarioSobrante);

  // 1. Crear nuevo pedido personalizado
  socket.on('nuevo_pedido_custom', (datos) => {
    // datos = { piezas: [{ codigo, descripcion, cantidad }], esReposicion: bool, ordenRef: string }
    
    let piezasProcesadas = [];
    let totalPiezas = 0;

    datos.piezas.forEach(item => {
      let cantPedida = parseInt(item.cantidad) || 0;
      let cantDescontada = 0;

      // Aplicar descuento si hay stock sobrante en Almacén
      if (inventarioSobrante[item.codigo] && inventarioSobrante[item.codigo] > 0) {
        if (inventarioSobrante[item.codigo] >= cantPedida) {
          cantDescontada = cantPedida;
          inventarioSobrante[item.codigo] -= cantPedida;
        } else {
          cantDescontada = inventarioSobrante[item.codigo];
          inventarioSobrante[item.codigo] = 0;
        }
      }

      let cantEnviarProveedor = cantPedida - cantDescontada;
      totalPiezas += cantEnviarProveedor;

      piezasProcesadas.push({
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidadOriginal: cantPedida,
        cantidadDescontada: cantDescontada,
        cantidadTotal: cantEnviarProveedor
      });
    });

    const nuevoPedido = {
      id: contadorPedidos++,
      piezas: piezasProcesadas,
      totalPiezas: totalPiezas,
      estado: 'Pendiente',
      esReposicion: datos.esReposicion || false,
      ordenRef: datos.ordenRef || null,
      fecha: new Date().toLocaleTimeString()
    };

    // Si es reposición, va AL INICIO de la lista (Prioridad Máxima)
    if (nuevoPedido.esReposicion) {
      pedidos.unshift(nuevoPedido);
    } else {
      pedidos.push(nuevoPedido);
    }

    io.emit('nuevo_pedido_proveedor', nuevoPedido);
    io.emit('actualizar_sobrantes', inventarioSobrante);
    io.emit('actualizar_lista_pedidos', pedidos);
  });

  // 2. Registrar pieza sobrante/equivocada en Almacén
  socket.on('registrar_sobrante', (datos) => {
    const { codigo, cantidad } = datos;
    const cant = parseInt(cantidad) || 0;
    
    if (cant > 0) {
      inventarioSobrante[codigo] = (inventarioSobrante[codigo] || 0) + cant;
      io.emit('actualizar_sobrantes', inventarioSobrante);
    }
  });

  // 3. Confirmar Recibido (Proveedor)
  socket.on('pedido_recibido', (id) => {
    const orden = pedidos.find(p => p.id === id);
    if (orden) {
      orden.estado = 'Recibido';
      io.emit('orden_recibida_proveedor', id);
      io.emit('actualizar_lista_pedidos', pedidos);
    }
  });

  // 4. Despachar Pedido (Proveedor)
  socket.on('despachar_pedido', (id) => {
    const orden = pedidos.find(p => p.id === id);
    if (orden) {
      orden.estado = 'En Camino';
      io.emit('orden_despachada_proveedor', id);
      io.emit('actualizar_lista_pedidos', pedidos);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));

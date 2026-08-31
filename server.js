const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Catálogo maestro de piezas según la tabla de referencia
const CATALOGO_PIEZAS = {
  "PZA-BLA-01": { codigo: "PZA-BLA-01", color: "Blanco", pines: "1 Pin", descripcion: "Bloque Blanco 1 Pin" },
  "PZA-ROJ-02": { codigo: "PZA-ROJ-02", color: "Rojo", pines: "2 Pines", descripcion: "Bloque Rojo 2 Pines" },
  "PZA-ROJ-04": { codigo: "PZA-ROJ-04", color: "Rojo", pines: "4 Pines", descripcion: "Bloque Rojo 4 Pines" },
  "PZA-ROJ-06": { codigo: "PZA-ROJ-06", color: "Rojo", pines: "6 Pines", descripcion: "Bloque Rojo 6 Pines" },
  "PZA-ROJ-08": { codigo: "PZA-ROJ-08", color: "Rojo", pines: "8 Pines", descripcion: "Bloque Rojo 8 Pines" },
  "PZA-AZU-02": { codigo: "PZA-AZU-02", color: "Azul", pines: "2 Pines", descripcion: "Bloque Azul 2 Pines" },
  "PZA-AZU-04": { codigo: "PZA-AZU-04", color: "Azul", pines: "4 Pines", descripcion: "Bloque Azul 4 Pines" },
  "PZA-AZU-06": { codigo: "PZA-AZU-06", color: "Azul", pines: "6 Pines", descripcion: "Bloque Azul 6 Pines" },
  "PZA-AZU-08": { codigo: "PZA-AZU-08", color: "Azul", pines: "8 Pines", descripcion: "Bloque Azul 8 Pines" },
  "PZA-AMA-02": { codigo: "PZA-AMA-02", color: "Amarillo", pines: "2 Pines", descripcion: "Bloque Amarillo 2 Pines" },
  "PZA-AMA-04": { codigo: "PZA-AMA-04", color: "Amarillo", pines: "4 Pines", descripcion: "Bloque Amarillo 4 Pines" },
  "PZA-AMA-06": { codigo: "PZA-AMA-06", color: "Amarillo", pines: "6 Pines", descripcion: "Bloque Amarillo 6 Pines" },
  "PZA-AMA-08": { codigo: "PZA-AMA-08", color: "Amarillo", pines: "8 Pines", descripcion: "Bloque Amarillo 8 Pines" },
  "PZA-VER-02": { codigo: "PZA-VER-02", color: "Verde", pines: "2 Pines", descripcion: "Bloque Verde 2 Pines" },
  "PZA-VER-04": { codigo: "PZA-VER-04", color: "Verde", pines: "4 Pines", descripcion: "Bloque Verde 4 Pines" },
  "PZA-VER-06": { codigo: "PZA-VER-06", color: "Verde", pines: "6 Pines", descripcion: "Bloque Verde 6 Pines" },
  "PZA-VER-08": { codigo: "PZA-VER-08", color: "Verde", pines: "8 Pines", descripcion: "Bloque Verde 8 Pines" }
};

// Composición base por producto (Pedido Normal)
const COMPOSICION_BASE = {
  pindo: [
    { codigo: "PZA-AZU-02", cant: 1 },
    { codigo: "PZA-AMA-02", cant: 1 },
    { codigo: "PZA-BLA-01", cant: 2 }
  ],
  sanyo: [
    { codigo: "PZA-BLA-01", cant: 1 },
    { codigo: "PZA-ROJ-04", cant: 1 },
    { codigo: "PZA-AZU-06", cant: 1 },
    { codigo: "PZA-VER-08", cant: 1 }
  ]
};

// Definición de piezas por Zona
const ZONAS_PIEZAS = {
  "Zona 1": {
    pindo: [
      { codigo: "PZA-AZU-02", cant: 1 },
      { codigo: "PZA-AMA-02", cant: 1 },
      { codigo: "PZA-BLA-01", cant: 2 }
    ],
    sanyo: [
      { codigo: "PZA-BLA-01", cant: 1 },
      { codigo: "PZA-ROJ-04", cant: 1 },
      { codigo: "PZA-AZU-06", cant: 1 },
      { codigo: "PZA-VER-08", cant: 1 }
    ]
  },
  "Zona 2": {
    pindo: [
      { codigo: "PZA-VER-06", cant: 1 },
      { codigo: "PZA-AMA-06", cant: 1 },
      { codigo: "PZA-AZU-08", cant: 1 }
    ],
    sanyo: [
      { codigo: "PZA-ROJ-06", cant: 1 },
      { codigo: "PZA-AZU-04", cant: 1 },
      { codigo: "PZA-AMA-08", cant: 1 }
    ]
  },
  "Zona 3": {
    pindo: [
      { codigo: "PZA-BLA-01", cant: 1 },
      { codigo: "PZA-ROJ-02", cant: 1 },
      { codigo: "PZA-AZU-02", cant: 1 },
      { codigo: "PZA-ROJ-08", cant: 1 }
    ],
    sanyo: [
      { codigo: "PZA-BLA-01", cant: 2 },
      { codigo: "PZA-ROJ-02", cant: 1 },
      { codigo: "PZA-VER-04", cant: 1 },
      { codigo: "PZA-AMA-04", cant: 1 }
    ]
  },
  "Zona 4": {
    pindo: [
      { codigo: "PZA-ROJ-04", cant: 1 },
      { codigo: "PZA-AZU-04", cant: 1 },
      { codigo: "PZA-VER-04", cant: 1 }
    ],
    sanyo: [
      { codigo: "PZA-AMA-02", cant: 1 },
      { codigo: "PZA-VER-02", cant: 1 },
      { codigo: "PZA-AZU-02", cant: 1 }
    ]
  }
};

function calcularTablaProveedor(pindoCant, sanyoCant, zona) {
  const mapaPiezas = {};
  const fuenteConfig = (zona !== "Pedido Normal" && ZONAS_PIEZAS[zona]) ? ZONAS_PIEZAS[zona] : COMPOSICION_BASE;

  if (pindoCant > 0 && fuenteConfig.pindo) {
    fuenteConfig.pindo.forEach(item => {
      mapaPiezas[item.codigo] = (mapaPiezas[item.codigo] || 0) + (item.cant * pindoCant);
    });
  }

  if (sanyoCant > 0 && fuenteConfig.sanyo) {
    fuenteConfig.sanyo.forEach(item => {
      mapaPiezas[item.codigo] = (mapaPiezas[item.codigo] || 0) + (item.cant * sanyoCant);
    });
  }

  let totalGeneral = 0;
  const listaPiezas = Object.keys(mapaPiezas).map(cod => {
    const info = CATALOGO_PIEZAS[cod] || { codigo: cod, color: "N/A", pines: "N/A", descripcion: cod };
    const cantidad = mapaPiezas[cod];
    totalGeneral += cantidad;
    return {
      codigo: info.codigo,
      color: info.color,
      pines: info.pines,
      descripcion: info.descripcion,
      cantidadTotal: cantidad
    };
  });

  return { listaPiezas, totalGeneral };
}

let pedidos = [];
let contadorPedidos = 1;

io.on('connection', (socket) => {
  socket.emit('cargar_pedidos_iniciales', pedidos);

  socket.on('nuevo_pedido', (datos) => {
    const cantPindo = parseInt(datos.pindo) || 0;
    const cantSanyo = parseInt(datos.sanyo) || 0;
    const zona = datos.zona || "Pedido Normal";

    const { listaPiezas, totalGeneral } = calcularTablaProveedor(cantPindo, cantSanyo, zona);

    const nuevoPedido = {
      id: contadorPedidos++,
      pindo: cantPindo,
      sanyo: cantSanyo,
      zona: zona,
      piezas: listaPiezas,
      totalPiezas: totalGeneral,
      estado: 'Pendiente'
    };

    pedidos.push(nuevoPedido);

    io.emit('nuevo_pedido_proveedor', nuevoPedido);
    socket.emit('orden_confirmada_almacen', nuevoPedido);
  });

  socket.on('pedido_recibido', (idOrden) => {
    const orden = pedidos.find(p => p.id === idOrden);
    if (orden) {
      orden.estado = 'Recibido';
      io.emit('orden_recibida_almacen', idOrden);
      io.emit('orden_recibida_proveedor', idOrden);
    }
  });

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

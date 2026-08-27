const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Lista de Materiales (BOM)
const bom = [
  { codigo: "PZA-BLA-01", desc: "Bloque Blanco 1 Pin", pindo: 3, sanyo: 3 },
  { codigo: "PZA-ROJ-02", desc: "Bloque Rojo 2 Pines", pindo: 1, sanyo: 1 },
  { codigo: "PZA-ROJ-04", desc: "Bloque Rojo 4 Pines", pindo: 1, sanyo: 1 },
  { codigo: "PZA-ROJ-06", desc: "Bloque Rojo 6 Pines", pindo: 0, sanyo: 1 },
  { codigo: "PZA-ROJ-08", desc: "Bloque Rojo 8 Pines", pindo: 1, sanyo: 0 },
  { codigo: "PZA-AZU-02", desc: "Bloque Azul 2 Pines", pindo: 2, sanyo: 1 },
  { codigo: "PZA-AZU-04", desc: "Bloque Azul 4 Pines", pindo: 1, sanyo: 1 },
  { codigo: "PZA-AZU-06", desc: "Bloque Azul 6 Pines", pindo: 0, sanyo: 1 },
  { codigo: "PZA-AZU-08", desc: "Bloque Azul 8 Pines", pindo: 1, sanyo: 0 },
  { codigo: "PZA-AMA-02", desc: "Bloque Amarillo 2 Pines", pindo: 1, sanyo: 1 },
  { codigo: "PZA-AMA-04", desc: "Bloque Amarillo 4 Pines", pindo: 0, sanyo: 1 },
  { codigo: "PZA-AMA-06", desc: "Bloque Amarillo 6 Pines", pindo: 1, sanyo: 0 },
  { codigo: "PZA-AMA-08", desc: "Bloque Amarillo 8 Pines", pindo: 0, sanyo: 1 },
  { codigo: "PZA-VER-02", desc: "Bloque Verde 2 Pines", pindo: 0, sanyo: 1 },
  { codigo: "PZA-VER-04", desc: "Bloque Verde 4 Pines", pindo: 1, sanyo: 1 },
  { codigo: "PZA-VER-06", desc: "Bloque Verde 6 Pines", pindo: 1, sanyo: 0 },
  { codigo: "PZA-VER-08", desc: "Bloque Verde 8 Pines", pindo: 0, sanyo: 1 }
];

let numeroOrden = 1;

io.on('connection', (socket) => {
  socket.on('nuevo_pedido', (datos) => {
    const pindo = parseInt(datos.pindo) || 0;
    const sanyo = parseInt(datos.sanyo) || 0;
    
    let totalPiezasOrden = 0;
    const componentesCalculados = [];

    bom.forEach((item) => {
      const cantRequerida = (item.pindo * pindo) + (item.sanyo * sanyo);
      if (cantRequerida > 0) {
        totalPiezasOrden += cantRequerida;
        componentesCalculados.push({
          codigo: item.codigo,
          descripcion: item.desc,
          cantidad: cantRequerida
        });
      }
    });

    const ordenProcesada = {
      id: numeroOrden++,
      fecha: new Date().toLocaleTimeString(),
      pindo,
      sanyo,
      totalPiezas: totalPiezasOrden,
      items: componentesCalculados
    };

    io.emit('orden_proveedor', ordenProcesada);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});

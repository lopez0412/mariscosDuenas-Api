const express = require('express');
const router = express.Router();
const Venta = require('../model/ventas'); // Asegúrate de ajustar la ruta según tu estructura de archivos
const Producto = require('../model/productos'); // Importar el modelo de Producto


// Crear una nueva venta
router.post('/ventas', async (req, res) => {
  try {
    const { productos, cliente_id } = req.body; // Recibiendo productos y cliente_id

    // Validar que los campos requeridos no estén vacíos
    if (!productos || !cliente_id) {
      return res.status(400).json({ message: 'Los productos y el cliente ID son requeridos' });
    }

    // Calcular el total de la venta
    let totalVenta = 0;

    for (const { producto_id, entrada_id, cantidad, precio_venta } of productos) {
      // Buscar el producto correspondiente a la entrada
      const producto = await Producto.findById(producto_id);
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      // Verificar que haya suficiente cantidad en la entrada
      const entrada = producto.entradas.find(e => e._id.toString() === entrada_id);
      if (!entrada) {
        return res.status(404).json({ message: `Entrada no encontrada para ID: ${entrada_id}` });
      }
      if (cantidad > entrada.cantidad) {
        return res.status(400).json({ message: 'No hay suficiente cantidad en la entrada para realizar la venta ' + entrada });
      }

      // Calcular el total de cada producto y acumularlo
      totalVenta += cantidad * precio_venta;

      // Restar la cantidad vendida de la entrada del producto
      entrada.cantidad -= cantidad;

      // Agregar una salida al producto
      producto.salidas.push({
        cantidad,
        precio_venta,
        fecha: new Date(),
        cliente_id,
        razon: 'Venta realizada'
      });

      await producto.save(); // Guardar los cambios en el producto
    }

    // Crear la nueva venta con todos los productos
    const nuevaVenta = new Venta({
      productos,
      total: totalVenta,
      pagos: [], // Asumiendo que los pagos se envían en otro lugar
      cliente_id
    });

    const ventaGuardada = await nuevaVenta.save();

    res.status(201).json(ventaGuardada);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la venta', error });
  }
});

// Obtener todas las ventas
router.get('/ventas', async (req, res) => {
  try {
    const ventas = await Venta.find(); // Poblamos la referencia a Productos
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las ventas', error });
  }
});

// Obtener una venta por ID
router.get('/ventas/:id', async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id).populate('productos.producto_id');
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la venta', error });
  }
});

// Filtrar ventas por rango de fechas
router.get('/ventasReport/rango-fechas', async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  // Validar fechas
  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: 'Se requieren ambas fechas: fechaInicio y fechaFin' });
  }

  const fechaInicioDate = new Date(fechaInicio);
  const fechaFinDate = new Date(fechaFin);

  if (isNaN(fechaInicioDate) || isNaN(fechaFinDate)) {
    return res.status(400).json({ message: 'Fechas inválidas' });
  }

  try {
    // Consulta con filtro por fecha y populate del cliente
    const ventas = await Venta.find({
      fecha_venta: {
        $gte: fechaInicioDate,
        $lte: fechaFinDate
      }
    }).populate('cliente_id'); // Agregar populate para el cliente

    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al obtener las ventas:', error);
    res.status(500).json({ message: 'Error al obtener las ventas', error });
  }
});

// Ruta para obtener ventas PENDIENTES por ID de cliente
router.get('/ventas/pendientes/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;

    // Buscar ventas pendientes para el cliente especificado
    const ventasPendientes = await Venta.find({
      cliente_id: clienteId,
      estado: 'PENDIENTE'
    }).populate('productos.producto_id', 'nombre'); // Agregar populate para el producto

    res.status(200).json(ventasPendientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las ventas pendientes', error });
  }
});

// Actualizar una venta
router.put('/ventas/:id', async (req, res) => {
  try {
    const { productos, pagos } = req.body;
    const total = productos.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0); // Calcular el total

    const ventaActualizada = await Venta.findByIdAndUpdate(
      req.params.id,
      { productos, total, pagos }, // Incluir el total en la actualización
      { new: true }
    );

    if (!ventaActualizada) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.status(200).json(ventaActualizada);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la venta', error });
  }
});

// Ruta para agregar un pago a una venta y actualizar su estado
router.put('/ventas/:id/pago', async (req, res) => {
  try {
    const { monto } = req.body;

    if (monto === undefined) {
      return res.status(400).json({ message: 'El monto del pago es requerido' });
    }

    const venta = await Venta.findById(req.params.id);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Agregar el nuevo pago
    venta.pagos.push({ monto });

    // Verificar si el total de pagos cubre el precio de venta
    const totalPagos = venta.pagos.reduce((acc, pago) => acc + pago.monto, 0);
    if (totalPagos >= venta.total) {
      venta.estado = 'COMPLETADA'; // Cambiar el estado a completada si ya se pagó el total
    }

    const ventaActualizada = await venta.save();
    res.status(200).json(ventaActualizada);
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar el pago a la venta', error });
  }
});

// Eliminar una venta
router.delete('/ventas/:id', async (req, res) => {
  try {
    const ventaEliminada = await Venta.findByIdAndDelete(req.params.id);
    if (!ventaEliminada) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.status(200).json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la venta', error });
  }
});

module.exports = router;

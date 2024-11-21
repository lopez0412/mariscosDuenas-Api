const express = require('express');
const router = express.Router();
const Venta = require('../model/ventas'); // Asegúrate de ajustar la ruta según tu estructura de archivos
const Producto = require('../model/productos'); // Importar el modelo de Producto

// Ruta para crear múltiples ventas
router.post('/ventas/multiple', async (req, res) => {
  try {
    const { ventas } = req.body; // Se espera un array de ventas

    // Validar que el array de ventas no esté vacío
    if (!Array.isArray(ventas) || ventas.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de ventas' });
    }

    const ventasGuardadas = [];

    for (const ventaData of ventas) {
      const { producto_id, entrada_id, cantidad, precio_venta, pagos, cliente_id } = ventaData; // Recibiendo entrada_id y cliente_id

      // Validar que los campos requeridos no estén vacíos
      if (!producto_id || !entrada_id || cantidad === undefined || precio_venta === undefined || !cliente_id) {
        return res.status(400).json({ message: 'Producto ID, Entrada ID, cantidad, precio de venta y cliente ID son requeridos para cada venta' });
      }

      // Buscar el producto correspondiente a la entrada
      const producto = await Producto.findById(producto_id);
      if (!producto) {
        return res.status(404).json({ message: `Producto no encontrado para ID: ${producto_id}` });
      }

      // Verificar que haya suficiente cantidad en las entradas
      const entrada = producto.entradas.find(e => e._id.toString() === entrada_id);
      if (!entrada) {
        return res.status(404).json({ message: `Entrada no encontrada para ID: ${entrada_id}` });
      }
      if (cantidad > entrada.cantidad) {
        return res.status(400).json({ message: `No hay suficiente cantidad en la entrada para realizar la venta de ${cantidad} unidades del producto ${producto_id}` });
      }

      // Calcular el total de la venta
      const total = cantidad * precio_venta;

      // Crear la nueva venta
      const nuevaVenta = new Venta({
        producto_id,
        entrada_id, // Guardar entrada_id
        cantidad,
        precio_venta,
        total, // Agregar el total calculado
        pagos,
        cliente_id // Agregar el ID del cliente a la venta
      });

      // Restar la cantidad vendida de la entrada del producto
      entrada.cantidad -= cantidad;

      // Agregar una salida al producto
      producto.salidas.push({
        cantidad,
        precio_venta,
        fecha: new Date(),
        cliente_id, // Agregar el ID del cliente a la salida
        razon: 'Venta realizada'
      });

      await producto.save(); // Guardar los cambios en el producto
      const ventaGuardada = await nuevaVenta.save();
      ventasGuardadas.push(ventaGuardada);
    }

    res.status(201).json(ventasGuardadas);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear las ventas', error });
  }
});

// Crear una nueva venta
router.post('/ventas', async (req, res) => {
  try {
    const { producto_id, entrada_id, cantidad, precio_venta, pagos, cliente_id } = req.body; // Recibiendo entrada_id y cliente_id

    // Validar que los campos requeridos no estén vacíos
    if (!producto_id || !entrada_id || cantidad === undefined || precio_venta === undefined || !cliente_id) {
      return res.status(400).json({ message: 'Producto ID, Entrada ID, cantidad, precio de venta y cliente ID son requeridos' });
    }

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
      return res.status(400).json({ message: 'No hay suficiente cantidad en la entrada para realizar la venta' });
    }

    // Calcular el total de la venta
    const total = cantidad * precio_venta;

    // Crear la nueva venta
    const nuevaVenta = new Venta({
      producto_id,
      entrada_id, // Guardar entrada_id
      cantidad,
      precio_venta,
      total, // Agregar el total calculado
      pagos,
      cliente_id // Agregar el ID del cliente a la venta
    });

    // Restar la cantidad vendida de la entrada del producto
    entrada.cantidad -= cantidad;

    // Agregar una salida al producto
    producto.salidas.push({
      cantidad,
      precio_venta,
      fecha: new Date(),
      cliente_id, // Agregar el ID del cliente a la salida
      razon: 'Venta realizada'
    });

    await producto.save(); // Guardar los cambios en el producto
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
    const venta = await Venta.findById(req.params.id).populate('producto_id');
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
    // Consulta con filtro por fecha
    const ventas = await Venta.find({
      fecha_venta: {
        $gte: fechaInicioDate,
        $lte: fechaFinDate
      }
    });

    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al obtener las ventas:', error);
    res.status(500).json({ message: 'Error al obtener las ventas', error });
  }
});

// Actualizar una venta
router.put('/ventas/:id', async (req, res) => {
  try {
    const { cantidad, precio_venta, pagos } = req.body;
    const total = cantidad * precio_venta; // Calcular el total

    const ventaActualizada = await Venta.findByIdAndUpdate(
      req.params.id,
      { cantidad, precio_venta, total, pagos }, // Incluir el total en la actualización
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
    if (totalPagos >= venta.precio_venta) {
      venta.estado = 'completada'; // Cambiar el estado a completada si ya se pagó el total
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

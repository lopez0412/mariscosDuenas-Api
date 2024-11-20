const express = require('express');
const router = express.Router();
const Producto = require('../model/productos'); // Asegúrate de ajustar la ruta

// Crear un nuevo producto
router.post('/productos', async (req, res) => {
  try {
    const { nombre, fecha_creacion, unidad_medida } = req.body; // Agregado precio_actual

    // Validar que los campos requeridos no estén vacíos
    if (!nombre || !unidad_medida === undefined) { // Modificado para incluir precio_actual
      return res.status(400).json({ message: 'Nombre y unidad de medida son requeridos' });
    }

    const nuevoProducto = new Producto({
      nombre,
      fecha_creacion: fecha_creacion || Date.now(), // Asignar fecha de creación si no se proporciona
      unidad_medida,
    });

    const productoGuardado = await nuevoProducto.save();
    res.status(201).json(productoGuardado);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el producto', error });
  }
});

// Ruta para obtener todos los productos con datos generales y suma de entradas
router.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.find(); // Obtener todos los productos

    // Sumar la existencia de las entradas
    const productosConEntradas = productos.map(producto => {
      const totalEntradas = producto.entradas.reduce((sum, entrada) => {
        return sum + (entrada.cantidad > 0 ? entrada.cantidad : 0);
      }, 0);
      return { 
        _id: producto._id,
        nombre: producto.nombre, 
        fecha_creacion: producto.fecha_creacion, 
        unidad_medida: producto.unidad_medida, 
        totalEntradas 
      }; // Agregar el total de entradas al producto
    });

    res.status(200).json(productosConEntradas);
  } catch (error) {
    console.error(error); // Agregado para registrar el error en la consola
    res.status(500).json({ message: 'Error al obtener los productos', error });
  }
});

// Ruta para crear una nueva entrada
router.post('/productos/:id/entradas', async (req, res) => {
  try {
    const { cantidad, precio_compra, precio_venta } = req.body;

    // Validar que los campos requeridos no estén vacíos
    if (cantidad === undefined || precio_compra === undefined || precio_venta === undefined) {
      return res.status(400).json({ message: 'Cantidad, precio de compra y precio de venta son requeridos' });
    }

    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Agregar la nueva entrada al producto
    producto.entradas.push({ cantidad, precio_compra, precio_venta });
    await producto.save();

    res.status(201).json({ message: 'Entrada creada exitosamente', producto });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la entrada', error });
  }
});

// Ruta para crear una nueva salida
router.post('/productos/:id/salidas', async (req, res) => {
  try {
    const { cantidad, razon, id_entrada } = req.body; // Agregado campo id_entrada

    // Validar que los campos requeridos no estén vacíos
    if (cantidad === undefined ||  !razon || !id_entrada) {
      return res.status(400).json({ message: 'Cantidad, precio de venta, cliente, razón e id de entrada son requeridos' });
    }

    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Buscar la entrada correspondiente por id_entrada
    const entrada = producto.entradas.id(id_entrada);
    if (!entrada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    // Reducir la cantidad de la entrada
    if (entrada.cantidad < cantidad) {
      return res.status(400).json({ message: 'No hay suficiente cantidad en la entrada' });
    }
    entrada.cantidad -= cantidad;

    // Agregar la nueva salida al producto
    producto.salidas.push({ cantidad, fecha: new Date(), razon, id_entrada }); // Agregado campo id_entrada
    await producto.save();

    res.status(201).json({ message: 'Salida creada exitosamente', producto });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la salida', error });
  }
});

// Ruta para obtener un producto por ID
router.get('/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate('salidas.cliente_id', 'nombre'); // Populate client data
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Filtrar entradas con cantidad mayor a 0
    const entradasFiltradas = producto.entradas.filter(entrada => entrada.cantidad > 0);

    // Calcular el total de productos por la cantidad de las entradas
    const totalEntradas = entradasFiltradas.reduce((total, entrada) => total + entrada.cantidad, 0);

    // Obtener salidas recientes
    const salidasRecientes = producto.salidas.sort((a, b) => b.fecha - a.fecha);

    res.status(200).json({
      ...producto.toObject(),
      entradas: entradasFiltradas,
      totalEntradas,
      salidas: salidasRecientes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error });
  }
});

// Ruta para actualizar un producto
router.put('/productos/:id', async (req, res) => {
  try {
    const { nombre, unidad_medida } = req.body; // Agregada unidad de medida y precio_actual
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      { nombre, unidad_medida }, // Incluida unidad de medida y precio_actual
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el producto', error });
  }
});

// Ruta para eliminar un producto
router.delete('/productos/:id', async (req, res) => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!productoEliminado) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto', error });
  }
});

module.exports = router;

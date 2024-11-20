const express = require('express');
const router = express.Router();
const Cliente = require('../model/clientes'); // Asegúrate de ajustar la ruta según tu estructura de archivos

// Crear un nuevo cliente
router.post('/clientes', async (req, res) => {
  try {
    const { cliente_id, nombre, direccion, telefono, email } = req.body;

    const nuevoCliente = new Cliente({
      cliente_id,
      nombre,
      direccion,
      telefono,
      email
    });

    const clienteGuardado = await nuevoCliente.save();
    res.status(201).json(clienteGuardado);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el cliente', error });
  }
});

// Obtener todos los clientes
router.get('/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los clientes', error });
  }
});

// Obtener un cliente por ID
router.get('/clientes/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json(cliente);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el cliente', error });
  }
});

// Actualizar un cliente
router.put('/clientes/:id', async (req, res) => {
  try {
    const { nombre, direccion, telefono, email } = req.body;
    const clienteActualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      { nombre, direccion, telefono, email },
      { new: true }
    );

    if (!clienteActualizado) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el cliente', error });
  }
});

// Eliminar un cliente
router.delete('/clientes/:id', async (req, res) => {
  try {
    const clienteEliminado = await Cliente.findByIdAndDelete(req.params.id);
    if (!clienteEliminado) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el cliente', error });
  }
});

module.exports = router;

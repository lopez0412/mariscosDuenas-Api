const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entradaSchema = new mongoose.Schema({
  cantidad: { type: Number, required: true },
  precio_compra: { type: Number, required: true },
  precio_venta: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});
const salidaSchema = new mongoose.Schema({
  cantidad: { type: Number, required: true },
  precio_venta: { type: Number },
  id_entrada: {type: String},
  fecha: { type: Date, default: Date.now },
  cliente_id: { type: Schema.Types.ObjectId, ref: 'Clientes'},
  razon: { type: String, required: true } // Razón de la salida
});

// Esquema para Productos
const ProductoSchema = new Schema({
  nombre: { type: String, required: true, trim: true }, // Nombre del producto
  fecha_creacion: { type: Date, default: Date.now }, // Fecha de creación
  unidad_medida: { type: String, enum: ['lb', 'unidad', 'caja'] },
  entradas: [entradaSchema],
  salidas: [salidaSchema] 
});

// Índices para búsquedas rápidas
ProductoSchema.index({ nombre: 1 }); // Índice para búsqueda por nombre
//ProductoSchema.index({ categoria: 1 });
//ProductoSchema.index({ proveedor_id: 1 });

const Producto = mongoose.model('Productos', ProductoSchema);

module.exports = Producto;

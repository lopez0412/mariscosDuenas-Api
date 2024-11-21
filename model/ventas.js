const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para Ventas
const ventaSchema = new Schema({
  producto_id: { type: Schema.Types.ObjectId, ref: 'Productos', required: true }, // Referencia al producto
  entrada_id: { type: Schema.Types.ObjectId, ref: 'Productos', required: true }, // Referencia a la entrada del producto
  cantidad: { type: Number, required: true }, // Cantidad vendida
  precio_venta: { type: Number, required: true }, // Precio de venta de la entrada
  total: { type: Number },
  pagos: [{ 
    monto: { type: Number, required: true }, // Monto del pago
    fecha: { type: Date, default: Date.now } // Fecha del pago
  }],
  estado: { 
    type: String, 
    enum: ['pendiente', 'completada', 'cancelada'], // Estados posibles de la venta
    default: 'pendiente' 
  },
  fecha_venta: { type: Date, default: Date.now }, // Fecha de la venta
  cliente_id: { type: Schema.Types.ObjectId, ref: 'Clientes', required: true } // Referencia al cliente
});

const Venta = mongoose.model('Ventas', ventaSchema);

module.exports = Venta;

const mongoose = require('mongoose')

const clientesSchema = new mongoose.Schema({
    nombre:{
        type: String,
        required: true
    },
    direccion:{
        type: String,
        required: true
    },
    telefono:{
        type: String,
        required: true
    },
    
})

const Clientes = mongoose.model('Clientes', clientesSchema);

module.exports = Clientes;
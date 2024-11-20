require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
var cors = require('cors')
const helmet = require('helmet');
const compression = require("compression");
const userRoutes = require('./routes/users')
const clienteRoutes = require('./routes/clientes')
const productoRoutes = require('./routes/productos')
const ventasRoutes = require('./routes/ventas')



var bodyParser = require('body-parser')
const mongoString = process.env.DATABASE_URL;

// Configuración específica de HSTS
const sixtyDaysInSeconds = 31536000; // 1 año

// Set up rate limiter: maximum of twenty requests per minute
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});


mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})
const app = express();
app.use(cors())
app.use(compression()); // Compress all routes
// Apply rate limiter to all requests
app.use(limiter);

app.use(express.json());
app.use(bodyParser.urlencoded({ 
    extended: true 
}));
app.set('trust proxy', '127.0.0.1');
app.use(helmet());

    //Security Headers
    //Strict-Transport-Security
    app.use(helmet.hsts({
        maxAge: sixtyDaysInSeconds,
        includeSubDomains: true, // Incluye subdominios
        preload: true // Indica a los navegadores que preloaded HSTS
    }));
    //Content-Security-Policy
    app.use(helmet.contentSecurityPolicy({
        directives: {
        defaultSrc: ["'self'"], // Recurso predeterminado solo de la misma ubicación
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'], // Permitir scripts solo desde el mismo origen y de Google APIs
        styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos solo desde el mismo origen y estilos en línea
        objectSrc: [], // Permitir objetos solo del mismo origen
        imgSrc: ["'self'"], // Permitir imágenes solo desde el mismo origen
        fontSrc: ["'self'"], // Permitir fuentes solo desde el mismo origen
        frameSrc: ["'none'"], // No permitir iframes
        mediaSrc: ["'none'"], // No permitir medios
        connectSrc: ["'self'"], // Permitir conexiones solo desde el mismo origen
        workerSrc: ["'none'"], // No permitir workers
        frameAncestors: ["'none'"], // No permitir que el sitio sea incrustado en un iframe
        formAction: ["'self'"], // Permitir formularios solo hacia el mismo origen
        upgradeInsecureRequests: [] // Permitir actualizaciones seguras de solicitudes (HTTP a HTTPS)
        },
    }));

    // Configuración específica de X-Frame-Options
    app.use(helmet.frameguard({ action: 'sameorigin' }));
    // Configuración específica de Referrer-Policy
    app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
    // Configuración específica de Feature-Policy
    /*app.use(
        helmet.featurePolicy({
        features: {
            fullscreen: ["'self'"], // Permite el uso de la API Fullscreen solo desde el mismo origen
            geolocation: ["'none'"], // Deshabilita el uso de la API Geolocation
            microphone: ["'none'"], // Deshabilita el uso del micrófono
            camera: ["'none'"], // Deshabilita el uso de la cámara
        }
        })
    );*/
    // Configuración específica de X-XSS-Protection
    app.use(
        helmet.xssFilter({
        setOnOldIE: true // Activa la protección XSS incluso en navegadores antiguos de Internet Explorer
        })
    );

//Routes
app.use('/api',userRoutes)
app.use('/api',clienteRoutes)
app.use('/api',productoRoutes)
app.use('/api',ventasRoutes)


app.listen(3000, () => {
    console.log(`Server Started at ${3000}`)
})
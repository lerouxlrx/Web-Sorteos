const express = require('express');
const path = require('path');
const sorteoRoutes = require('./routes/sorteoRoutes');
const { create } = require('express-handlebars');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const hbs = create({
  extname: '.handlebars',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views/partials')
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/', sorteoRoutes);

// Iniciar servidor
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});



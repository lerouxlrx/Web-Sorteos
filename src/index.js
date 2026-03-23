const express = require('express');
const path = require('path');
// CORRECCIÓN: Agregamos 'src/' a la ruta
const sorteoRoutes = require('./src/routes/sorteoRoutes'); 
const { create } = require('express-handlebars');

const app = express();

// CORRECCIÓN: Estáticos están en src/public
app.use(express.static(path.join(__dirname, 'src/public')));

const hbs = create({
  extname: '.handlebars',
  // CORRECCIÓN: Layouts están en src/views/layouts
  layoutsDir: path.join(__dirname, 'src/views/layouts'),
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'src/views/partials')
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
// CORRECCIÓN: Views están en src/views
app.set('views', path.join(__dirname, 'src/views'));

app.use(express.urlencoded({ extended: true }));
app.use('/', sorteoRoutes);

const PORT = process.env.PORT || 3030; // Recomendado para Render
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});



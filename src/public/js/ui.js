console.log("JS cargado correctamente");

document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE LA PANTALLA HOME ---
    const fileInput = document.getElementById('file');
    const label = document.querySelector('.custom-file-label');
    const labelText = label ? label.querySelector('.file-label-text') : null;
    const submitBtn = document.querySelector('.btnCargar');

    // Solo ejecutamos si estamos en el Home (donde existen estos elementos)
    if (fileInput && label && submitBtn) {
      submitBtn.setAttribute('disabled', '');

      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          if (labelText) labelText.textContent = '';
          label.classList.add('selected');
          submitBtn.removeAttribute('disabled');
        } else {
          if (labelText) labelText.textContent = 'Elegir base (.xlsx)';
          label.classList.remove('selected');
          submitBtn.setAttribute('disabled', '');
        }
      });
    }

    // --- LÓGICA DE LA PANTALLA DE CONFIGURACIÓN ---
    const formConfig = document.querySelector('.contenedorFormConfigurar');
    const btnRealizar = document.querySelector('.btnRealizar');

    if (formConfig && btnRealizar) {
      let datosSorteo = null;
      console.log("Configuración detectada. Botón listo.");

      formConfig.addEventListener('submit', async (e) => {
      const textoBoton = btnRealizar.innerText.trim().toLowerCase();
            
      // PASO 1: Cargar sorteo (Pre-procesamiento)
      if (textoBoton === 'cargar sorteo') {
        e.preventDefault(); 
        console.log("Iniciando carga asíncrona...");

        btnRealizar.classList.add('loading');
        btnRealizar.innerText = 'Procesando...';

        const formData = new FormData(formConfig);
        const data = new URLSearchParams(formData);

        try {
          const response = await fetch('/confirmar-sorteo', {
              method: 'POST',
              headers: { 
                  'Accept': 'application/json',
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: data
          });

          if (!response.ok) throw new Error('Error en el servidor');
                    
          datosSorteo = await response.json();
          console.log("Ganadores guardados en memoria.");

                    // Simulación visual de la barra (3 segundos)
          setTimeout(() => {
            // Cambios de títulos y textos
            document.querySelector('.tituloConfigurar').innerText = '¡Listo para sortear!';
          
            const labels = formConfig.querySelectorAll('label');
            if (labels.length >= 2) {
                labels[0].innerText = 'Ganadores';
                labels[1].innerText = 'Suplentes';
            }
            // Estilo de los inputs bloqueados
            const inputs = formConfig.querySelectorAll('input[type="number"]');
            inputs.forEach(input => {
                input.classList.add('input-ready');
                input.readOnly = true; 
            });
            // Estado final del botón
            btnRealizar.classList.remove('loading');
            btnRealizar.classList.add('ready');
            btnRealizar.innerText = 'Realizar sorteo';
          }, 3000);
        } catch (err) {
          console.error("Error:", err);
          btnRealizar.classList.remove('loading');
          btnRealizar.innerText = 'Cargar sorteo';
          alert("Error al procesar el sorteo.");
        }
      } 
      // PASO 2: Realizar sorteo (Aquí irá el contador y confetti)
      else if (textoBoton.includes('realizar') && textoBoton.includes('sorteo')) {
        e.preventDefault();
        // 1. Crear el overlay del contador dinámicamente
        const overlay = document.createElement('div');
        overlay.id = 'countdown-overlay';
        overlay.style.display = 'flex';
        overlay.innerHTML = `<div class="countdown-number">5</div>`;
        document.body.appendChild(overlay);

        let count = 5;
        const numberDiv = overlay.querySelector('.countdown-number');

        const interval = setInterval(() => {
          count--;
          if (count > 0) {
              numberDiv.innerText = count;
          } else {
              clearInterval(interval);
              
              // --- ¡EL MOMENTO DEL CLÍMAX! ---
              
              // 2. Tirar Confetti
              dispararConfetti();

              // 3. Ocultar contador y mostrar resultados
              overlay.remove();
              mostrarResultadosFinales(datosSorteo);
          }
        }, 1000);
      }
    });
  }
});

function dispararConfetti() {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
  }, 250);
}

function mostrarResultadosFinales(datos) {
    const contenedor = document.querySelector('.contenedorConfigurar');
    
    // 1. Creamos la Pantalla de Impacto (Limpia y centrada)
    let htmlImpacto = `
        <div class="pantalla-impacto" style="text-align: center; padding: 50px 20px; animation: fadeIn 1s;">
            <h1 class="titulo" style="font-size: 4rem; color: #174791; margin-bottom: 30px;">¡Ganadores!</h1>
            
            <div class="ganadores-destacados" style="margin-bottom: 40px;">
                ${datos.participantesGanadores.map(g => `
                    <p style="font-size: 2.5rem; font-weight: bold; color: #e73329; margin: 10px 0;">
                        ${g.Nombre}
                    </p>
                `).join('')}
            </div>

            <button id="btnVerDetalle" style="background: none; border: none; color: #174791; text-decoration: underline; cursor: pointer; font-size: 1.2rem;">
                Ver resultados
            </button>
        </div>
    `;
    
    contenedor.innerHTML = htmlImpacto;

    // 2. Lógica para el botón de "Ver Resultados" (inyecta la vista completa)
    document.getElementById('btnVerDetalle').addEventListener('click', () => {
        mostrarVistaDetallada(datos, contenedor);
    });
}

function mostrarVistaDetallada(datos, contenedor) {
    // Reconstruimos la vista exacta que tenés en Handlebars
    let htmlDetalle = `
        <div class="contenedorResultado contenedor" style="animation: fadeIn 0.5s;">
            <h1 class="titulo tituloResultado">¡Ganadores!</h1>
            <ul class="listadoGanadores listadoResultado">
                ${datos.participantesGanadores.map(g => `
                    <li class="itemGanadores itemResultado">${g.Nombre} - DNI: ${g.DNI}</li>
                `).join('')}
            </ul>

            <h2 class="subtitulo subtituloResultado">Suplentes</h2>
            <ul class="listadoSuplentes listadoResultado">
                ${datos.participantesSuplentes.map(s => `
                    <li class="itemSuplentes itemResultado">${s.Nombre} - DNI: ${s.DNI}</li>
                `).join('')}
            </ul>

            <div style="text-align: center; margin-top: 30px;">
                <a class="linkPDF link" href="/resultado_sorteo.pdf" download="resultadoSorteo.pdf">Guardar PDF</a>
                <br><br>
                <button class="btn" onclick="window.location.href='/'" style="max-width: 200px; margin: 0 auto;">Volver al inicio</button>
            </div>
        </div>
    `;
    
    contenedor.innerHTML = htmlDetalle;
}
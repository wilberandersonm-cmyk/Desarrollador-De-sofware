/* =========================================================================
   RUTA::SOFTWARE — script.js
   -------------------------------------------------------------------------
   ÍNDICE DE ESTE ARCHIVO:
     1. MODO OSCURO           → guarda/lee el tema en localStorage
     2. RELOJ EN VIVO         → actualiza todos los [data-clock] cada segundo
     3. CONTADORES            → visitas / formularios descargados / unis
     4. CARRUSEL              → control de flechas y puntos del carrusel
     5. FORMULARIO → PDF/EXCEL→ genera y descarga la ficha del formulario
     6. QUIZ DE NIVEL         → califica el mini-cuestionario de nivel.html
     7. COPYRIGHT (año)       → escribe el año actual en el pie de página
   Usado por: index.html, wiki.html, demo.html, nivel.html
   ========================================================================= */

/* ---------------------- 1. MODO OSCURO ---------------------- */
(function initTheme(){
  const saved = localStorage.getItem('rs-theme');
  const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('[data-theme-toggle]');
    if(!btn) return;
    updateToggleLabel(btn);
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('rs-theme', next);
      updateToggleLabel(btn);
    });
  });

  function updateToggleLabel(btn){
    const current = document.documentElement.getAttribute('data-theme');
    btn.textContent = current === 'dark' ? '☀ modo claro' : '☾ modo oscuro';
  }
})();

/* ---------------------- 2. RELOJ EN VIVO ---------------------- */
function startClock(){
  const els = document.querySelectorAll('[data-clock]');
  if(!els.length) return;
  function tick(){
    const now = new Date();
    const fecha = now.toLocaleDateString('es-SV', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
    const hora = now.toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    els.forEach(el => { el.textContent = `${fecha} · ${hora}`; });
  }
  tick();
  setInterval(tick, 1000);
}
document.addEventListener('DOMContentLoaded', startClock);

/* ---------------------- 3. CONTADORES PERSISTENTES ---------------------- */
/* Claves usadas en localStorage:
   rs-count-visitas   -> se incrementa una vez por carga de página
   rs-count-forms     -> se incrementa cada vez que se descarga un PDF/Excel del formulario
   rs-count-unis      -> número fijo de universidades asociadas en este sitio (se puede ampliar)
*/
const RS_UNIS_ASOCIADAS = 3;

function rsIncrement(key){
  const val = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(val));
  return val;
}
function rsGet(key, fallback = 0){
  return parseInt(localStorage.getItem(key) || String(fallback), 10);
}

function renderCounters(){
  const visitas = rsIncrement('rs-count-visitas');
  const forms = rsGet('rs-count-forms', 0);

  const visitasEl = document.querySelector('[data-counter="visitas"]');
  const formsEl = document.querySelector('[data-counter="forms"]');
  const unisEl = document.querySelector('[data-counter="unis"]');

  if(visitasEl) visitasEl.textContent = visitas;
  if(formsEl) formsEl.textContent = forms;
  if(unisEl) unisEl.textContent = RS_UNIS_ASOCIADAS;
}
document.addEventListener('DOMContentLoaded', renderCounters);

function rsRegisterFormDownload(){
  const val = rsIncrement('rs-count-forms');
  const formsEl = document.querySelector('[data-counter="forms"]');
  if(formsEl) formsEl.textContent = val;
  return val;
}

/* ---------------------- 4. CARRUSEL ---------------------- */
function initCarousel(root){
  const track = root.querySelector('.carousel-track');
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const dotsWrap = root.querySelector('.carousel-dots');
  let index = 0;
  let timer = null;

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Ir a la diapositiva ${i + 1}`);
    if(i === 0) b.classList.add('active');
    b.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(b);
  });

  function goTo(i){
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    Array.from(dotsWrap.children).forEach((d, di) => d.classList.toggle('active', di === index));
  }
  function next(){ goTo(index + 1); }
  function prev(){ goTo(index - 1); }

  root.querySelector('.carousel-btn.next').addEventListener('click', () => { next(); resetTimer(); });
  root.querySelector('.carousel-btn.prev').addEventListener('click', () => { prev(); resetTimer(); });

  function resetTimer(){
    clearInterval(timer);
    timer = setInterval(next, 5500);
  }
  resetTimer();
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel').forEach(initCarousel);
});

/* ---------------------- 5. FORMULARIO -> PDF / EXCEL ---------------------- */
/* Requiere las librerías CDN cargadas en index.html:
   - jsPDF (window.jspdf.jsPDF)
   - SheetJS / xlsx (window.XLSX)
*/
function initCareerForm(){
  const form = document.querySelector('#form-perfil');
  if(!form) return;

  const btnPdf = document.querySelector('#btn-pdf');
  const btnXls = document.querySelector('#btn-xlsx');
  const statusEl = document.querySelector('#form-status');

  function readData(){
    const fd = new FormData(form);
    return {
      nombre: fd.get('nombre') || 'Sin nombre',
      email: fd.get('email') || '—',
      universidad: fd.get('universidad') || 'Sin preferencia',
      modalidad: fd.get('modalidad') || '—',
      presupuesto: fd.get('presupuesto') || '—',
      mensaje: fd.get('mensaje') || '',
      fecha: new Date().toLocaleString('es-SV'),
    };
  }

  function validate(){
    if(!form.reportValidity()) return null;
    return readData();
  }

  btnPdf.addEventListener('click', () => {
    const data = validate();
    if(!data) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('courier', 'bold');
    doc.setFontSize(16);
    doc.text('RUTA::SOFTWARE — Ficha de orientación', 14, 20);

    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    let y = 34;
    const linea = (label, value) => {
      doc.text(`${label}:`, 14, y);
      doc.text(String(value), 70, y);
      y += 9;
    };
    linea('Nombre', data.nombre);
    linea('Correo', data.email);
    linea('Universidad de interés', data.universidad);
    linea('Modalidad preferida', data.modalidad);
    linea('Presupuesto mensual', data.presupuesto);
    y += 3;
    doc.text('Mensaje:', 14, y);
    y += 7;
    const mensaje = doc.splitTextToSize(data.mensaje || '(sin mensaje)', 180);
    doc.text(mensaje, 14, y);
    y += mensaje.length * 6 + 6;

    doc.setDrawColor(150);
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(9);
    doc.text(`Generado: ${data.fecha}`, 14, y);
    doc.text('Los montos y datos de universidades son referenciales; confirma siempre en la fuente oficial.', 14, y + 6);

    doc.save(`ficha-orientacion-${data.nombre.replace(/\s+/g,'_')}.pdf`);
    rsRegisterFormDownload();
    if(statusEl) statusEl.textContent = 'PDF descargado. ¡Éxito en tu decisión!';
  });

  btnXls.addEventListener('click', () => {
    const data = validate();
    if(!data) return;

    const perfil = [
      ['Campo', 'Valor'],
      ['Nombre', data.nombre],
      ['Correo', data.email],
      ['Universidad de interés', data.universidad],
      ['Modalidad preferida', data.modalidad],
      ['Presupuesto mensual', data.presupuesto],
      ['Mensaje', data.mensaje],
      ['Fecha', data.fecha],
    ];
    const comparativo = [
      ['Universidad', 'Mensualidad aprox. (USD)', 'Duración aprox.', 'Modalidad'],
      ['Universidad de El Salvador (UES)', '15 - 40 (arancel diferenciado)', '5 años', 'Presencial'],
      ['Universidad Don Bosco (UDB)', '150 - 260', '5 años', 'Presencial / mixta'],
      ['Universidad Centroamericana "José Simeón Cañas" (UCA)', '230 - 380', '5 años', 'Presencial / mixta'],
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(perfil);
    const ws2 = XLSX.utils.aoa_to_sheet(comparativo);
    XLSX.utils.book_append_sheet(wb, ws1, 'Mi perfil');
    XLSX.utils.book_append_sheet(wb, ws2, 'Comparativo universidades');
    XLSX.writeFile(wb, `comparativo-carreras-${data.nombre.replace(/\s+/g,'_')}.xlsx`);

    rsRegisterFormDownload();
    if(statusEl) statusEl.textContent = 'Excel descargado con tu perfil y el comparativo de universidades.';
  });

  form.addEventListener('submit', (e) => e.preventDefault());
}
document.addEventListener('DOMContentLoaded', initCareerForm);

/* ---------------------- 6. QUIZ DE NIVEL DE APRENDIZAJE ---------------------- */
/* Vive en nivel.html. Cómo funciona:
   - Cada pregunta es un <fieldset data-correct="N"> con radios name="qX".
   - Al enviar el formulario, se recorre cada fieldset, se busca el radio
     marcado y se compara su "value" contra data-correct.
   - El resultado (0 a 5 aciertos) se convierte en porcentaje y se anima
     en la misma barra visual que usa la carga de sonidos de demo.html
     (clases .progress-wrap / .progress-bar), para mantener el mismo
     lenguaje visual en todo el sitio.
   - 0-1 aciertos = Principiante · 2-3 = Intermedio · 4-5 = Avanzado
*/
function initLevelQuiz(){
  const form = document.querySelector('#quiz-form');
  if(!form) return;

  const resultBox = document.querySelector('#quiz-result');
  const bar = document.querySelector('#level-bar');
  const label = document.querySelector('#level-label');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fieldsets = Array.from(form.querySelectorAll('fieldset[data-correct]'));
    let correctas = 0;
    let respondidas = 0;

    fieldsets.forEach((fs) => {
      const marcado = fs.querySelector('input[type="radio"]:checked');
      if(marcado){
        respondidas++;
        if(marcado.value === fs.getAttribute('data-correct')) correctas++;
      }
    });

    if(respondidas < fieldsets.length){
      alert('Responde las 5 preguntas para ver tu nivel.');
      return;
    }

    const total = fieldsets.length;
    const pct = Math.round((correctas / total) * 100);

    let nivel = 'Principiante';
    if(correctas >= 4) nivel = 'Avanzado';
    else if(correctas >= 2) nivel = 'Intermedio';

    resultBox.style.display = 'block';
    // pequeño retraso para que la transición CSS de la barra se note
    requestAnimationFrame(() => { bar.style.width = pct + '%'; });
    label.textContent = `${correctas}/${total} correctas — Nivel: ${nivel} (${pct}%)`;

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
document.addEventListener('DOMContentLoaded', initLevelQuiz);

/* ---------------------- 7. COPYRIGHT (año automático) ---------------------- */
/* Escribe el año actual en cualquier elemento con el atributo data-year,
   para no tener que actualizar el pie de página a mano cada enero. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});
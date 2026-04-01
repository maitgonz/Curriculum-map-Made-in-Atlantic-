// Crear el mapa
const map = L.map('map').setView([43.5, -6.5], 5);

// Añadir mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar macroregión atlántica y detectar región rota
fetch('data/regiones_nuts2.geojson')
  .then(response => response.json())
  .then(geojson => {
    geojson.features.forEach(feature => {
      try {
        L.geoJSON(feature, {
          style: {
            color: "#60a5fa",
            weight: 1.5,
            fillColor: "#93c5fd",
            fillOpacity: 0.35
          }
        }).addTo(map);

        console.log("OK:", feature.properties.NUTS_ID, feature.properties.NUTS_NAME);
      } catch (error) {
        console.error("REGIÓN CON ERROR:", feature.properties.NUTS_ID, feature.properties.NUTS_NAME, error);
      }
    });
  })
  .catch(error => {
    console.error('Error al cargar la macroregión:', error);
  });

// References to dropdowns
const alianzaSelect = document.getElementById('alianzaSelect');
const paisSelect = document.getElementById('paisSelect');
const regionSelect = document.getElementById('regionSelect');

// TU PALETA DE COLORES
const paletaColores = [
  "#ff2323",
  "#c40062",
  "#fa91d7",
  "#af06d9",
  "#ae69fc",
  "#4821d6",
  "#57a6ff",
  "#1470e9",
  "#24e1fa",
  "#8bf0e2",
  "#9de0ff",
  "#25a80b",
  "#7de408",
  "#d3f753",
  "#c98b3a",
  "#fbff2d",
  "#ffd04d",
  "#ffb349",
  "#fd883a",
  "#ff7452"
];

// Colores asignados a cada alianza
const coloresPorAlianza = {};

// Lista de marcadores para poder filtrarlos
let marcadoresUniversidades = [];
let universidadesPorNombre = {};
let lineasProgramas = [];

function openSidePanel(data) {
  const panel = document.getElementById("side-panel");
  const content = document.getElementById("panel-content");

  if (!panel || !content) {
    console.error("Side panel not found in HTML");
    return;
  }

  panel.classList.remove("hidden");

  content.innerHTML = `
    <h3>${data.name || "No name"}</h3>
    <p>Type: ${data.type || "-"}</p>
  `;
}

// Función para obtener color
function obtenerColorAlianza(nombreAlianza) {
  if (!nombreAlianza || nombreAlianza.trim() === "") {
    return "#9ca3af"; // gris para sin alianza
  }

  if (!coloresPorAlianza[nombreAlianza]) {
    const index = Object.keys(coloresPorAlianza).length;
    const color = paletaColores[index % paletaColores.length];
    coloresPorAlianza[nombreAlianza] = color;
  }

  return coloresPorAlianza[nombreAlianza];
}

// Function to apply filters
// Function to apply filters
// Function to apply filters
function aplicarFiltro() {
  const alianzaSeleccionada = alianzaSelect.value;
  const paisSeleccionado = paisSelect.value;
  const regionSeleccionada = regionSelect.value;

  const universidadesVisibles = new Set();

  marcadoresUniversidades.forEach(item => {
    const coincideAlianza =
      alianzaSeleccionada === "todas" ||
      item.alianza === alianzaSeleccionada;

    const coincidePais =
      paisSeleccionado === "todos" ||
      item.pais === paisSeleccionado;

    const coincideRegion =
      regionSeleccionada === "todas" ||
      item.region === regionSeleccionada;

    const mostrar = coincideAlianza && coincidePais && coincideRegion;

   if (mostrar) {
        item.marker.addTo(map);
        item.marker.bringToFront();
        universidadesVisibles.add(item.name);
        } else {
        map.removeLayer(item.marker);
    }
  });

  lineasProgramas.forEach(item => {
    const mostrarLinea =
      universidadesVisibles.has(item.universityA) ||
      universidadesVisibles.has(item.universityB);

    if (mostrarLinea) {
        item.visible.addTo(map);
        item.hover.addTo(map);
    } else {
        map.removeLayer(item.visible);
        map.removeLayer(item.hover);
    }
  });
}

function dibujarLineasProgramas(programas) {
  programas.forEach(programa => {
    const universidades = programa.universities;

    for (let i = 0; i < universidades.length; i++) {
      for (let j = i + 1; j < universidades.length; j++) {
        const uniA = universidades[i];
        const uniB = universidades[j];

        const coordsA = universidadesPorNombre[uniA.name];
        const coordsB = universidadesPorNombre[uniB.name];

        if (!coordsA || !coordsB) {
          console.warn("University not found in universidades.json:", uniA.name, uniB.name);
          continue;
        }

        // Línea visible
        const linea = L.polyline(
            [
                [coordsA.lat, coordsA.lng],
                [coordsB.lat, coordsB.lng]
            ],
            {
                color: programa.color,
                weight: 2,
                opacity: 0.8
            }
            );

        // Línea invisible (para hover)
        const lineaHover = L.polyline(
            [
                [coordsA.lat, coordsA.lng],
                [coordsB.lat, coordsB.lng]
            ],
            {
                color: programa.color,
                weight: 12,
                opacity: 0
            }
        );

        const listadoUniversidades = programa.universities
            .map(uni => `${uni.name} — ${uni.role}`)
            .join('<br>');

        lineaHover.bindPopup(`
            <strong>${programa.programName}</strong><br><br>
            ${listadoUniversidades}
        `);

            lineaHover.on('mouseover', function () {
            this.openPopup();
        });

            lineaHover.on('mouseout', function () {
            this.closePopup();
        });

        linea.addTo(map);
        lineaHover.addTo(map);

        Object.values(map._layers).forEach(layer => {
        if (layer instanceof L.CircleMarker) {
            layer.bringToFront();
        }
        });

        lineasProgramas.push({
            visible: linea,
            hover: lineaHover,
            universityA: uniA.name,
            universityB: uniB.name
        });
      }
    }
  });
}

// Cargar universidades
fetch('data/universidades.json')
  .then(response => response.json())
  .then(universidades => {

    const alianzasUnicas = new Set();
    const paisesUnicos = new Set();
    const regionesUnicas = new Map();

    universidades.forEach(universidad => {

      const alianza = universidad.alianza && universidad.alianza.trim() !== ""
        ? universidad.alianza
        : "Sin alianza europea";

      const color = obtenerColorAlianza(universidad.alianza);

      const punto = L.circleMarker([universidad.lat, universidad.lng], {
        radius: 8,
        fillColor: color,
        color: "#ffffff",
        weight: 1.5,
        fillOpacity: 0.9
      });

      universidadesPorNombre[universidad.nombre] = {
        lat: universidad.lat,
        lng: universidad.lng
      }; 

      punto.bindTooltip(`
        <strong>${universidad.nombre}</strong><br>
        ${universidad.region}, ${universidad.pais}<br>
        Alianza: ${alianza}
      `);

      punto.on('click', function () {
        openSidePanel({
            type: "university",
            name: universidad.nombre
        });
        });

      punto.addTo(map);
      punto.bringToFront();

      marcadoresUniversidades.push({
        marker: punto,
        name: universidad.nombre,
        alianza: alianza,
        pais: universidad.pais,
        region: universidad.nuts
        });

      paisesUnicos.add(universidad.pais);

        if (universidad.nuts && universidad.region) {
        regionesUnicas.set(universidad.nuts, universidad.region);
        }

        alianzasUnicas.add(alianza);

    });

    // Ordenar alianzas
    const alianzasOrdenadas = Array.from(alianzasUnicas)
      .sort((a, b) => a.localeCompare(b));

    // Rellenar desplegable
    alianzasOrdenadas.forEach(alianza => {
      const option = document.createElement('option');
      option.value = alianza;
      option.textContent = alianza;
      alianzaSelect.appendChild(option);
    });
    // Sort countries
    const paisesOrdenados = Array.from(paisesUnicos)
    .sort((a, b) => a.localeCompare(b));

    // Fill country dropdown
    paisesOrdenados.forEach(pais => {
    const option = document.createElement('option');
    option.value = pais;
    option.textContent = pais;
    paisSelect.appendChild(option);
    });

    // Sort regions
    const regionesOrdenadas = Array.from(regionesUnicas.entries())
    .sort((a, b) => a[1].localeCompare(b[1]));

    // Fill region dropdown
    regionesOrdenadas.forEach(([nuts, nombreRegion]) => {
    const option = document.createElement('option');
    option.value = nuts;
    option.textContent = nombreRegion;
    regionSelect.appendChild(option);
    });

    // Activar filtro
    alianzaSelect.addEventListener('change', aplicarFiltro);
    paisSelect.addEventListener('change', aplicarFiltro);
    regionSelect.addEventListener('change', aplicarFiltro);

    fetch('data/programas.json')
  .then(response => response.json())
  .then(programas => {
    dibujarLineasProgramas(programas);
  })
  .catch(error => {
    console.error('Error loading programas.json:', error);
  });

  })
  .catch(error => {
    console.error('Error al cargar universidades:', error);


  });
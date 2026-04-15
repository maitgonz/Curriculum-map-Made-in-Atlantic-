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
const programaSelect = document.getElementById('programaSelect');
const regionSelect = document.getElementById('regionSelect');
const paisSelect = document.getElementById('paisSelect');

const closePanelButton = document.getElementById('close-panel');
const sidePanel = document.getElementById('side-panel');

function closeSidePanel() {
  if (sidePanel) {
    sidePanel.classList.add("hidden");
  }
}

if (closePanelButton) {
  closePanelButton.addEventListener('click', closeSidePanel);
}

// TU PALETA DE COLORES
const paletaColores = [
  "#b80000",
  "#ff1414",
  "#ffa8a8",
  "#cc1a91",
  "#ff45d7",
  "#fc96e2",
  "#9b02af",
  "#de54f0",
  "#b679f0",
  "#bd1dfc",
  "#7e00af",
  "#e49fff",
  "#9488ff",
  "#5b49ff",
  "#0509cc",
  "#81c6ff",
  "#00a2ff",
  "#0084d1",
  "#25b9d3",
  "#19e9f0",
  "#009b6c",
  "#0c5a43",
  "#5adaba",
  "#35fc60",
  "#02ad27",
  "#8ecf74",
  "#88eb08",
  "#668f30",
  "#ebe704",
  "#dfab00",
  "#c98b3a",
  "#927d44",
  "#ffd04d",
  "#ffb349",
  "#ff9c40",
  "#ff8800",
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

  if (data.type === "university") {
    const allianceCircle = data.allianceColor
        ? `<span style="color:${data.allianceColor}; font-size: 24px; line-height: 1; vertical-align: middle; margin-right: 6px;">●</span>`
        : "";

    const allianceSection = data.allianceName
      ? `
        <div class="panel-section">
          <h4>European Universities alliance</h4>
          <p>
            ${allianceCircle}
            <strong>${data.allianceName}</strong>
          </p>
          ${
            data.allianceUrl
              ? `<p><a class="alliance-link" style="color:${data.allianceColor || '#475569'};" href="${data.allianceUrl}" target="_blank" rel="noopener noreferrer">${data.allianceName} website</a></p>`
              : ""
          }
        </div>
      `
      : `
        <div class="panel-section">
          <h4>European Universities alliance</h4>
          <p>No European Universities alliance identified</p>
        </div>
      `;

    const programmesSection =
      data.programmes && data.programmes.length > 0
        ? `
          <div class="panel-section">
            <h4>Atlantic joint programmes</h4>
            ${data.programmes
              .map(programme => {
                const universitiesList =
                    programme.atlanticPartners && programme.atlanticPartners.length > 0
                    ? `
                      <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 13px; line-height: 1.5;">
                        ${programme.atlanticPartners
                          .map(uni => {
                            const extra = uni.atlantic === false ? ", non-Atlantic" : "";
                            const line = `${uni.name}${uni.role ? ` (${uni.role}${extra})` : ""}`;
                            return (uni.role === "Coordinator" || uni.role === "Co-coordinator")
                              ? `<li><strong>${line}</strong></li>`
                              : `<li>${line}</li>`;
                          })
                          .join("")}
                      </ul>
                    `
                    : `<p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.5;">No Atlantic partner universities listed</p>`;

                const ownRole =
                  programme.role === "Coordinator" || programme.role === "Co-coordinator"
                    ? `<strong>${programme.role}</strong>`
                    : `${programme.role || "-"}`;

                const programmeLink = programme.url
                  ? `<p style="margin: 10px 0 0 0; font-size: 13px; font-style: italic;">
                      <a href="${programme.url}" target="_blank" rel="noopener noreferrer" style="color:${data.allianceColor || '#475569'};">
                        Programme link
                      </a>
                    </p>`
                  : "";

                return `
                  <div style="
                    margin: 12px 0 14px 0;
                    padding: 12px 14px;
                    background: ${data.allianceColor ? `${data.allianceColor}1A` : '#f3f4f6'};
                    border-radius: 10px;
                  ">
                    <p style="margin: 0 0 10px 0; font-weight: 700;"> ${programme.name}</p>

                    <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.4;">
                      <strong>Role:</strong> ${ownRole}
                    </p>

                    <p style="margin: 0; font-weight: 700;">Atlantic universities involved:</p>
                    ${universitiesList}

                    ${programmeLink}
                  </div>
                `;
              })
              .join("")}
          </div>
        `
        : `
          <div class="panel-section">
            <h4>Atlantic joint programmes</h4>
            <p>No joint programmes with Atlantic partners identified</p>
          </div>
        `;

    content.innerHTML = `
      <h2>${data.name || "No name"}</h2>
      <p class="panel-subtitle">${data.region || "-"}</p>
      <p class="panel-subtitle">${data.country || "-"}</p>

      ${allianceSection}
      ${programmesSection}
    `;

    return;
  }

  if (data.type === "programme") {
    console.log("PANEL coordinators:", data.coordinators);
    console.log("PANEL atlanticPartners:", data.atlanticPartners);
    console.log("PANEL status:", data.status);
    console.log("PANEL programmeType:", data.programmeType);
    console.log("PANEL url:", data.url);

    const subtitleParts = [];

    if (data.status) subtitleParts.push(data.status);
    if (data.programmeType) subtitleParts.push(data.programmeType);

    const subtitleHtml = subtitleParts.length > 0
      ? `<p class="panel-subtitle">${subtitleParts.join(" · ")}</p>`
      : "";

    const coordinatorsHtml =
      data.coordinators && data.coordinators.length > 0
        ? `<ul>
            ${data.coordinators
              .map(uni => {
                const line = `${uni.name}${uni.role ? ` (${uni.role})` : ""}`;
                return (uni.role === "Coordinator" || uni.role === "Co-coordinator")
                  ? `<li><strong>${line}</strong></li>`
                  : `<li>${line}</li>`;
              })
              .join("")}
          </ul>`
        : `<p>No coordinator identified</p>`;

    const partnersHtml =
      data.atlanticPartners && data.atlanticPartners.length > 0
        ? `<ul>
            ${data.atlanticPartners
              .map(uni => {
                const line = `${uni.name}${uni.role ? ` (${uni.role})` : ""}`;
                return (uni.role === "Coordinator" || uni.role === "Co-coordinator")
                  ? `<li><strong>${line}</strong></li>`
                  : `<li>${line}</li>`;
              })
              .join("")}
          </ul>`
        : `<p>No Atlantic partners identified</p>`;

    const linkHtml = data.url
      ? `<p><a class="alliance-link" style="color:${data.color || '#475569'};" href="${data.url}" target="_blank" rel="noopener noreferrer">Programme website</a></p>`
      : "";

    content.innerHTML = `
      <h2>${data.name || "No name"}</h2>
      ${subtitleHtml}

      <div class="panel-section">
        <h4>Coordinating institution</h4>
        ${coordinatorsHtml}
      </div>

      <div class="panel-section">
        <h4>Atlantic partners</h4>
        ${partnersHtml}
      </div>

      <div class="panel-section">
        ${linkHtml}
      </div>
    `;

    return;
  }

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
  const programaSeleccionado = programaSelect.value;
  const regionSeleccionada = regionSelect.value;
  const paisSeleccionado = paisSelect.value;

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

    const coincidePrograma =
      programaSeleccionado === "todos" ||
      (item.programmes && item.programmes.some(p => p.name === programaSeleccionado));

    const mostrar = coincideAlianza && coincidePais && coincideRegion && coincidePrograma;

   if (mostrar) {
        item.marker.addTo(map);
        item.marker.bringToFront();
        universidadesVisibles.add(item.name);
        } else {
        map.removeLayer(item.marker);
    }
  });

  lineasProgramas.forEach(item => {
    const coincideProgramaLinea =
      programaSeleccionado === "todos" ||
      item.programmeName === programaSeleccionado;

    console.log("Selected programme:", programaSeleccionado);
    console.log("Line programme:", item.programmeName);

    const mostrarLinea =
      (universidadesVisibles.has(item.universityA) ||
      universidadesVisibles.has(item.universityB)) &&
      coincideProgramaLinea;

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

        linea.on('click', function () {
          console.log("RAW PROGRAMA coordinators:", programa.coordinators);
          console.log("RAW PROGRAMA atlanticPartners:", programa.atlanticPartners);
          console.log("RAW PROGRAMA universities:", programa.universities);
          console.log("RAW PROGRAMA status:", programa.status);
          console.log("RAW PROGRAMA programmeType:", programa.programmeType);
          console.log("RAW PROGRAMA url:", programa.url);

          openSidePanel({
            type: "programme",
            name: programa.programName,
            status: programa.status || "",
            programmeType: programa.programmeType || "",
            coordinators: programa.coordinators || [],
            atlanticPartners: programa.atlanticPartners || programa.universities || [],
            url: programa.url || "",
            color: programa.color || "#475569"
          });
        });

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

        lineaHover.on('click', function () {
          console.log("RAW PROGRAMA coordinators:", programa.coordinators);
          console.log("RAW PROGRAMA atlanticPartners:", programa.atlanticPartners);
          console.log("RAW PROGRAMA universities:", programa.universities);
          console.log("RAW PROGRAMA status:", programa.status);
          console.log("RAW PROGRAMA programmeType:", programa.programmeType);
          console.log("RAW PROGRAMA url:", programa.url);

          openSidePanel({
            type: "programme",
            name: programa.programName,
            status: programa.status || "",
            programmeType: programa.programmeType || "",
            coordinators: programa.coordinators || [],
            atlanticPartners: programa.atlanticPartners || programa.universities || [],
            url: programa.url || "",
            color: programa.color || "#475569"
          });
        });

        const listadoUniversidades = programa.universities
            .map(uni => `${uni.name} — ${uni.role}`)
            .join('<br>');

        lineaHover.bindTooltip(`
          <strong>${programa.programName}</strong><br><br>
          ${listadoUniversidades}
        `, {
          sticky: true
        });

            lineaHover.on('click', function () {
            openSidePanel({
              type: "programme",
              name: programa.programName,
              status: programa.status || "",
              programmeType: programa.programmeType || "",
              coordinators: programa.coordinators || [],
              atlanticPartners: programa.atlanticPartners || [],
              url: programa.url || "",
              color: programa.color || "#475569"
            });
          });

        linea.addTo(map);
        lineaHover.addTo(map);

        Object.values(map._layers).forEach(layer => {
        if (layer instanceof L.CircleMarker) {
            layer.bringToFront();
        }
        });

        console.log("Programme line:", programa.programName);

        lineasProgramas.push({
          visible: linea,
          hover: lineaHover,
          universityA: uniA.name,
          universityB: uniB.name,
          programmeName: programa.programName,
          status: programa.status || "",
          programmeType: programa.programmeType || "",
          coordinators: programa.coordinators || [],
          atlanticPartners: programa.atlanticPartners || programa.universities || [],
          url: programa.url || "",
          color: programa.color || "#475569"
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
    const programasUnicos = new Set();
    const regionesUnicas = new Map();
    const paisesUnicos = new Set();

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
          name: universidad.nombre,
          region: universidad.region,
          country: universidad.pais,
          allianceName: universidad.alianza && universidad.alianza.trim() !== "" ? universidad.alianza : null,
          allianceColor: obtenerColorAlianza(universidad.alianza),
          allianceUrl: universidad.alianza_url || null,
          programmes: universidad.programmes || []
        });
      });

      punto.addTo(map);
      punto.bringToFront();

      marcadoresUniversidades.push({
        marker: punto,
        name: universidad.nombre,
        alianza: alianza,
        pais: universidad.pais,
        region: universidad.nuts,
        programmes: universidad.programmes || []
      });

      paisesUnicos.add(universidad.pais);

        if (universidad.nuts && universidad.region) {
        regionesUnicas.set(universidad.nuts, universidad.region);
        }

        alianzasUnicas.add(alianza);

        if (universidad.programmes && universidad.programmes.length > 0) {
          universidad.programmes.forEach(p => {
            if (p.name) {
              programasUnicos.add(p.name);
            }
          });
        }
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

    // Sort programas
    const programasOrdenados = Array.from(programasUnicos)
    .sort((a, b) => a.localeCompare(b));
    
    // Fill programas dropdown
    programasOrdenados.forEach(programa => {
      const option = document.createElement('option');
      option.value = programa;
      option.textContent = programa;
      programaSelect.appendChild(option);
    });

    // Activar filtro
    console.log("alianzaSelect:", alianzaSelect);
    console.log("programaSelect:", programaSelect);
    console.log("paisSelect:", paisSelect);
    console.log("regionSelect:", regionSelect);

    if (alianzaSelect) alianzaSelect.addEventListener('change', aplicarFiltro);
    if (programaSelect) programaSelect.addEventListener('change', aplicarFiltro);
    if (paisSelect) paisSelect.addEventListener('change', aplicarFiltro);
    if (regionSelect) regionSelect.addEventListener('change', aplicarFiltro);

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
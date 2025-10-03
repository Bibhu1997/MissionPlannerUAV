
import { Mission, Waypoint, WeatherData } from '../types';

// Add global declarations for jsPDF and its autoTable plugin to satisfy TypeScript
// when using the libraries loaded from the CDN.
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (options?: any) => jsPDF;
    };
  }
  // FIX: Added missing method signatures to the jsPDF interface to resolve type errors.
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    setFontSize(size: number): jsPDF;
    text(text: string | string[], x: number, y: number, options?: any): jsPDF;
    setTextColor(r: number | string, g?: number, b?: number): jsPDF;
    save(filename: string): void;
  }
}

const triggerDownload = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToGeoJSON = (mission: Mission) => {
  const features: any[] = [];

  // Mission Path
  if (mission.waypoints.length > 1) {
    features.push({
      type: 'Feature',
      properties: { name: `${mission.name} - Path` },
      geometry: {
        type: 'LineString',
        coordinates: mission.waypoints.map(wp => [wp.lng, wp.lat, wp.alt]),
      },
    });
  }

  // Waypoints
  mission.waypoints.forEach((wp, index) => {
    features.push({
      type: 'Feature',
      properties: { name: `WP ${index + 1}`, altitude: wp.alt, speed: wp.speed },
      geometry: { type: 'Point', coordinates: [wp.lng, wp.lat, wp.alt] },
    });
  });

  // Home Position
  if (mission.homePosition) {
    features.push({
      type: 'Feature',
      properties: { name: 'Home Position' },
      geometry: { type: 'Point', coordinates: [mission.homePosition.lng, mission.homePosition.lat] },
    });
  }

  // Boundary
  if (mission.boundary && mission.boundary.length > 2) {
    const boundaryCoords = mission.boundary.map(p => [p.lng, p.lat]);
    if (boundaryCoords.length > 0 && (boundaryCoords[0][0] !== boundaryCoords[boundaryCoords.length - 1][0] || boundaryCoords[0][1] !== boundaryCoords[boundaryCoords.length - 1][1])) {
      boundaryCoords.push(boundaryCoords[0]); // Close the polygon for GeoJSON
    }
    features.push({
      type: 'Feature',
      properties: { name: 'Mission Boundary' },
      geometry: { type: 'Polygon', coordinates: [boundaryCoords] },
    });
  }

  const geojson = {
    type: 'FeatureCollection',
    features: features,
  };

  triggerDownload(`${mission.name}.geojson`, JSON.stringify(geojson, null, 2), 'application/geo+json');
};

export const exportToKML = (mission: Mission) => {
  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${mission.name}</name>
    <Style id="waypoint">
      <IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle>
    </Style>
    <Style id="homeStyle">
      <IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href></Icon></IconStyle>
    </Style>
    <Style id="boundaryStyle">
      <LineStyle><color>ffb672f4</color><width>2</width></LineStyle>
      <PolyStyle><color>33b672f4</color></PolyStyle>
    </Style>
    
    ${mission.homePosition ? `
    <Placemark>
      <name>Home Position</name>
      <styleUrl>#homeStyle</styleUrl>
      <Point>
        <coordinates>${mission.homePosition.lng},${mission.homePosition.lat},0</coordinates>
      </Point>
    </Placemark>` : ''}
    
    <Placemark>
      <name>Mission Path</name>
      <LineString>
        <tessellate>1</tessellate>
        <altitudeMode>absolute</altitudeMode>
        <coordinates>
          ${mission.waypoints.map(wp => `${wp.lng},${wp.lat},${wp.alt}`).join('\n          ')}
        </coordinates>
      </LineString>
    </Placemark>
    
    ${mission.waypoints.map((wp, index) => `
    <Placemark>
      <name>WP ${index + 1}</name>
      <styleUrl>#waypoint</styleUrl>
      <Point>
        <altitudeMode>absolute</altitudeMode>
        <coordinates>${wp.lng},${wp.lat},${wp.alt}</coordinates>
      </Point>
    </Placemark>`).join('')}
    
    ${(mission.boundary && mission.boundary.length > 2) ? `
    <Placemark>
      <name>Mission Boundary</name>
      <styleUrl>#boundaryStyle</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${mission.boundary.map(p => `${p.lng},${p.lat},0`).join('\n              ')}
              ${mission.boundary.length > 0 ? `${mission.boundary[0].lng},${mission.boundary[0].lat},0` : ''}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>` : ''}
  </Document>
</kml>`;
  triggerDownload(`${mission.name}.kml`, kmlContent, 'application/vnd.google-earth.kml+xml');
};

export const exportToCSV = (mission: Mission) => {
  let csvContent = `# Mission: ${mission.name}\n`;
  if (mission.homePosition) {
    csvContent += `# Home Position: lat=${mission.homePosition.lat}, lon=${mission.homePosition.lng}\n`;
  }
  if (mission.boundary && mission.boundary.length > 0) {
    const boundaryStr = mission.boundary.map(p => `(${p.lat.toFixed(6)},${p.lng.toFixed(6)})`).join('; ');
    csvContent += `# Mission Boundary: ${boundaryStr}\n`;
  }

  const headers = 'waypoint,latitude,longitude,altitude_m,speed_m/s';
  const rows = mission.waypoints.map((wp, index) =>
    `${index + 1},${wp.lat.toFixed(6)},${wp.lng.toFixed(6)},${wp.alt},${wp.speed}`
  );
  csvContent += `${headers}\n${rows.join('\n')}`;
  triggerDownload(`${mission.name}.csv`, csvContent, 'text/csv');
};

export const exportToMAVLink = (mission: Mission) => {
    const mavlinkContent = `QGC WPL 110\n` + mission.waypoints.map((wp, index) => {
        const command = 16; // MAV_CMD_NAV_WAYPOINT
        return `${index}\t0\t3\t${command}\t0\t${wp.speed}\t0\t0\t${wp.lat}\t${wp.lng}\t${wp.alt}\t1`;
    }).join('\n');
    triggerDownload(`${mission.name}.txt`, mavlinkContent, 'text/plain');
    alert("MAVLink export is a simplified text representation. For real flights, use specialized software.");
};

export const exportBoundaryToGeoJSON = (mission: Mission) => {
  if (!mission.boundary || mission.boundary.length < 3) {
    alert("A mission boundary must have at least 3 points to be exported.");
    return;
  }

  const boundaryCoords = mission.boundary.map(p => [p.lng, p.lat]);
  // Ensure the polygon is closed for GeoJSON
  if (boundaryCoords.length > 0 && (boundaryCoords[0][0] !== boundaryCoords[boundaryCoords.length - 1][0] || boundaryCoords[0][1] !== boundaryCoords[boundaryCoords.length - 1][1])) {
    boundaryCoords.push(boundaryCoords[0]);
  }

  const geojson = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: `${mission.name} - Boundary` },
      geometry: {
        type: 'Polygon',
        coordinates: [boundaryCoords],
      },
    }],
  };

  triggerDownload(`${mission.name}_Boundary.geojson`, JSON.stringify(geojson, null, 2), 'application/geo+json');
};

export const exportBoundaryToKML = (mission: Mission) => {
  if (!mission.boundary || mission.boundary.length < 3) {
    alert("A mission boundary must have at least 3 points to be exported.");
    return;
  }

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${mission.name} - Boundary</name>
    <Style id="boundaryStyle">
      <LineStyle><color>ffb672f4</color><width>2</width></LineStyle>
      <PolyStyle><color>33b672f4</color></PolyStyle>
    </Style>
    <Placemark>
      <name>Mission Boundary</name>
      <styleUrl>#boundaryStyle</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${mission.boundary.map(p => `${p.lng},${p.lat},0`).join('\n                  ')}
              ${mission.boundary.length > 0 ? `${mission.boundary[0].lng},${mission.boundary[0].lat},0` : ''}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

  triggerDownload(`${mission.name}_Boundary.kml`, kmlContent, 'application/vnd.google-earth.kml+xml');
};


// --- PDF Export Implementation ---
const toRadians = (deg: number) => deg * Math.PI / 180;

const getDistance = (from: { lat: number, lng: number }, to: { lat: number, lng: number }) => {
    const R = 6371e3; // metres
    const φ1 = toRadians(from.lat);
    const φ2 = toRadians(to.lat);
    const Δφ = toRadians(to.lat - from.lat);
    const Δλ = toRadians(to.lng - from.lng);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export const exportToPDF = (mission: Mission, weather: WeatherData) => {
    // Correctly check if the jspdf library and autotable plugin are loaded.
    if (typeof window.jspdf?.jsPDF?.prototype?.autoTable === 'undefined') {
        alert("PDF generation libraries are not loaded. Please check your internet connection and try again.");
        return;
    }
    
    const doc = new window.jspdf.jsPDF();

    // --- Mission Statistics ---
    let totalDistance = 0;
    let estimatedTime = 0;
    for (let i = 0; i < mission.waypoints.length - 1; i++) {
        const from = mission.waypoints[i];
        const to = mission.waypoints[i+1];
        const distance = getDistance(from, to);
        totalDistance += distance;
        if (from.speed > 0) {
            estimatedTime += distance / from.speed;
        }
    }
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.round(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    }

    // --- Document Header ---
    doc.setFontSize(18);
    doc.text('UAV Mission Brief', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    // --- Mission Summary ---
    doc.setFontSize(12);
    doc.text('Mission Summary', 14, 40);
    
    const summaryBody: (string | number)[][] = [
        ['Mission Name', mission.name],
        ['Number of Waypoints', mission.waypoints.length],
        ['Total Distance', `${(totalDistance / 1000).toFixed(2)} km`],
        ['Estimated Flight Time', formatTime(estimatedTime)],
    ];

    if (mission.homePosition) {
        summaryBody.push(['Home Position', `${mission.homePosition.lat.toFixed(6)}, ${mission.homePosition.lng.toFixed(6)}`]);
    }

    doc.autoTable({
        startY: 42,
        head: [['Mission Detail', 'Value']],
        body: summaryBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }, // slate-800
        columnStyles: { 0: { fontStyle: 'bold' } },
    });

    let lastTableY = (doc as any).lastAutoTable.finalY;

    // --- Mission Boundary ---
    if (mission.boundary && mission.boundary.length > 0) {
        doc.text('Mission Boundary', 14, lastTableY + 10);
        doc.autoTable({
            startY: lastTableY + 12,
            head: [['#', 'Latitude', 'Longitude']],
            body: mission.boundary.map((p, i) => [i + 1, p.lat.toFixed(6), p.lng.toFixed(6)]),
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
        });
        lastTableY = (doc as any).lastAutoTable.finalY;
    }

    // --- Weather Overview ---
    doc.text('Weather Overview', 14, lastTableY + 10);
    doc.autoTable({
        startY: lastTableY + 12,
        theme: 'grid',
        head: [['METAR', 'TAF']],
        body: [[weather.metar, weather.taf]],
        styles: { fontSize: 8, font: 'courier' }
    });
    lastTableY = (doc as any).lastAutoTable.finalY;

    // --- Waypoint Table ---
    doc.text('Waypoint Details', 14, lastTableY + 10);
    const waypointData = mission.waypoints.map((wp, i) => [
        i + 1,
        wp.lat.toFixed(6),
        wp.lng.toFixed(6),
        `${wp.alt.toFixed(1)} m`,
        `${wp.speed.toFixed(1)} m/s`
    ]);

    doc.autoTable({
        startY: lastTableY + 12,
        head: [['#', 'Latitude', 'Longitude', 'Altitude', 'Speed']],
        body: waypointData,
    });

    doc.save(`${mission.name}_Brief.pdf`);
};

import { Mission, Waypoint, WeatherData } from '../types';

// Add global declarations for jsPDF and its autoTable plugin to satisfy TypeScript
// when using the libraries loaded from the CDN.
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (options?: any) => jsPDF;
    };
  }
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
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
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: `${mission.name} - Path` },
        geometry: {
          type: 'LineString',
          coordinates: mission.waypoints.map(wp => [wp.lng, wp.lat, wp.alt]),
        },
      },
      ...mission.waypoints.map((wp, index) => ({
        type: 'Feature',
        properties: {
          name: `WP ${index + 1}`,
          altitude: wp.alt,
          speed: wp.speed,
        },
        geometry: {
          type: 'Point',
          coordinates: [wp.lng, wp.lat, wp.alt],
        },
      })),
    ],
  };
  triggerDownload(`${mission.name}.geojson`, JSON.stringify(geojson, null, 2), 'application/geo+json');
};

export const exportToKML = (mission: Mission) => {
  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${mission.name}</name>
    <Style id="waypoint">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Placemark>
      <name>Mission Path</name>
      <styleUrl>#lineStyle</styleUrl>
      <LineString>
        <extrude>1</extrude>
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
  </Document>
</kml>`;
  triggerDownload(`${mission.name}.kml`, kmlContent, 'application/vnd.google-earth.kml+xml');
};

export const exportToCSV = (mission: Mission) => {
  const headers = 'waypoint,latitude,longitude,altitude_m,speed_m/s';
  const rows = mission.waypoints.map((wp, index) =>
    `${index + 1},${wp.lat},${wp.lng},${wp.alt},${wp.speed}`
  );
  const csvContent = `${headers}\n${rows.join('\n')}`;
  triggerDownload(`${mission.name}.csv`, csvContent, 'text/csv');
};

export const exportToMAVLink = (mission: Mission) => {
    const mavlinkContent = `QGC WPL 110\n` + mission.waypoints.map((wp, index) => {
        const command = index === 0 ? 16 : 16; // MAV_CMD_NAV_WAYPOINT
        return `${index}\t0\t3\t${command}\t0\t${wp.speed}\t0\t0\t${wp.lat}\t${wp.lng}\t${wp.alt}\t1`;
    }).join('\n');
    triggerDownload(`${mission.name}.txt`, mavlinkContent, 'text/plain');
    alert("MAVLink export is a simplified text representation. For real flights, use specialized software.");
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
    if (typeof window.jspdf === 'undefined' || typeof (window as any).jspdf.jsPDF.autoTable === 'undefined') {
        alert("PDF generation libraries are not loaded. Please check your internet connection and try again.");
        return;
    }
    
    const doc = new (window as any).jspdf.jsPDF();

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


    // --- Weather Overview ---
    const weatherTableStartY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Weather Overview', 14, weatherTableStartY);
    doc.autoTable({
        startY: weatherTableStartY + 2,
        theme: 'grid',
        head: [['METAR', 'TAF']],
        body: [[weather.metar, weather.taf]],
        styles: { fontSize: 8, font: 'courier' }
    });

    // --- Waypoint Table ---
    const waypointTableStartY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Waypoint Details', 14, waypointTableStartY);
    const waypointData = mission.waypoints.map((wp, i) => [
        i + 1,
        wp.lat.toFixed(6),
        wp.lng.toFixed(6),
        `${wp.alt.toFixed(1)} m`,
        `${wp.speed.toFixed(1)} m/s`
    ]);

    doc.autoTable({
        startY: waypointTableStartY + 2,
        head: [['#', 'Latitude', 'Longitude', 'Altitude', 'Speed']],
        body: waypointData,
    });

    doc.save(`${mission.name}_Brief.pdf`);
};

import { Mission, Waypoint } from '../types';

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
    // This is a simplified MAVLink (plain text) representation.
    // Real MAVLink is a binary protocol.
    const mavlinkContent = `QGC WPL 110\n` + mission.waypoints.map((wp, index) => {
        const command = index === 0 ? 16 : 16; // MAV_CMD_NAV_WAYPOINT
        return `${index}\t0\t3\t${command}\t0\t${wp.speed}\t0\t0\t${wp.lat}\t${wp.lng}\t${wp.alt}\t1`;
    }).join('\n');
    triggerDownload(`${mission.name}.txt`, mavlinkContent, 'text/plain');
    alert("MAVLink export is a simplified text representation. For real flights, use specialized software.");
};

export const exportToPDF = (mission: Mission) => {
    alert("PDF export is a planned feature. For now, please use the other export formats.");
};

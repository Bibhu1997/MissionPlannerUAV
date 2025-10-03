
import React, { useRef, useEffect } from 'react';
import { Waypoint } from '../types';
import { useSettings } from '../hooks/useSettings';

declare global {
    interface Window {
        Chart: any;
    }
}

interface TerrainProfileChartProps {
    waypoints: Waypoint[];
    terrainProfile: { elevation: number }[];
}

const getAbsoluteAltitude = (wp: Waypoint): number => {
    return wp.altType === 'AGL' ? (wp.terrain_alt || 0) + wp.alt : wp.alt;
};

const TerrainProfileChart: React.FC<TerrainProfileChartProps> = ({ waypoints, terrainProfile }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);
    const { unitSystem } = useSettings();

    useEffect(() => {
        if (!chartRef.current || !window.Chart || waypoints.length < 2) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            return;
        };

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        const M_TO_FT = 3.28084;
        const isImperial = unitSystem === 'imperial';
        const unitLabel = isImperial ? 'ft' : 'm';
        const conversionFactor = isImperial ? M_TO_FT : 1;

        const labels = waypoints.map((_, index) => `WP ${index + 1}`);
        const flightPathData = waypoints.map(wp => getAbsoluteAltitude(wp) * conversionFactor);
        const terrainData = terrainProfile.map(p => p.elevation * conversionFactor);

        const alignedTerrainData = [];
        if (terrainData.length > 0) {
            for (let i = 0; i < waypoints.length; i++) {
                const ratio = i / (waypoints.length - 1);
                const index = Math.round(ratio * (terrainData.length - 1));
                alignedTerrainData.push(terrainData[index]);
            }
        }

        chartInstanceRef.current = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `Flight Altitude (MSL)`,
                        data: flightPathData,
                        borderColor: '#38bdf8', // primary
                        backgroundColor: 'rgba(56, 189, 248, 0.2)',
                        fill: true,
                        tension: 0.2,
                        pointBackgroundColor: '#38bdf8',
                        pointBorderColor: '#fff',
                    },
                    {
                        label: `Terrain Elevation (MSL)`,
                        data: alignedTerrainData,
                        borderColor: '#4ade80', // secondary
                        backgroundColor: 'rgba(74, 222, 128, 0.3)',
                        fill: 'start',
                        tension: 0.2,
                        pointRadius: 0,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#cbd5e1' } },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        callbacks: {
                            label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} ${unitLabel}`
                        }
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: `Altitude (${unitLabel})`, color: '#94a3b8' },
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(51, 65, 85, 0.5)' }
                    },
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [waypoints, terrainProfile, unitSystem]);
    
    return (
         <div className="bg-base-100 p-2 rounded-md h-48">
            <h4 className="text-sm font-bold text-slate-300 text-center mb-1">Altitude & Terrain Profile</h4>
            <div className="relative h-[calc(100%-1.25rem)]">
                 <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default TerrainProfileChart;

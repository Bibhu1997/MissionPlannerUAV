import React, { useRef, useEffect } from 'react';
import { Waypoint } from '../types';

// Let TypeScript know Chart.js is available globally from the CDN script
declare global {
    interface Window {
        Chart: any;
    }
}

interface AltitudeProfileChartProps {
    waypoints: Waypoint[];
}

const AltitudeProfileChart: React.FC<AltitudeProfileChartProps> = ({ waypoints }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current || !window.Chart) return;

        // Destroy previous chart instance before creating a new one
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const labels = waypoints.map((_, index) => `WP ${index + 1}`);
        const data = waypoints.map(wp => wp.alt);

        chartInstanceRef.current = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Altitude (m)',
                    data: data,
                    borderColor: '#38bdf8', // primary color
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    fill: true,
                    tension: 0.2,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b', // base-200
                        titleColor: '#f1f5f9', // slate-100
                        bodyColor: '#cbd5e1', // slate-300
                        callbacks: {
                            label: (context: any) => `${context.dataset.label}: ${context.parsed.y} m`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Altitude (m)',
                            color: '#94a3b8' // slate-400
                        },
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(51, 65, 85, 0.5)' } // slate-700
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });

        // Cleanup function to destroy chart instance on component unmount
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [waypoints]);

    return (
        <div className="bg-base-100 p-2 rounded-md h-48">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

export default AltitudeProfileChart;

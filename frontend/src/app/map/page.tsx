'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, ShieldAlert, Heart, Activity } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import dynamic from 'next/dynamic';

// Leaflet has client-only dependencies, load dynamically with ssr disabled
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-3">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-semibold uppercase tracking-wider">Loading Hospital Map Container...</p>
    </div>
  )
});

export default function MapPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppStore();
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
          <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            PHC Facility Locator
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col md:flex-row relative">
        
        {/* Sidebar for Facility details */}
        <div className="w-full md:w-96 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0 md:h-[calc(100vh-65px)] z-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Nearest Facilities</h2>
              <p className="text-xs text-slate-400 mt-1">Showing primary, community, and district medical centres in your service area.</p>
            </div>

            {selectedFacility ? (
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                    {selectedFacility.type}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{selectedFacility.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{selectedFacility.address}</span>
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="text-slate-300 font-medium">{selectedFacility.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">24 Hour Service:</span>
                    <span className={`font-semibold ${selectedFacility.is_24hr ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {selectedFacility.is_24hr ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operational:</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <a
                    href={`tel:${selectedFacility.phone}`}
                    className="flex-grow py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-center font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Facility</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm border-2 border-dashed border-slate-850 rounded-xl">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-bounce" />
                <span>Select a marker on the map to display facility credentials.</span>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 flex items-center gap-2.5 text-[10px] text-slate-400">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Map automatically estimates current geocode bounding limits.</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-grow relative h-96 md:h-[calc(100vh-65px)]">
          <MapComponent onSelect={setSelectedFacility} />
        </div>

      </main>

    </div>
  );
}

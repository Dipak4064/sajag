import { create } from 'zustand';

interface MapState {
  center: [number, number];
  zoom: number;
  showSensors: boolean;
  showShelters: boolean;
  showSOS: boolean;
  showDisasters: boolean;
  selectedDeviceId: string | null;
  selectedDisasterId: string | null;
  setCenter: (center: [number, number], zoom?: number) => void;
  toggleLayer: (layer: 'sensors' | 'shelters' | 'sos' | 'disasters') => void;
  selectDevice: (deviceId: string | null) => void;
  selectDisaster: (disasterId: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [27.7050, 85.3150], // Kathmandu Center
  zoom: 13,
  showSensors: true,
  showShelters: true,
  showSOS: true,
  showDisasters: true,
  selectedDeviceId: null,
  selectedDisasterId: null,
  setCenter: (center, zoom) => set((state) => ({ center, zoom: zoom ?? state.zoom })),
  toggleLayer: (layer) =>
    set((state) => {
      switch (layer) {
        case 'sensors':
          return { showSensors: !state.showSensors };
        case 'shelters':
          return { showShelters: !state.showShelters };
        case 'sos':
          return { showSOS: !state.showSOS };
        case 'disasters':
          return { showDisasters: !state.showDisasters };
        default:
          return state;
      }
    }),
  selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),
  selectDisaster: (disasterId) => set({ selectedDisasterId: disasterId })
}));

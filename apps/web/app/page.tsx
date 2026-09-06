import Link from 'next/link';
import { ShieldAlert, Radio, PhoneCall, MapPin, Building2, UserCheck, AlertTriangle } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Emergency Advisory Ribbon */}
      <header className="bg-red-950/80 border-b border-red-800/60 px-4 py-2 text-center text-sm font-medium text-red-200 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
        <span>SAJAG EMERGENCY SYSTEM • KATHMANDU VALLEY DISASTER RESPONSE NETWORK ACTIVE</span>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Real-time Early Warning & Automated Rescue System
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
          SAJAG <span className="text-red-500 font-serif">सजग</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
          A disaster detection and community response platform designed for Nepal.
          Detects hazards via IoT sensors, activates automated voice calls, matches safe shelters, and triages emergency rescues.
        </p>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
          {/* Citizen App Card */}
          <Link
            href="/citizen"
            className="group relative flex flex-col items-start p-6 bg-slate-900 border border-slate-800 hover:border-red-500/60 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-950/40 text-left"
          >
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
              Citizen Emergency Portal 📱
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              1-tap SOS distress button, live neighborhood hazard level, nearest safe shelter navigation, and citizen disaster reporting.
            </p>
            <span className="text-sm font-semibold text-red-400 flex items-center gap-1 mt-auto">
              Launch Citizen App &rarr;
            </span>
          </Link>

          {/* Municipal Command Center Card */}
          <Link
            href="/dashboard"
            className="group relative flex flex-col items-start p-6 bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-950/40 text-left"
          >
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Municipal Command Center 🏢
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Full-screen live map, virtual ESP32 sensor telemetry, WiFi vs LoRa fallback toggles, live SOS triage, and Twilio IVR status.
            </p>
            <span className="text-sm font-semibold text-blue-400 flex items-center gap-1 mt-auto">
              Enter Command Center &rarr;
            </span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <Radio className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-sm font-semibold text-slate-200">LoRa Fallback Sim</div>
            <div className="text-xs text-slate-400 mt-1">MQTT + Firebase Realtime DB dual transport</div>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <PhoneCall className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-sm font-semibold text-slate-200">Twilio Voice IVR</div>
            <div className="text-xs text-slate-400 mt-1">Automated phone calls with DTMF 1 / 2 check</div>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <MapPin className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-sm font-semibold text-slate-200">Haversine Geofence</div>
            <div className="text-xs text-slate-400 mt-1">5km danger zone targeting and shelter routing</div>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-lg">
            <UserCheck className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-sm font-semibold text-slate-200">Whisper Voice NLP</div>
            <div className="text-xs text-slate-400 mt-1">Critical keyword extraction and urgency triage</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>SAJAG (सजग) • 24-Hour Hackathon Edition • 100% Free-Tier & Hardware-Simulated Stack</p>
      </footer>
    </main>
  );
}

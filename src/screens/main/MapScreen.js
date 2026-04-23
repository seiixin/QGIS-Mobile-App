import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import AppLayout from '../../components/layout/AppLayout';
import { colors } from '../../theme/colors';
import { resolveApiUrl } from '../../config/api';
import { logActivity } from '../../lib/activityStore';
import { useAuth } from '../../context/AuthContext';

import PoliticalBoundary from '../../data/geojson/Political_Boundary.json';
import GroundShaking     from '../../data/geojson/Ground_Shaking_Intensity.json';
import EvacCenters       from '../../data/geojson/Evacuation_Centers.json';
import OpenSpaces        from '../../data/geojson/Open_Spaces.json';
import RoadsSafe         from '../../data/geojson/Roads_Safe.json';
import RoadsAverage      from '../../data/geojson/Roads_Average.json';
import RoadsPoor         from '../../data/geojson/Roads_Poor.json';
import RoadsCritical     from '../../data/geojson/Roads_Critical.json';
import EvacPin           from '../../data/geojson/Evac_Centers_Pin.json';
import OpenPin           from '../../data/geojson/Open_Spaces_Pin.json';
import GasStations       from '../../data/geojson/Gas_Stations.json';
import Markets           from '../../data/geojson/Markets.json';
import Banks             from '../../data/geojson/Banks.json';
import Restaurants       from '../../data/geojson/Restaurants.json';

function buildMapHTML(apiBase, authToken) {
  const gj = JSON.stringify({
    boundary: PoliticalBoundary, shaking: GroundShaking,
    evac: EvacCenters, open: OpenSpaces,
    safe: RoadsSafe, average: RoadsAverage, poor: RoadsPoor, critical: RoadsCritical,
    evac_pin: EvacPin, open_pin: OpenPin,
    gas: GasStations, resto: Restaurants, markets: Markets, banks: Banks,
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;font-family:-apple-system,sans-serif;overflow:hidden}
#map{height:100vh;width:100vw}
#panel{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.97);border-radius:16px 16px 0 0;padding:10px 12px 16px;box-shadow:0 -4px 20px rgba(0,0,0,.12);z-index:1000}
#panel h4{font-size:11px;font-weight:700;color:#888;margin-bottom:8px;padding-left:4px;letter-spacing:.8px}
#chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
#chips::-webkit-scrollbar{display:none}
.chip{display:flex;align-items:center;gap:5px;border:1.5px solid #ddd;border-radius:20px;padding:5px 12px;white-space:nowrap;font-size:12px;color:#555;cursor:pointer;background:#fff;user-select:none}
.chip.on{color:#fff;font-weight:700}
.cdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
#gbtn{position:fixed;top:16px;right:14px;width:48px;height:48px;border-radius:50%;background:#C0392B;border:none;font-size:22px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.3);z-index:1000;display:flex;align-items:center;justify-content:center}
#zoom-wrap{position:fixed;right:14px;bottom:110px;z-index:1000;display:flex;flex-direction:column;gap:8px}
.zbtn{width:44px;height:44px;border-radius:22px;background:rgba(255,255,255,.96);border:none;font-size:24px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;color:#1B2A4A}
#rcard{position:fixed;top:16px;left:14px;right:70px;background:#1B2A4A;border-radius:14px;padding:12px 14px;z-index:1000;display:none;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.3)}
#rname{font-size:15px;font-weight:700}
#rdist{font-size:12px;color:rgba(255,255,255,.65);margin-top:2px}
#rcancel{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.15);border:none;color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
#moverlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;align-items:center;justify-content:center;padding:32px}
#moverlay.show{display:flex}
#mbox{background:#fff;border-radius:20px;padding:24px;max-width:360px;width:100%}
#mbox h3{font-size:18px;margin-bottom:14px}
#mbox p{font-size:14px;line-height:1.6;color:#333;margin-bottom:8px}
#mclose{margin-top:16px;width:100%;padding:12px;background:#1B2A4A;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer}
</style>
</head>
<body>
<div id="map"></div>
<button id="gbtn">🚨</button>
<div id="zoom-wrap">
  <button class="zbtn" id="zin">+</button>
  <button class="zbtn" id="zout">−</button>
</div>
<div id="rcard"><div id="rname"></div><div id="rdist"></div><button id="rcancel">✕</button></div>
<div id="panel"><h4>LAYERS</h4><div id="chips"></div></div>
<div id="moverlay"><div id="mbox">
<h3>🚨 Earthquake Safety</h3>
<p>• Tap any marker (🟢 open space, 🏠 evac center, ⛽ gas, etc.) to get directions.</p>
<p>• Prioritize GREEN open spaces during aftershocks.</p>
<p>• Follow the colored route — 🟢 green = safe, 🟡 orange = average, 🔴 red = critical.</p>
<p>• Tap the same marker again to clear the route.</p>
<button id="mclose">Got it</button>
</div></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const GJ = ${gj};
const API_BASE = '${apiBase}';
const AUTH_TOKEN = '${authToken || ''}';

// ── Map ───────────────────────────────────────────────────────────────────────
const map = L.map('map',{zoomControl:false}).setView([14.9505,120.748],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);

// ── Road condition data for colorizing route ──────────────────────────────────
const ROAD_CONDITIONS = [
  {label:'safe',    color:'#27AE60', data: GJ.safe},
  {label:'average', color:'#F39C12', data: GJ.average},
  {label:'poor',    color:'#E67E22', data: GJ.poor},
  {label:'critical',color:'#E74C3C', data: GJ.critical},
];
const SNAP_THRESHOLD = 60;

function distPointToSegment(pLat,pLng,aLat,aLng,bLat,bLng){
  const ls=111320, lsc=111320*Math.cos(pLat*Math.PI/180);
  const px=pLng*lsc,py=pLat*ls,ax=aLng*lsc,ay=aLat*ls,bx=bLng*lsc,by=bLat*ls;
  const dx=bx-ax,dy=by-ay,lenSq=dx*dx+dy*dy;
  if(lenSq===0) return Math.sqrt((px-ax)**2+(py-ay)**2);
  let t=((px-ax)*dx+(py-ay)*dy)/lenSq;
  t=Math.max(0,Math.min(1,t));
  return Math.sqrt((px-(ax+t*dx))**2+(py-(ay+t*dy))**2);
}

function classifyPoint(lat,lng){
  let best=null,bestDist=SNAP_THRESHOLD;
  for(const rc of ROAD_CONDITIONS){
    for(const f of rc.data.features){
      const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]
        :f.geometry.type==='MultiLineString'?f.geometry.coordinates:[];
      for(const line of lines){
        for(let i=0;i<line.length-1;i++){
          const [aLng,aLat]=line[i],[bLng,bLat]=line[i+1];
          const d=distPointToSegment(lat,lng,aLat,aLng,bLat,bLng);
          if(d<bestDist){bestDist=d;best=rc.color;}
        }
      }
    }
  }
  return best;
}

function colorizeRoute(coords, fallback){
  // coords: [[lng,lat],...] from API
  if(coords.length<2) return [{latlngs:coords.map(([lng,lat])=>[lat,lng]),color:fallback}];
  const classified=coords.map(([lng,lat])=>({ll:[lat,lng],color:classifyPoint(lat,lng)||fallback}));
  const segs=[];
  let cur=[classified[0].ll], curColor=classified[0].color;
  for(let i=1;i<classified.length;i++){
    const {ll,color}=classified[i];
    if(color===curColor){cur.push(ll);}
    else{cur.push(ll);segs.push({latlngs:cur,color:curColor});cur=[ll];curColor=color;}
  }
  if(cur.length>1) segs.push({latlngs:cur,color:curColor});
  return segs;
}

// ── Layers ────────────────────────────────────────────────────────────────────
const POLY=[
  {key:'boundary',label:'Boundary',  color:'#1B2A4A',type:'line',opacity:1,  on:true, dash:'8,6'},
  {key:'shaking', label:'Shaking',   color:'#C0392B',type:'fill',opacity:.4, on:false},
  {key:'evac',    label:'Evac Areas',color:'#2980B9',type:'fill',opacity:.3, on:true},
  {key:'open',    label:'Open Areas',color:'#27AE60',type:'fill',opacity:.3, on:true},
  {key:'safe',    label:'Safe',      color:'#27AE60',type:'line',opacity:1,  on:true},
  {key:'average', label:'Average',   color:'#F39C12',type:'line',opacity:1,  on:true},
  {key:'poor',    label:'Poor',      color:'#E67E22',type:'line',opacity:1,  on:true},
  {key:'critical',label:'Critical',  color:'#E74C3C',type:'line',opacity:1,  on:true},
];
const PTS=[
  {key:'open_pin',label:'Open Spaces', emoji:'🟢',color:'#27AE60',on:true},
  {key:'evac_pin',label:'Evac Centers',emoji:'🏠',color:'#2980B9',on:true},
  {key:'gas',     label:'Gas',         emoji:'⛽',color:'#E67E22',on:true},
  {key:'resto',   label:'Food',        emoji:'🍽️',color:'#C0392B',on:true},
  {key:'markets', label:'Markets',     emoji:'🛒',color:'#8E44AD',on:true},
  {key:'banks',   label:'Banks',       emoji:'🏦',color:'#2980B9',on:true},
];

const layers={}, state={};

POLY.forEach(d=>{
  const l=d.type==='fill'
    ?L.geoJSON(GJ[d.key],{style:{color:d.color,fillColor:d.color,fillOpacity:d.opacity,weight:1,opacity:.7}})
    :L.geoJSON(GJ[d.key],{style:{color:d.color,weight:2,opacity:d.opacity,dashArray:d.dash||null}});
  layers[d.key]=l; state[d.key]=d.on;
  if(d.on) l.addTo(map);
});

// ── User location — injected from React Native via postMessage ────────────────
let userLat=14.9505, userLng=120.748, userDot=null, userCircle=null;
let locationReceived=false;

function updateUserDot(lat,lng){
  userLat=lat; userLng=lng;
  if(userDot) map.removeLayer(userDot);
  if(userCircle) map.removeLayer(userCircle);
  userCircle=L.circle([lat,lng],{radius:25,fillColor:'rgba(59,79,224,0.2)',color:'#3B4FE0',weight:2,fillOpacity:0.2}).addTo(map);
  userDot=L.circleMarker([lat,lng],{radius:8,fillColor:'#3B4FE0',color:'#fff',weight:3,fillOpacity:1}).addTo(map);
  if(!locationReceived){
    locationReceived=true;
    map.setView([lat,lng],15);
  }

  // ── Navigation progress check ─────────────────────────────────────────────
  if(!activeDestDef || arrivedFlag) return;

  const distToDest = haversine(lat,lng,activeDestLat,activeDestLng);
  const remaining  = remainingDist(lat,lng);

  // Arrival: within 20m
  if(distToDest < 20){
    arrivedFlag = true;
    speak('You have arrived at your destination. '+activeDestDef.label);
    // Show arrival banner
    document.getElementById('rname').textContent = '✅ You have arrived!';
    document.getElementById('rdist').textContent  = activeDestDef.emoji+' '+activeDestDef.label;
    // Notify React Native for activity log
    if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'arrived',
        label: activeDestDef.label,
        emoji: activeDestDef.emoji,
      }));
    }
    return;
  }

  // Distance announcements: 500m, 200m, 100m, 50m
  [500,200,100,50].forEach(threshold=>{
    const key='dist-'+threshold;
    if(remaining<=threshold && remaining>threshold*0.5 && !announcedWaypoints.has(key)){
      announcedWaypoints.add(key);
      speak('In '+fmt(remaining)+', you will reach '+activeDestDef.label);
    }
  });
}

// React Native sends location via postMessage
document.addEventListener('message', e => {
  try {
    const msg = JSON.parse(e.data);
    if (msg.type === 'location') updateUserDot(msg.lat, msg.lng);
  } catch {}
});
window.addEventListener('message', e => {
  try {
    const msg = JSON.parse(e.data);
    if (msg.type === 'location') updateUserDot(msg.lat, msg.lng);
  } catch {}
});

// ── Voice (Web Speech API) ────────────────────────────────────────────────────
function speak(text){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-US'; u.rate=0.9; u.pitch=1.0;
  window.speechSynthesis.speak(u);
}

// ── Routing ───────────────────────────────────────────────────────────────────
let routeLayers=[], selKey=null, activeDestDef=null, activeDestLat=null, activeDestLng=null;
let routePath=[], announcedWaypoints=new Set(), arrivedFlag=false;

function haversine(a,b,c,d){
  const R=6371000,r=x=>x*Math.PI/180;
  const x=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function fmt(m){return m>=1000?(m/1000).toFixed(1)+' km':Math.round(m)+' m'}

function remainingDist(fromLat,fromLng){
  if(!routePath.length) return 0;
  let minIdx=0, minD=Infinity;
  routePath.forEach((p,i)=>{const d=haversine(fromLat,fromLng,p[0],p[1]);if(d<minD){minD=d;minIdx=i;}});
  let d=0;
  for(let i=minIdx;i<routePath.length-1;i++) d+=haversine(routePath[i][0],routePath[i][1],routePath[i+1][0],routePath[i+1][1]);
  return d;
}

function clearRoute(){
  routeLayers.forEach(l=>map.removeLayer(l)); routeLayers=[];
  selKey=null; activeDestDef=null; activeDestLat=null; activeDestLng=null;
  routePath=[]; announcedWaypoints=new Set(); arrivedFlag=false;
  document.getElementById('rcard').style.display='none';
  if(window.speechSynthesis) window.speechSynthesis.cancel();
}

async function doRoute(toLat,toLng,def){
  clearRoute();
  activeDestDef=def; activeDestLat=toLat; activeDestLng=toLng;
  const dist=haversine(userLat,userLng,toLat,toLng);
  let isFallback=true;

  try{
    const url=API_BASE+'/route?from_lat='+userLat+'&from_lng='+userLng+'&to_lat='+toLat+'&to_lng='+toLng;
    const headers={'Accept':'application/json'};
    if(AUTH_TOKEN) headers['Authorization']='Bearer '+AUTH_TOKEN;
    const res=await fetch(url,{headers,signal:AbortSignal.timeout(10000)});
    const data=await res.json();
    if(data.ok && data.coordinates && data.coordinates.length>1){
      isFallback=false;
      routePath=data.coordinates.map(c=>[c[1],c[0]]); // [lat,lng]
      const segs=colorizeRoute(data.coordinates, def.color);
      segs.forEach(seg=>{
        const l=L.polyline(seg.latlngs,{color:seg.color,weight:6,opacity:.9}).addTo(map);
        routeLayers.push(l);
      });
      const lats=data.coordinates.map(c=>c[1]), lngs=data.coordinates.map(c=>c[0]);
      map.fitBounds([[Math.min(...lats),Math.min(...lngs)],[Math.max(...lats),Math.max(...lngs)]],{padding:[60,60]});
      document.getElementById('rdist').textContent=fmt(data.distance)+' via road';
      speak('Starting navigation to '+def.label);
    }
  }catch(e){}

  if(isFallback){
    routePath=[[userLat,userLng],[toLat,toLng]];
    const l=L.polyline([[userLat,userLng],[toLat,toLng]],{color:def.color,weight:5,opacity:.85,dashArray:'8,4'}).addTo(map);
    routeLayers.push(l);
    map.fitBounds([[userLat,userLng],[toLat,toLng]],{padding:[60,60]});
    document.getElementById('rdist').textContent=fmt(dist)+' (straight line)';
    speak('Navigating to '+def.label);
  }

  document.getElementById('rname').textContent=def.emoji+' '+def.label;
  document.getElementById('rcard').style.display='block';
}

// ── Point markers ─────────────────────────────────────────────────────────────
PTS.forEach(d=>{
  const icon=L.divIcon({
    html:'<div style="width:32px;height:32px;border-radius:50%;background:'+d.color+';display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.3)">'+d.emoji+'</div>',
    className:'',iconSize:[32,32],iconAnchor:[16,16]
  });
  const l=L.geoJSON(GJ[d.key],{
    filter:f=>f.geometry.type==='Point',
    pointToLayer:(f,ll)=>L.marker(ll,{icon}),
  });
  l.on('click',e=>{
    const ll=e.latlng, k=d.key+ll.lat.toFixed(5)+ll.lng.toFixed(5);
    if(selKey===k){clearRoute();return;}
    selKey=k;
    doRoute(ll.lat,ll.lng,d);
  });
  layers[d.key]=l; state[d.key]=d.on;
  if(d.on) l.addTo(map);
});

// ── Zoom buttons ──────────────────────────────────────────────────────────────
document.getElementById('zin').onclick=()=>map.zoomIn();
document.getElementById('zout').onclick=()=>map.zoomOut();

// ── Chips ─────────────────────────────────────────────────────────────────────
const chips=document.getElementById('chips');
[...POLY,...PTS].forEach(d=>{
  const c=document.createElement('div');
  c.className='chip'+(d.on?' on':'');
  c.style.borderColor=d.on?d.color:'#ddd';
  c.style.background=d.on?d.color:'#fff';
  const dot=document.createElement('div');
  if(d.emoji){dot.textContent=d.emoji;dot.style.fontSize='13px';}
  else{dot.className='cdot';dot.style.background=d.on?'#fff':d.color;}
  const lbl=document.createElement('span');lbl.textContent=d.label;
  c.appendChild(dot);c.appendChild(lbl);
  c.addEventListener('click',()=>{
    const on=!state[d.key]; state[d.key]=on;
    if(on) layers[d.key].addTo(map); else map.removeLayer(layers[d.key]);
    c.className='chip'+(on?' on':'');
    c.style.borderColor=on?d.color:'#ddd';
    c.style.background=on?d.color:'#fff';
    if(!d.emoji) dot.style.background=on?'#fff':d.color;
  });
  chips.appendChild(c);
});

// ── Guidance modal ────────────────────────────────────────────────────────────
document.getElementById('gbtn').onclick=()=>document.getElementById('moverlay').classList.add('show');
document.getElementById('mclose').onclick=()=>document.getElementById('moverlay').classList.remove('show');
document.getElementById('moverlay').onclick=e=>{if(e.target.id==='moverlay')document.getElementById('moverlay').classList.remove('show');};
document.getElementById('rcancel').onclick=clearRoute;
</script>
</body>
</html>`;
}

export default function MapScreen({ navigation }) {
  const { token } = useAuth();
  const webRef    = useRef(null);
  const [loading, setLoading] = useState(true);
  const [html, setHtml]       = useState(null);

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      const apiBase = resolveApiUrl('').replace(/\/api\/?$/, '/api');
      setHtml(buildMapHTML(apiBase, token));
    })();
  }, [token]);

  // Watch location and inject into WebView
  useEffect(() => {
    let sub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        ({ coords }) => {
          const msg = JSON.stringify({ type: 'location', lat: coords.latitude, lng: coords.longitude });
          webRef.current?.injectJavaScript(`
            (function(){
              var e = new MessageEvent('message', { data: '${msg.replace(/'/g, "\\'")}' });
              document.dispatchEvent(e);
            })();
            true;
          `);
        }
      );
    })();
    return () => sub?.remove();
  }, []);

  return (
    <AppLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />
      <View style={styles.container}>
        {!html && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.btnPrimary} />
            <Text style={styles.loaderText}>Loading map…</Text>
          </View>
        )}
        {html && (
          <WebView
            ref={webRef}
            source={{ html, baseUrl: '' }}
            style={styles.webview}
            onMessage={(e) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data);
                if (msg.type === 'arrived') {
                  logActivity({
                    type:  'arrival',
                    label: 'You have arrived!',
                    sub:   `Destination: ${msg.emoji} ${msg.label}`,
                  });
                }
              } catch {}
            }}
            onLoadEnd={async () => {
              setLoading(false);
              // Send current location immediately on load
              try {
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const msg = JSON.stringify({ type: 'location', lat: pos.coords.latitude, lng: pos.coords.longitude });
                webRef.current?.injectJavaScript(`
                  (function(){
                    var e = new MessageEvent('message', { data: '${msg.replace(/'/g, "\\'")}' });
                    document.dispatchEvent(e);
                  })();
                  true;
                `);
              } catch {}
            }}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            allowsInlineMediaPlayback
            mixedContentMode="always"
            originWhitelist={['*']}
          />
        )}
        {html && loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.btnPrimary} />
          </View>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview:   { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0D1B2A',
  },
  loaderText: { color: '#fff', marginTop: 12, fontSize: 14 },
});

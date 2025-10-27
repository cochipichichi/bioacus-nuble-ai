
import { AudioMod } from './audio.js';
import { ML } from './ml.js';
import { barChart, heatmap } from './chart.js';

const $ = sel => document.querySelector(sel);
let spectCtx=null, spectDPI=1;
let mqttClient=null, mqttConnected=false, mqttTopic='';

function setTheme(t){
  document.documentElement.classList.remove('theme-light','theme-contrast','theme-sepia');
  if(t==='light') document.documentElement.classList.add('theme-light');
  if(t==='contrast') document.documentElement.classList.add('theme-contrast');
  if(t==='sepia') document.documentElement.classList.add('theme-sepia');
  localStorage.setItem('theme', t);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  $('#themeLabel').textContent = t === 'light' ? '☀️ Claro' : t==='contrast' ? '⚡ Alto contraste' : t==='sepia' ? '📜 Sepia' : '🌙 Oscuro';
}
window.setTheme=setTheme;

function initSpectrogram(){
  const canvas = $('#spect');
  spectCtx = canvas.getContext('2d');
  spectDPI = window.devicePixelRatio||1;
  const W = canvas.clientWidth*spectDPI, H = canvas.clientHeight*spectDPI;
  canvas.width=W; canvas.height=H;
  spectCtx.fillStyle='rgba(0,0,0,0)';
  spectCtx.fillRect(0,0,W,H);
}

function drawSpectrum(mags){
  const canvas = $('#spect');
  const ctx = spectCtx;
  const W=canvas.width, H=canvas.height;
  const img = ctx.getImageData(1,0,W-1,H);
  ctx.putImageData(img,0,0);
  const col = ctx.createImageData(1,H);
  for(let y=0;y<H;y++){
    const r = 1 - y/H;
    const idx = Math.floor(r * (mags.length-1));
    const m = (mags[idx]+140)/140;
    const v = Math.max(0, Math.min(255, Math.floor(255*m)));
    const i = (y*1)*4;
    col.data[i+0] = 20;
    col.data[i+1] = v;
    col.data[i+2] = 255;
    col.data[i+3] = Math.floor(80 + 175*m);
  }
  ctx.putImageData(col, W-1, 0);
}

function updateBars(probs, labels){
  barChart($('#bars'), labels, probs.map(p=> +(p*100).toFixed(1)));
}

function toJSONDownload(name, text){
  const blob = new Blob([text], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}

function computeHeatmapData(days=7){
  const now = Date.now();
  const msDay = 24*3600*1000;
  const dayKeys=[];
  for(let i=days-1;i>=0;i--){
    const d = new Date(now - i*msDay);
    const key = d.toISOString().slice(0,10);
    dayKeys.push(key);
  }
  const hours = Array.from({length:24}, (_,h)=> (h<10? '0'+h:h)+':00');
  const matrix = Array.from({length:24}, ()=> Array(dayKeys.length).fill(0));
  for(const h of ML.state.hist){
    const dd = new Date(h.ts).toISOString().slice(0,10);
    const idx = dayKeys.indexOf(dd);
    if(idx<0) continue;
    const hr = new Date(h.ts).getHours();
    matrix[hr][idx] += 1;
  }
  return {hours, days: dayKeys, matrix};
}

function drawHeatmap(){
  const days = parseInt($('#heat-days').value||'7',10);
  const {hours, days:dayLabels, matrix} = computeHeatmapData(days);
  heatmap($('#heatmap'), hours, dayLabels, matrix);
}

function connectMQTT(){
  const url = ($('#mqtt-url').value||'').trim();
  mqttTopic = ($('#mqtt-topic').value||'bioacus/fp').trim();
  if(!url){ alert('Ingresa URL wss del broker'); return; }
  try{
    mqttClient = window.mqtt.connect(url, {
      username: ($('#mqtt-user').value||'').trim() || undefined,
      password: ($('#mqtt-pass').value||'').trim() || undefined
    });
    mqttClient.on('connect', ()=>{
      mqttConnected=true;
      $('#mqtt-state').textContent = 'Conectado';
      mqttClient.subscribe(mqttTopic);
    });
    mqttClient.on('message', (_topic, payload)=>{
      try{
        const obj = JSON.parse(new TextDecoder().decode(payload));
        if(Array.isArray(obj.bands) && obj.bands.length===16){
          const {labels, probs} = ML.predict(obj.bands);
          updateBars(probs, labels);
          $('#now-predict').textContent = labels[probs.indexOf(Math.max(...probs))] || '—';
          // registra en hist como remoto
          ML.state.hist.push({ts: obj.ts || Date.now(), label: 'remoto', vec: obj.bands.slice(0)});
          drawHeatmap();
        }
      }catch(e){ console.warn('MQTT payload error', e); }
    });
    mqttClient.on('error', (e)=>{ $('#mqtt-state').textContent='Error'; console.error(e); });
    $('#mqtt-state').textContent='Conectando...';
  }catch(e){
    alert('MQTT no disponible'); console.error(e);
  }
}

function disconnectMQTT(){
  try{ mqttClient && mqttClient.end(true); }catch(e){}
  mqttConnected=false; $('#mqtt-state').textContent='Desconectado';
}

async function init(){
  initSpectrogram();
  const theme = localStorage.getItem('theme') || 'dark';
  setTheme(theme);
  // Theme menu
  const menu = $('#themeMenu');
  $('#themeBtn').addEventListener('click',()=> menu.classList.toggle('open'));
  document.addEventListener('click',(e)=>{ if(!menu.contains(e.target) && e.target!==$('#themeBtn')) menu.classList.remove('open'); });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') menu.classList.remove('open'); });

  // Recorder
  $('#btn-start').addEventListener('click', async ()=>{
    await AudioMod.start();
    AudioMod.mod.onFrame = ({freq, sampleRate, fftSize})=>{
      drawSpectrum(freq);
      const vec = AudioMod.bands16(freq, sampleRate, fftSize);
      const {labels, probs} = ML.predict(vec);
      updateBars(probs, labels);
      $('#now-predict').textContent = labels[probs.indexOf(Math.max(...probs))] || '—';
    };
    $('#rec-state').textContent = 'Grabando…';
  });
  $('#btn-stop').addEventListener('click', ()=>{
    AudioMod.stop(); $('#rec-state').textContent='Detenido';
  });

  // Capture single snapshot
  $('#btn-capture').addEventListener('click', ()=>{
    if(!AudioMod.mod.analyser){ alert('Inicia la grabación'); return; }
    const vec = AudioMod.getWindowVector(1); // 1s promedio rápido
    const label = ($('#label').value||'').trim() || 'Desconocido';
    if(!vec){ alert('No hay suficiente ventana'); return; }
    ML.addSample(label, vec);
    $('#status').textContent = `Huella añadida a ${label}`;
    drawHeatmap();
  });

  // Capture by window (multi-shot)
  $('#btn-window-capture').addEventListener('click', async ()=>{
    const sec = parseFloat($('#window-sec').value||'2');
    const shots = parseInt($('#window-shots').value||'3',10);
    const label = ($('#label').value||'').trim() || 'Desconocido';
    if(!AudioMod.mod.analyser){ alert('Inicia la grabación'); return; }
    for(let i=0;i<shots;i++){
      const vec = AudioMod.getWindowVector(sec);
      if(vec){ ML.addSample(label, vec); $('#status').textContent = `Ventana ${i+1}/${shots} añadida (${sec}s)`; }
      await new Promise(r=> setTimeout(r, sec*1000));
    }
    drawHeatmap();
  });

  // Train / Export / Import
  $('#btn-train').addEventListener('click', ()=>{
    const cents = ML.computeCentroids();
    $('#status').textContent = `Centroides: ${Object.keys(cents).join(', ') || '—'}`;
  });
  $('#btn-export').addEventListener('click', ()=>{
    toJSONDownload('bioacus-fingerprints.json', ML.exportJSON());
  });
  $('#file-import').addEventListener('change', async (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const text = await f.text();
    ML.importJSON(text);
    $('#status').textContent = 'Dataset importado';
    drawHeatmap();
  });

  // MQTT
  $('#btn-mqtt-connect').addEventListener('click', connectMQTT);
  $('#btn-mqtt-disconnect').addEventListener('click', disconnectMQTT);

  // Heatmap init
  $('#heat-days').addEventListener('change', drawHeatmap);
  drawHeatmap();
}
window.addEventListener('DOMContentLoaded', init);

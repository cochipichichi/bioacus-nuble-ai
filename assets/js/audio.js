
export const AudioMod = (()=>{
  const mod = { audioCtx:null, source:null, analyser:null, raf:0, onFrame:null, running:false, sampleRate:48000, fftSize:2048, ring:[] };
  const freq = new Float32Array(1024);
  const time = new Float32Array(2048);
  const RING_MAX = 600; // ~10-20s aprox, depende del frame rate
  async function start(){
    if(mod.running) return;
    mod.audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    mod.sampleRate = mod.audioCtx.sampleRate;
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    mod.source = mod.audioCtx.createMediaStreamSource(stream);
    mod.analyser = mod.audioCtx.createAnalyser();
    mod.analyser.fftSize = 2048;
    mod.analyser.smoothingTimeConstant = 0.85;
    mod.source.connect(mod.analyser);
    mod.running = true;
    loop();
  }
  function stop(){
    mod.running=false;
    cancelAnimationFrame(mod.raf);
    if(mod.source && mod.source.mediaStream){
      mod.source.mediaStream.getTracks().forEach(t=>t.stop());
    }
    if(mod.audioCtx) mod.audioCtx.close();
  }
  function loop(){
    if(!mod.running) return;
    mod.analyser.getFloatFrequencyData(freq);
    mod.analyser.getFloatTimeDomainData(time);
    // push snapshot into ring buffer
    const snap = new Float32Array(freq.length);
    snap.set(freq);
    mod.ring.push(snap);
    if(mod.ring.length>RING_MAX) mod.ring.shift();
    if(mod.onFrame) mod.onFrame({freq,time,fftSize:mod.analyser.fftSize,sampleRate:mod.sampleRate});
    mod.raf = requestAnimationFrame(loop);
  }
  function bands16(freq, sampleRate, fftSize){
    const nyquist = sampleRate/2;
    const binHz = nyquist / freq.length;
    const bands = new Array(16).fill(0);
    const edges = [];
    const fmin=100, fmax=8000;
    for(let i=0;i<=16;i++){
      const r = i/16;
      const f = fmin * Math.pow(fmax/fmin, r);
      edges.push(f);
    }
    for(let bi=0; bi<freq.length; bi++){
      const f = bi*binHz;
      if(f<edges[0] || f>edges[edges.length-1]) continue;
      let b=0;
      while(b<16 && f>edges[b+1]) b++;
      const p = Math.pow(10, freq[bi]/10);
      bands[b] += p;
    }
    const out = bands.map(v=> Math.log10(1e-12+v));
    const mean = out.reduce((a,b)=>a+b,0)/out.length;
    const std = Math.sqrt(out.map(x=>(x-mean)**2).reduce((a,b)=>a+b,0)/out.length)||1;
    return out.map(x=>(x-mean)/std);
  }
  function getWindowVector(seconds=2){
    // Aproxima frames/seg = 30; toma las ultimas N muestras del ring
    const fps = 30;
    const N = Math.max(1, Math.min(mod.ring.length, Math.floor(seconds*fps)));
    if(N<=0 || mod.ring.length===0) return null;
    const start = Math.max(0, mod.ring.length - N);
    let acc = new Array(16).fill(0);
    let count = 0;
    for(let i=start;i<mod.ring.length;i++){
      const vec = bands16(mod.ring[i], mod.sampleRate, mod.fftSize);
      for(let k=0;k<16;k++) acc[k]+=vec[k];
      count++;
    }
    return acc.map(v=> v/count);
  }
  return {start, stop, bands16, mod, getWindowVector};
})();

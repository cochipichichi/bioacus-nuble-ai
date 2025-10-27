
export const ML = (()=>{
  const state = { labels: ['Chucao','Rana chilena','Tricahue','Silencio'], dataset: {}, centroids: {}, hist: [] };
  state.labels.forEach(l=> state.dataset[l]=[]);

  function setLabels(arr){ state.labels = arr; state.dataset={}; arr.forEach(l=> state.dataset[l]=[]); state.centroids={}; }
  function addSample(label, vec){ if(!state.dataset[label]) state.dataset[label]=[]; state.dataset[label].push(vec.slice()); state.hist.push({ts:Date.now(), label, vec:vec.slice(0)}); }
  function computeCentroids(){
    const out={};
    for(const [lab, samples] of Object.entries(state.dataset)){
      if(!samples.length) continue;
      const n=samples.length, d=samples[0].length;
      const c=new Array(d).fill(0);
      for(const v of samples) for(let i=0;i<d;i++) c[i]+=v[i];
      for(let i=0;i<d;i++) c[i]/=n;
      const norm = Math.sqrt(c.reduce((a,b)=>a+b*b,0))||1;
      out[lab]=c.map(x=>x/norm);
    }
    state.centroids=out; return out;
  }
  function cosine(a,b){
    let s=0,na=0,nb=0; for(let i=0;i<a.length;i++){ s+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
    return s/((Math.sqrt(na)*Math.sqrt(nb))||1);
  }
  function softmax(arr,temp=1){ const m=Math.max(...arr); const ex=arr.map(x=>Math.exp((x-m)/temp)); const sum=ex.reduce((a,b)=>a+b,0)||1; return ex.map(x=>x/sum); }
  function predict(vec){
    const labels = Object.keys(state.centroids);
    if(!labels.length) return {labels: state.labels, probs: state.labels.map(_=>0), sims: state.labels.map(_=>0)};
    const sims = labels.map(l=> cosine(vec, state.centroids[l]));
    const probs = softmax(sims, 0.1);
    return {labels, probs, sims};
  }
  function exportJSON(){ return JSON.stringify({labels:state.labels, dataset:state.dataset}, null, 2); }
  function importJSON(text){ const obj=JSON.parse(text); setLabels(obj.labels||[]); state.dataset=obj.dataset||{}; computeCentroids(); }
  return {state,setLabels,addSample,computeCentroids,predict,exportJSON,importJSON};
})();

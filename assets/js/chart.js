
export function barChart(canvas, labels, values){
  const ctx = canvas.getContext('2d');
  const dpi = window.devicePixelRatio || 1;
  const W = canvas.clientWidth * dpi, H = canvas.clientHeight * dpi;
  canvas.width=W; canvas.height=H;
  ctx.clearRect(0,0,W,H);
  const pad=20*dpi;
  const maxV = Math.max(1, ...values);
  const bw = (W-2*pad)/(values.length||1);
  ctx.font = `${12*dpi}px system-ui,ui-sans-serif`;
  values.forEach((v,i)=>{
    const h = (H-2*pad) * v / maxV;
    const x = pad + i*bw + 4*dpi;
    const y = H - pad - h;
    ctx.fillStyle = '#8cf'; ctx.fillRect(x, y, bw-8*dpi, h);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    const label = labels[i] ?? i;
    ctx.fillText(`${label}`, x, H - pad/2);
  });
}

export function heatmap(canvas, hoursLabels, dayLabels, matrix){
  // matrix: [24][D] counts
  const ctx = canvas.getContext('2d');
  const dpi = window.devicePixelRatio || 1;
  const W = canvas.clientWidth * dpi, H = canvas.clientHeight * dpi;
  canvas.width=W; canvas.height=H;
  ctx.clearRect(0,0,W,H);
  const padL = 40*dpi, padT=20*dpi, padR=10*dpi, padB=24*dpi;
  const rows = hoursLabels.length, cols = dayLabels.length;
  const cellW = (W - padL - padR) / Math.max(1, cols);
  const cellH = (H - padT - padB) / Math.max(1, rows);
  // find max
  let maxV = 1;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) maxV = Math.max(maxV, matrix[r][c]||0);
  // draw cells
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const v = matrix[r][c]||0;
      const alpha = v>0 ? (0.15 + 0.85*(v/maxV)) : 0.05;
      ctx.fillStyle = `rgba(0, 180, 255, ${alpha.toFixed(3)})`;
      const x = padL + c*cellW, y = padT + r*cellH;
      ctx.fillRect(x+1, y+1, cellW-2, cellH-2);
    }
  }
  // labels
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.font = `${12*dpi}px system-ui,ui-sans-serif`;
  for(let r=0;r<rows;r++){
    const y = padT + r*cellH + cellH*0.6;
    ctx.fillText(hoursLabels[r], 4*dpi, y);
  }
  for(let c=0;c<cols;c++){
    const x = padL + c*cellW + 4*dpi;
    ctx.fillText(dayLabels[c].slice(5), x, 14*dpi);
  }
}

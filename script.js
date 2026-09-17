const PRODUCTS={
  1:['SGC Cream','SGC Kulit'],
  2:['Malkist Abon','Malkist Sour Cream','SCO Bakaran'],
  3:['Coconut','Choki Cream'],
  4:['Malkist Crackers Murni','MCR Bakaran'],
  5:['RSC Cream','RSC Kulit (Lokal)','Roma Sandwich Vanilla (Kulit)','Arden']
};
const BAG_KG=20;
const state={};
let editingHistoryId=null;
const dateEl=document.getElementById('date'),shiftEl=document.getElementById('shift');
const format=n=>Number(n).toLocaleString('id-ID');
const key=(line,name)=>`${line}|${name}`;
function toastMsg(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),1800)}
function emptyState(){for(let line=1;line<=5;line++)PRODUCTS[line].forEach(name=>state[key(line,name)]=[])}
function cloneData(){return JSON.parse(JSON.stringify(state))}
function itemBags(entries){return entries.reduce((sum,x)=>sum+x.bags,0)}
function itemKg(entries){return itemBags(entries)*BAG_KG}
function countSaved(){return Object.values(state).flat().length}
function formatDate(v){if(!v)return '';const [y,m,d]=v.split('-');const months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];return `${Number(d)} ${months[Number(m)-1]} ${y}`}
function persistDraft(){localStorage.setItem('opnameDraftV5',JSON.stringify({date:dateEl.value,shift:shiftEl.value,data:state,editingHistoryId}))}
function loadDraft(){try{const raw=localStorage.getItem('opnameDraftV5');if(!raw){emptyState();return}const x=JSON.parse(raw);if(x.date)dateEl.value=x.date;if(x.shift)shiftEl.value=x.shift;emptyState();Object.keys(x.data||{}).forEach(k=>state[k]=Array.isArray(x.data[k])?x.data[k]:[]);editingHistoryId=x.editingHistoryId||null}catch(e){emptyState()}}
function getHistory(){try{return JSON.parse(localStorage.getItem('opnameHistoryV5')||'[]')}catch{return []}}
function saveHistory(list){localStorage.setItem('opnameHistoryV5',JSON.stringify(list))}
function render(){
  const root=document.getElementById('products');root.innerHTML='';
  for(let line=1;line<=5;line++){
    const card=document.createElement('section');card.className='card line-card';
    card.innerHTML=`<div class="line-title"><div><div class="line-badge">LINE ${line}</div><h2>Line ${line}</h2></div><span>Input & simpan per hitungan</span></div>`;
    PRODUCTS[line].forEach(name=>{
      const k=key(line,name);if(!state[k])state[k]=[];const saved=state[k];
      const product=document.createElement('div');product.className='product';
      const batches=saved.map(x=>x.bags).join(' + ');
      product.innerHTML=`
        <div class="product-top">
          <div><div class="product-name">${name}</div><div class="muted">${saved.length?`Tersimpan: ${batches} kantong`: 'Belum ada hitungan tersimpan'}</div></div>
          <div class="kg">${format(itemKg(saved))} kg</div>
        </div>
        <div class="input-row">
          <input class="bag-input" type="number" min="1" step="1" inputmode="numeric" placeholder="Jumlah kantong" aria-label="Jumlah kantong ${name}">
          <button type="button" class="save-one">✓ SIMPAN</button>
        </div>
        ${saved.length?`<div class="saved-total">Total ${itemBags(saved)} kantong = <b>${format(itemKg(saved))} kg</b></div>`:''}
        <div class="saved-list"></div>`;
      card.appendChild(product);
      const list=product.querySelector('.saved-list');
      saved.forEach((entry,i)=>{
        const row=document.createElement('div');row.className='saved-row';
        row.innerHTML=`<div><span>Hitungan ${i+1}</span><b>${entry.bags} kantong × 20 kg = ${format(entry.bags*BAG_KG)} kg</b></div><button type="button" class="delete-one" data-key="${encodeURIComponent(k)}" data-index="${i}" aria-label="Hapus hitungan ${i+1}">×</button>`;
        list.appendChild(row);
      });
    });
    root.appendChild(card);
  }
  attachEvents();
  document.getElementById('editMode').textContent=editingHistoryId?'✏️ Mode edit riwayat':'💾 Setiap SIMPAN langsung tersimpan di HP';
  generateWA(false);
}
function attachEvents(){
  document.querySelectorAll('.save-one').forEach(btn=>btn.addEventListener('click',()=>{
    const product=btn.closest('.product');const lineCard=btn.closest('.line-card');
    const line=Number(lineCard.querySelector('.line-badge').textContent.replace('LINE ',''));
    const name=product.querySelector('.product-name').textContent;const k=key(line,name);
    const input=product.querySelector('.bag-input');const bags=parseInt(input.value||'0',10);
    if(!Number.isFinite(bags)||bags<1){toastMsg('Masukkan jumlah kantong terlebih dahulu');input.focus();return}
    state[k].push({bags,at:new Date().toISOString()});
    input.value='';persistDraft();render();
    toastMsg(`${name}: ${bags} kantong tersimpan ✓`);
  }));
  document.querySelectorAll('.delete-one').forEach(btn=>btn.addEventListener('click',()=>{
    const raw=decodeURIComponent(btn.dataset.key);if(!state[raw])return;state[raw].splice(Number(btn.dataset.index),1);persistDraft();render();toastMsg('Hitungan dihapus');
  }));
  document.querySelectorAll('.bag-input').forEach(input=>input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.closest('.product').querySelector('.save-one').click()}}));
}
function generateWA(showToast=true){
  let text=`OPNAME BUBUK DI AREA STAGE 1\nTanggal ${formatDate(dateEl.value)} SHIFT ${shiftEl.value}\n\n`;
  for(let line=1;line<=5;line++){
    text+=`Line ${line}\n`;
    PRODUCTS[line].forEach(name=>{const entries=state[key(line,name)]||[];const kg=itemKg(entries);text+=`${name} : ${kg===0?'-':format(kg)+' kg'}\n`;});
    text+='\n';
  }
  document.getElementById('waOutput').value=text.trim();
  if(showToast)toastMsg('Format WhatsApp berhasil dibuat');
}
function upsertHistory(){
  const list=getHistory();const id=editingHistoryId||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const snapshot={id,date:dateEl.value,shift:shiftEl.value,savedAt:new Date().toISOString(),data:cloneData(),count:countSaved(),text:document.getElementById('waOutput').value};
  const index=list.findIndex(x=>x.id===id);if(index>=0)list[index]=snapshot;else list.push(snapshot);saveHistory(list);editingHistoryId=id;persistDraft();return index>=0;
}
function generateAndSave(){generateWA(false);const edited=upsertHistory();renderHistory();document.getElementById('waOutput').scrollIntoView({behavior:'smooth',block:'start'});toastMsg(edited?'Perubahan opname disimpan':'Opname disimpan & format WA dibuat')}
function renderHistory(){
  const box=document.getElementById('historyList'),list=getHistory();
  const search=(document.getElementById('historySearch')?.value||'').trim().toLowerCase();
  const dateFilter=document.getElementById('historyDateFilter')?.value||'';
  const shiftFilter=document.getElementById('historyShiftFilter')?.value||'all';
  const filtered=list.filter(x=>{
    if(dateFilter && x.date!==dateFilter)return false;
    if(shiftFilter!=='all' && String(x.shift)!==shiftFilter)return false;
    if(search){
      const haystack=[x.date,formatDate(x.date),`shift ${x.shift}`,String(x.shift),x.text||''].join(' ').toLowerCase();
      if(!haystack.includes(search))return false;
    }
    return true;
  });
  box.innerHTML='';
  document.getElementById('historyCount').textContent=filtered.length===list.length
    ? `${list.length} opname tersimpan`
    : `${filtered.length} dari ${list.length} opname tersimpan`;
  if(!list.length){box.innerHTML='<div class="empty-history">Belum ada riwayat opname.</div>';return}
  if(!filtered.length){box.innerHTML='<div class="empty-history">Tidak ada riwayat yang cocok dengan pencarian/filter.</div>';return}
  filtered.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||Number(b.shift)-Number(a.shift)).forEach(x=>{
    const row=document.createElement('div');row.className='history-row';
    row.innerHTML=`<div><strong>${formatDate(x.date)} — Shift ${x.shift}</strong><span>${x.count} hitungan tersimpan</span></div><div class="history-actions"><button type="button" class="open-history" data-id="${x.id}">Buka / Edit</button><button type="button" class="delete-history" data-id="${x.id}">Hapus</button></div>`;
    box.appendChild(row);
  });
  box.querySelectorAll('.open-history').forEach(b=>b.addEventListener('click',()=>openHistory(b.dataset.id)));
  box.querySelectorAll('.delete-history').forEach(b=>b.addEventListener('click',()=>deleteHistory(b.dataset.id)));
}
function openHistory(id){
  const x=getHistory().find(item=>item.id===id);if(!x)return;dateEl.value=x.date;shiftEl.value=x.shift;emptyState();Object.keys(x.data||{}).forEach(k=>state[k]=Array.isArray(x.data[k])?JSON.parse(JSON.stringify(x.data[k])):[]);editingHistoryId=id;persistDraft();render();renderHistory();toastMsg('Riwayat dibuka. Edit lalu simpan lagi');window.scrollTo({top:0,behavior:'smooth'});
}
function deleteHistory(id){
  const list=getHistory(),x=list.find(item=>item.id===id);if(!x)return;if(!confirm(`Hapus opname ${formatDate(x.date)} Shift ${x.shift}?`))return;saveHistory(list.filter(item=>item.id!==id));if(editingHistoryId===id){editingHistoryId=null;emptyState();persistDraft();render()}renderHistory();toastMsg('Riwayat dihapus');
}
function newOpname(){if(!confirm('Mulai opname baru? Pastikan opname yang sekarang sudah disimpan jika ingin masuk riwayat.'))return;emptyState();editingHistoryId=null;dateEl.value=new Date().toISOString().slice(0,10);shiftEl.value='2';persistDraft();render();toastMsg('Opname baru siap')}
function resetCurrent(){if(!confirm('Kosongkan semua hitungan opname yang sedang dikerjakan?'))return;emptyState();persistDraft();render();toastMsg('Semua hitungan dikosongkan')}

dateEl.addEventListener('change',()=>{persistDraft();generateWA(false)});
shiftEl.addEventListener('change',()=>{persistDraft();generateWA(false)});
document.getElementById('generateBtn').addEventListener('click',generateAndSave);
document.getElementById('copyBtn').addEventListener('click',async()=>{generateWA(false);try{await navigator.clipboard.writeText(document.getElementById('waOutput').value);toastMsg('Format WA sudah dicopy ✓')}catch{document.getElementById('waOutput').select();document.execCommand('copy');toastMsg('Teks sudah dicopy')}});
document.getElementById('newBtn').addEventListener('click',newOpname);
document.getElementById('resetBtn').addEventListener('click',resetCurrent);
document.getElementById('historyBtn').addEventListener('click',()=>{document.getElementById('historyPanel').classList.toggle('hidden');renderHistory()});
['historySearch','historyDateFilter','historyShiftFilter'].forEach(id=>document.getElementById(id).addEventListener(id==='historySearch'?'input':'change',renderHistory));
document.getElementById('clearHistoryFilters').addEventListener('click',()=>{document.getElementById('historySearch').value='';document.getElementById('historyDateFilter').value='';document.getElementById('historyShiftFilter').value='all';renderHistory();toastMsg('Filter riwayat direset')});

const today=new Date();dateEl.value=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
loadDraft();render();renderHistory();

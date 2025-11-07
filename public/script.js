// Utility
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);
const toast = txt => { const t = qs('#toast'); t.textContent = txt; t.style.display='block'; setTimeout(()=>t.style.display='none',2500); }

// Tabs
qsa('.tab').forEach(tab=>tab.addEventListener('click',()=>{
  qsa('.tab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  const name = tab.dataset.tab;
  qsa('.form-section').forEach(s=>s.style.display='none');
  qs(`#${name}-section`).style.display='block';
}))

// Data model stored in localStorage under key 'qlkh_data'
function loadData(){ try{return JSON.parse(localStorage.getItem('qlkh_data')||'{}')}catch(e){return{}} }
function saveData(obj){ localStorage.setItem('qlkh_data', JSON.stringify(obj||{})) }

// Create item UI
function makeItemHtml(type, idx, data={}){
  const id = `${type}-item-${Date.now()}-${Math.floor(Math.random()*999)}`;
  return `
    <div class="item-card" data-id="${id}">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="flex:2"><label>Tên</label><input type="text" class="item-name" value="${data.name||''}"></div>
        <div style="flex:1"><label>Năm</label><input type="text" class="item-year" value="${data.year||''}"></div>
        <div style="flex:1"><label>Vai trò</label><input type="text" class="item-role" value="${data.role||''}"></div>
      </div>
      <div style="margin-top:8px"><label>Ghi chú / Mô tả</label><textarea class="item-note">${data.note||''}</textarea></div>
      <div style="margin-top:8px"><label>Minh chứng (PDF, ảnh)</label><input type="file" class="item-file" accept="application/pdf,image/*"></div>
      <div class="item-actions">
        <button class="small save-item ghost">Lưu mục</button>
        <button class="small del-item ghost">Xóa mục</button>
      </div>
    </div>
  `;
}

// Functions to manage adding items per section
function setupSection(type){
  const addBtn = qs(`#${type}-add`);
  const container = qs(`#${type}-items`);
  const saveBtn = qs(`#${type}-save`);
  const resetBtn = qs(`#${type}-reset`);

  function addItem(data){
    const count = container.querySelectorAll('.item-card').length;
    if(count>=10){ toast('Đã đạt tối đa 10 mục cho tab này'); return }
    container.insertAdjacentHTML('beforeend', makeItemHtml(type, count+1, data));
    attachItemListeners(container.lastElementChild);
  }

  addBtn.addEventListener('click', ()=> addItem());
  resetBtn.addEventListener('click', ()=> container.innerHTML='');

  saveBtn.addEventListener('click', ()=>{
    // Collect data
    const dept = qs(`#${type}-department`) ? qs(`#${type}-department`).value : '';
    const items = Array.from(container.querySelectorAll('.item-card')).map(card=>{
      const fileInput = card.querySelector('.item-file');
      const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      let fileMeta = null;
      if(file){
        // store file metadata and an object URL in memory; we can't persist file bytes into localStorage reliably.
        fileMeta = {name:file.name, size:file.size, type:file.type, url: URL.createObjectURL(file)};
      }
      return {
        id: card.dataset.id,
        name: card.querySelector('.item-name').value,
        year: card.querySelector('.item-year').value,
        role: card.querySelector('.item-role').value,
        note: card.querySelector('.item-note').value,
        file: fileMeta
      }
    });

    // simulate saving with progress bar
    const bar = qs('#savingBar'); const prog = qs('#savingProgress');
    bar.style.display='block'; prog.style.width='0%';
    let p=0; const intr = setInterval(()=>{ p += Math.random()*25; if(p>100)p=100; prog.style.width = p+'%'; if(p>=100){ clearInterval(intr); setTimeout(()=>{ bar.style.display='none'; prog.style.width='0%'; toast('Đã lưu thông tin thành công'); },400); } }, 250);

    // merge into localStorage
    const db = loadData(); db[type] = db[type] || {department:dept, items:[]}; db[type].department = dept; db[type].items = items;
    saveData(db);
  });

  // initial load if any
  const db = loadData(); if(db[type] && db[type].items){ container.innerHTML=''; db[type].items.forEach(it=> addItem(it)); }

  function attachItemListeners(card){
    // card is element
    card.querySelector('.del-item').addEventListener('click', ()=>{ card.remove(); });
    card.querySelector('.save-item').addEventListener('click', ()=>{ toast('Mục đã được cập nhật (cục bộ)'); });
  }
}

['detai','baibao','sach','hd','gt'].forEach(setupSection);

// Wire view data modal
const viewBtn = qs('#viewDataBtn'); const modal = qs('#dataModal'); const dataContent = qs('#dataContent'); const closeModal = qs('#closeModal');
viewBtn.addEventListener('click', ()=>{
  renderData(); modal.style.display='flex';
});
closeModal.addEventListener('click', ()=> modal.style.display='none');

function renderData(){
  const db = loadData();
  if(Object.keys(db).length===0){ dataContent.innerHTML='<p>Chưa có dữ liệu nào. Hãy thêm và lưu thông tin.</p>'; return }
  let html = '';
  for(const key of ['detai','baibao','sach','hd','gt']){
    if(!db[key] || !db[key].items || db[key].items.length===0) continue;
    html += `<h4 style="margin-top:14px">${sectionTitle(key)} <small style='color:var(--muted)'>(${db[key].department||'Chưa chọn khoa'})</small></h4>`;
    html += `<table><thead><tr><th>Tên</th><th>Năm</th><th>Vai trò</th><th>Ghi chú</th><th>Minh chứng</th></tr></thead><tbody>`;
    db[key].items.forEach(it=>{
      const fileLink = it.file ? `<a href="${it.file.url}" download="${it.file.name}">Tải: ${it.file.name}</a>` : 'Không có';
      html += `<tr><td>${escapeHtml(it.name||'')}</td><td>${escapeHtml(it.year||'')}</td><td>${escapeHtml(it.role||'')}</td><td>${escapeHtml(it.note||'')}</td><td>${fileLink}</td></tr>`;
    })
    html += `</tbody></table>`;
  }
  dataContent.innerHTML = html;
}

function sectionTitle(k){ switch(k){case 'detai': return 'Đề tài nghiên cứu'; case 'baibao': return 'Bài báo khoa học'; case 'sach': return 'Sách / Giáo trình'; case 'hd': return 'Hướng dẫn SV'; case 'gt': return 'Giải thưởng'; default: return k } }

function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

// Export JSON
qs('#exportJsonBtn').addEventListener('click', ()=>{
  const db = loadData(); const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = 'qlkh_data.json'; a.click(); URL.revokeObjectURL(url);
});

// Search / filter inside modal
qs('#searchInput').addEventListener('input', ()=>{
  const q = qs('#searchInput').value.toLowerCase(); const db = loadData(); if(!q){ renderData(); return }
  let html='';
  for(const k in db){ if(!db[k]||!db[k].items) continue; html += `<h4>${sectionTitle(k)}</h4><table><thead><tr><th>Tên</th><th>Năm</th><th>Ghi chú</th></tr></thead><tbody>`;
    db[k].items.filter(it=> (it.name||'').toLowerCase().includes(q) || (it.role||'').toLowerCase().includes(q)).forEach(it=>{ html += `<tr><td>${escapeHtml(it.name)}</td><td>${escapeHtml(it.year)}</td><td>${escapeHtml(it.note)}</td></tr>` });
    html += `</tbody></table>`;
  }
  dataContent.innerHTML = html || '<p>Không tìm thấy kết quả.</p>';
});

// Filter by department
qs('#filterDept').addEventListener('input', ()=>{
  const dep = qs('#filterDept').value.toLowerCase(); const db = loadData(); if(!dep){ renderData(); return }
  let html='';
  for(const k in db){ if(!db[k]||!db[k].items) continue; if((db[k].department||'').toLowerCase().includes(dep)){
    html += `<h4>${sectionTitle(k)} <small style='color:var(--muted)'>${db[k].department}</small></h4><table><thead><tr><th>Tên</th><th>Năm</th><th>Ghi chú</th></tr></thead><tbody>`;
    db[k].items.forEach(it=> html += `<tr><td>${escapeHtml(it.name)}</td><td>${escapeHtml(it.year)}</td><td>${escapeHtml(it.note)}</td></tr>`);
    html += `</tbody></table>`;
  }}
  dataContent.innerHTML = html || '<p>Không tìm thấy kết quả.</p>';
});

// Download all minh chứng
qs('#downloadAllFiles').addEventListener('click', ()=>{
  const db = loadData(); let cnt=0;
  for(const k in db){ if(!db[k]||!db[k].items) continue; db[k].items.forEach(it=>{ if(it.file && it.file.url){ const a=document.createElement('a'); a.href=it.file.url; a.download = it.file.name; a.click(); cnt++; }}); }
  toast(cnt ? `Đang tải ${cnt} minh chứng...` : 'Không có minh chứng để tải');
});

// Helpers for initial demo
(function seedDemo(){ const db = loadData(); if(!db.detai){ db.detai = {department:'Khoa CNTT', items:[{id:'sample-1',name:'Nghiên cứu ABC',year:'2024',role:'Chủ nhiệm',note:'Ví dụ minh họa', file:null}]}; saveData(db);} })();

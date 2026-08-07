(() => {
  const mapStyle = {version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]};
  let map = null, userMarker = null, storeMarkers = [], selected = null;
  const $ = (s) => document.querySelector(s);
  const toastSafe = (m) => typeof window.toast === 'function' ? window.toast(m) : alert(m);

  function openLocationPicker() {
    const content = $('#modalContent');
    content.innerHTML = `<div class="location-modal"><div class="location-head"><div><span class="mini-label">التوصيل</span><h2>حدد موقع التوصيل 📍</h2></div><button class="location-use" id="useMyLocation">⌖ استخدم موقعي</button></div><p class="muted">اسمح بالموقع لنحدد مكانك بدقة، أو اضغط على الخريطة وحدد النقطة يدوياً.</p><div id="deliveryMap" class="delivery-map"></div><div class="location-coords" id="locationCoords">لم يتم تحديد الموقع بعد</div><button class="primary" id="confirmLocation" disabled>تأكيد موقع التوصيل</button></div>`;
    if (typeof showModal === 'function') showModal();
    setTimeout(initMap, 0);
    $('#useMyLocation').onclick = requestLocation;
    $('#confirmLocation').onclick = confirmLocation;
  }

  function initMap() {
    if (!window.maplibregl) return toastSafe('تعذر تحميل الخريطة حالياً. تأكد من اتصال الإنترنت.');
    map = new maplibregl.Map({container:'deliveryMap',style:mapStyle,center:[35.9,33.5],zoom:5,attributionControl:true});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-left');
    map.on('load',loadStores);
    map.on('click',(e)=>selectLocation(e.lngLat.lat,e.lngLat.lng));
    requestLocation();
  }

  function requestLocation() {
    if (!navigator.geolocation) return toastSafe('جهازك لا يدعم تحديد الموقع.');
    navigator.geolocation.getCurrentPosition((pos)=>{const {latitude,longitude}=pos.coords;selectLocation(latitude,longitude,true);if(map)map.flyTo({center:[longitude,latitude],zoom:14,essential:true});},()=>toastSafe('لم نتمكن من الوصول إلى موقعك. يمكنك تحديده يدوياً على الخريطة.'),{enableHighAccuracy:true,timeout:10000,maximumAge:30000});
  }

  function selectLocation(lat,lng,fromGps=false) {
    selected={latitude:Number(lat),longitude:Number(lng),source:fromGps?'gps':'map',selected_at:new Date().toISOString()};
    if(userMarker)userMarker.remove();
    userMarker=new maplibregl.Marker({color:'#111827'}).setLngLat([lng,lat]).addTo(map);
    const coords=$('#locationCoords'); if(coords)coords.textContent=`📍 ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    const confirm=$('#confirmLocation'); if(confirm)confirm.disabled=false;
  }

  function confirmLocation() {
    if(!selected)return;
    localStorage.setItem('delivery_location',JSON.stringify(selected));
    const pill=document.querySelector('.location-pill span'); if(pill)pill.textContent='موقع التوصيل محدد ✓';
    if(typeof closeModal==='function')closeModal();
    toastSafe('تم حفظ موقع التوصيل ✅');
  }

  async function loadStores() {
    if(!window.supabaseClient||!map)return;
    const {data,error}=await window.supabaseClient.from('stores').select('id,name,category,address,latitude,longitude,whatsapp,logo_url').eq('is_active',true);
    if(error||!data)return;
    storeMarkers.forEach(m=>m.remove());
    storeMarkers=data.filter(s=>Number.isFinite(Number(s.latitude))&&Number.isFinite(Number(s.longitude))).map(s=>{
      const popup=new maplibregl.Popup({offset:20}).setHTML(`<strong>${escapeHtml(s.name)}</strong><br><small>${escapeHtml(s.category||'')}</small>${s.address?`<br><small>${escapeHtml(s.address)}</small>`:''}`);
      return new maplibregl.Marker({color:'#ef4444'}).setLngLat([s.longitude,s.latitude]).setPopup(popup).addTo(map);
    });
  }

  function escapeHtml(value=''){return String(value).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}

  function setupAppDrawer(){
    if($('#storeyDrawer'))return;
    const style=document.createElement('style');
    style.textContent=`
      .options-menu{position:fixed!important;top:0!important;right:0!important;height:100dvh!important;width:min(330px,88vw)!important;max-height:none!important;border:0!important;border-radius:24px 0 0 24px!important;padding:86px 14px 24px!important;box-shadow:-22px 0 70px rgba(15,23,42,.22)!important;overflow-y:auto!important;background:#fff!important;z-index:100!important;transform:translateX(105%);opacity:0;visibility:hidden;transition:transform .28s ease,opacity .2s ease,visibility .28s!important}
      .options-menu.storey-open{transform:translateX(0);opacity:1;visibility:visible}
      .options-menu button{display:block!important;width:100%!important;text-align:right!important;border:0!important;background:transparent!important;border-radius:14px!important;padding:13px 14px!important;margin:2px 0!important;font:600 14px inherit!important;color:#202532!important}
      .options-menu button:hover,.options-menu button:active{background:#f3f5f8!important}
      .options-menu .drawer-title{font-size:12px;font-weight:800;color:#8a91a0;padding:16px 14px 7px;border-top:1px solid #eef0f4;margin-top:8px}
      .storey-scrim{position:fixed;inset:0;background:rgba(10,14,23,.38);backdrop-filter:blur(2px);z-index:90;opacity:0;visibility:hidden;transition:.25s}
      .storey-scrim.storey-open{opacity:1;visibility:visible}
      @media(max-width:600px){.options-menu{width:88vw!important}.options-menu button{padding:14px!important;font-size:14px!important}}
      body.storey-drawer-open{overflow:hidden}
    `;
    document.head.appendChild(style);
    const menu=$('#optionsMenu'), btn=$('#menuBtn');
    if(!menu||!btn)return;
    menu.id='storeyDrawer';
    const title=document.createElement('div'); title.className='drawer-title'; title.textContent='تصفح';
    const cats=[['all','📂 كل الفئات'],['طعام ومطاعم','🍔 طعام ومطاعم'],['بقالة وسوبرماركت','🛒 بقالة وسوبرماركت'],['ملابس وأحذية','👕 ملابس وأحذية'],['عقارات','🏠 عقارات'],['سيارات','🚗 سيارات'],['إلكترونيات','📱 إلكترونيات'],['أدوات وصيانة','🔧 أدوات وصيانة'],['صيدليات','💊 صيدليات'],['ورد وهدايا','💐 ورد وهدايا'],['أثاث وديكور','🛋️ أثاث وديكور'],['صالونات','💇 صالونات'],['خدمات منزلية','🧹 خدمات منزلية'],['نقل وتوصيل','🚚 نقل وتوصيل'],['فنادق','🏨 فنادق'],['تذاكر وفعاليات','🎟️ تذاكر وفعاليات'],['كتب وقرطاسية','📚 كتب وقرطاسية'],['حيوانات أليفة','🐶 حيوانات أليفة'],['أطفال','👶 أطفال'],['رياضة','⚽ رياضة'],['ألعاب','🎮 ألعاب'],['معدات','🛠️ معدات'],['مجوهرات','💎 مجوهرات'],['تجميل وعناية','🧴 تجميل وعناية'],['مقاهي','☕ مقاهي'],['مخابز','🥖 مخابز'],['حلويات','🍰 حلويات']];
    menu.appendChild(title);
    cats.forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.className='drawer-category';b.textContent=label;b.dataset.drawerCategory=key;menu.appendChild(b)});
    const scrim=document.createElement('div');scrim.className='storey-scrim';scrim.id='storeyScrim';document.body.appendChild(scrim);
    const open=()=>{menu.hidden=false;menu.classList.add('storey-open');scrim.classList.add('storey-open');document.body.classList.add('storey-drawer-open');btn.setAttribute('aria-expanded','true')};
    const close=()=>{menu.classList.remove('storey-open');scrim.classList.remove('storey-open');document.body.classList.remove('storey-drawer-open');btn.setAttribute('aria-expanded','false');setTimeout(()=>{if(!menu.classList.contains('storey-open'))menu.hidden=true},280)};
    btn.onclick=(e)=>{e.stopPropagation();menu.classList.contains('storey-open')?close():open()};scrim.onclick=close;
    menu.querySelectorAll('button').forEach(b=>{b.addEventListener('click',()=>{if(b.dataset.drawerCategory){close();openCategoryPage(b.dataset.drawerCategory)}})});
    menu.querySelectorAll('button[data-action="location"],button[data-action="addStore"],button[data-action="settings"]').forEach(b=>b.addEventListener('click',close));
    menu.querySelectorAll('#loginOption,#signupOption,#aboutOption').forEach(b=>b.addEventListener('click',close));
  }

  function openCategoryPage(category){
    const browse=$('#browse'),home=$('#hero');
    if(!browse){if(category==='all')return;return typeof search==='function'?search(category):null}
    $('#categoriesSection')?.setAttribute('hidden','');$('#featuredSection')?.setAttribute('hidden','');$('#joinBanner')?.setAttribute('hidden','');
    home?.setAttribute('hidden','');browse.classList.remove('hidden');
    const title=category==='all'?'كل الفئات':category;
    $('#pageContent').innerHTML=`<div class="browse-head"><span class="mini-label">تصفح</span><h1>${escapeHtml(title)}</h1><p class="muted">اختر متجراً لعرض المنتجات المتاحة.</p></div><div class="store-grid" id="browseGrid"></div>`;
    const grid=$('#browseGrid');
    const list=category==='all'?stores:stores.filter(s=>s.cat===category);
    grid.innerHTML=list.length?list.map(card).join(''):`<div class="empty-browse"><strong>لا توجد متاجر ضمن هذه الفئة حالياً.</strong><p>يمكنك تجربة البحث من المساعد.</p></div>`;
    if(typeof bindCards==='function')bindCards(grid);window.scrollTo({top:0,behavior:'smooth'});
  }

  function card(s){return `<article class="store-card" data-store="${s.id}"><div class="store-image">${s.icon}</div><div class="store-info"><h3>${escapeHtml(s.name)}</h3><div class="store-meta">${escapeHtml(s.meta)}</div><span class="tag">${escapeHtml(s.tag)}</span></div></article>`}
  function escapeCardStores(){return typeof window.stores!=='undefined'?window.stores:[]}

  window.openLocationPicker=openLocationPicker;
  document.addEventListener('click',(e)=>{const trigger=e.target.closest('[data-action="location"]');if(trigger){e.preventDefault();openLocationPicker();}});
  document.addEventListener('DOMContentLoaded',setupAppDrawer);
  setTimeout(setupAppDrawer,50);
})();
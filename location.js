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
    storeMarkers=data.filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).map(s=>{
      const popup=new maplibregl.Popup({offset:20}).setHTML(`<strong>${escapeHtml(s.name)}</strong><br><small>${escapeHtml(s.category||'')}</small>${s.address?`<br><small>${escapeHtml(s.address)}</small>`:''}`);
      return new maplibregl.Marker({color:'#ef4444'}).setLngLat([s.longitude,s.latitude]).setPopup(popup).addTo(map);
    });
  }

  function escapeHtml(value=''){return String(value).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
  window.openLocationPicker=openLocationPicker;
  document.addEventListener('click',(e)=>{const trigger=e.target.closest('[data-action="location"]');if(trigger){e.preventDefault();openLocationPicker();}});
})();
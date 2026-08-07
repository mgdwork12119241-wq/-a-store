(() => {
  const esc2 = v => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money2 = (v,c='SYP') => v == null || v === '' ? 'السعر عند الطلب' : new Intl.NumberFormat('ar-SY',{maximumFractionDigits:2}).format(Number(v))+' '+(c==='EUR'?'€':c==='USD'?'$':'ل.س');
  async function getStore(id){
    const db=window.supabaseClient;
    if(db){
      const r=await db.from('stores').select('id,name,category,address,latitude,longitude,whatsapp,logo_url,description,is_active').eq('id',id).maybeSingle();
      if(!r.error&&r.data){const p=await db.from('products').select('id,store_id,name,description,price,currency,image_url,video_url,is_active').eq('store_id',id).eq('is_active',true).order('created_at',{ascending:false});return {...r.data,products:p.data||[]};}
    }
    return null;
  }
  async function storePage(id){
    let s=await getStore(id); if(!s)return;
    document.querySelectorAll('main>section').forEach(x=>x.hidden=true);
    let page=document.getElementById('storePage');
    if(!page){page=document.createElement('section');page.id='storePage';page.className='browse-page';document.querySelector('main').appendChild(page)}
    page.hidden=false;
    const storeIcon=({مقاهي:'☕','طعام ومطاعم':'🍔','بقالة وسوبرماركت':'🛒','عقارات':'🏠','سيارات':'🚗','إلكترونيات':'📱','أدوات وصيانة':'🔧'}[s.category]||'🏪');
    page.innerHTML=`<button class="browse-back" id="storeBack">→ العودة للمتاجر</button><div class="store-page-head"><div class="store-page-logo">${s.logo_url?`<img src="${esc2(s.logo_url)}" alt="${esc2(s.name)}" loading="lazy">`:storeIcon}</div><div><span class="mini-label">${esc2(s.category||'متجر')}</span><h1>${esc2(s.name)}</h1><p class="muted">${esc2(s.description||'متجر متاح الآن')} ${s.address?' · '+esc2(s.address):''}</p></div></div><div class="store-actions">${s.whatsapp?'<button class="primary" id="storePageWA">طلب عبر WhatsApp</button>':''}<button class="text-btn" id="storePageMap">📍 عرض موقع المتجر</button></div><div class="section-head"><div><span class="mini-label">المنتجات</span><h2>منتجات ${esc2(s.name)}</h2></div><span class="muted">${s.products.length} منتج</span></div><div class="product-grid" id="storeProducts"></div>`;
    const grid=page.querySelector('#storeProducts');
    grid.innerHTML=s.products.length?s.products.map(p=>`<article class="product-card product-preview-card"><div class="product-image">${p.image_url?`<img src="${esc2(p.image_url)}" alt="${esc2(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`:storeIcon}<span class="label">${esc2(s.category||'منتج')}</span></div><div class="product-info"><h3>${esc2(p.name)}</h3><p>${esc2(p.description||'')}</p>${p.video_url?'<small>🎬 فيديو متاح</small>':''}<div class="price"><span>${money2(p.price,p.currency)}</span><button class="buy-btn" data-add="${esc2(p.id)}" data-store="${esc2(s.id)}">+ أضف للسلة</button></div></div></article>`).join(''):'<div class="empty">لا توجد منتجات منشورة حالياً.</div>';
    if(typeof window.bindCards==='function')window.bindCards(grid);
    page.querySelector('#storeBack').onclick=()=>window.openCategory?.(s.category||'all');
    if(page.querySelector('#storePageWA'))page.querySelector('#storePageWA').onclick=()=>window.sendWhatsApp?.([{store:s.name,name:'طلب مباشر',price:''}],s.whatsapp);
    page.querySelector('#storePageMap').onclick=()=>window.openLocationPicker?.();
    scrollTo({top:0,behavior:'smooth'});
  }
  window.openStore=storePage;
  const style=document.createElement('style');style.textContent=`.store-page-head{display:flex;gap:16px;align-items:center;background:#fff;border-radius:24px;padding:20px;margin:14px 0;box-shadow:0 8px 30px rgba(0,0,0,.06)}.store-page-logo{width:76px;height:76px;border-radius:22px;display:grid;place-items:center;background:#f1f7f3;font-size:38px;overflow:hidden}.store-page-logo img{width:100%;height:100%;object-fit:cover}.store-actions{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 22px}.store-actions button{min-height:44px}.product-preview-card{cursor:default}.product-preview-card .buy-btn{white-space:nowrap}`;document.head.appendChild(style);
})();
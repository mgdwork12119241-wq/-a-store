(() => {
  const esc2 = v => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money2 = (v,c='SYP') => v == null || v === '' ? 'السعر عند الطلب' : new Intl.NumberFormat('ar-SY',{maximumFractionDigits:2}).format(Number(v))+' '+(c==='EUR'?'€':c==='USD'?'$':'ل.س');
  function storePage(id){
    const s=(window.stores||[]).find(x=>String(x.id)===String(id)); if(!s)return;
    document.querySelectorAll('main>section').forEach(x=>x.hidden=true);
    let page=document.getElementById('storePage');
    if(!page){page=document.createElement('section');page.id='storePage';page.className='browse-page';document.querySelector('main').appendChild(page)}
    page.hidden=false;
    page.innerHTML=`<button class="browse-back" id="storeBack">→ العودة للمتجرات</button><div class="store-page-head"><div class="store-page-logo">${s.logo_url?`<img src="${esc2(s.logo_url)}" alt="" loading="lazy">`:esc2(s.icon||'🏪')}</div><div><span class="mini-label">${esc2(s.category||'متجر')}</span><h1>${esc2(s.name)}</h1><p class="muted">${esc2(s.description||'متجر متاح الآن')} · ${esc2(s.address||'')}</p></div></div><div class="store-actions">${s.whatsapp?'<button class="primary" id="storePageWA">طلب عبر WhatsApp</button>':''}<button class="text-btn" id="storePageMap">📍 عرض على الخريطة</button></div><div class="section-head"><div><span class="mini-label">المنتجات</span><h2>منتجات ${esc2(s.name)}</h2></div><span class="muted">${s.products?.length||0} منتج</span></div><div class="product-grid" id="storeProducts"></div>`;
    const grid=page.querySelector('#storeProducts');
    grid.innerHTML=s.products?.length?s.products.map(p=>`<article class="product-card product-preview-card"><div class="product-image">${p.image_url?`<img src="${esc2(p.image_url)}" alt="${esc2(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`:esc2(s.icon||'📦')}<span class="label">${esc2(s.category||'منتج')}</span></div><div class="product-info"><h3>${esc2(p.name)}</h3><p>${esc2(p.description||'')}</p><div class="price"><span>${money2(p.price,p.currency)}</span><button class="buy-btn" data-page-add="${esc2(p.id)}">+ أضف للسلة</button></div></div></article>`).join(''):'<div class="empty">لا توجد منتجات منشورة حالياً.</div>';
    grid.querySelectorAll('[data-page-add]').forEach(b=>b.onclick=()=>{const p=s.products.find(x=>String(x.id)===String(b.dataset.pageAdd));if(!p)return;window.cart=window.cart||[];window.cart.push({storeId:s.id,store:s.name,storeWhatsapp:s.whatsapp||'',name:p.name,price:money2(p.price,p.currency)});if(typeof window.saveCart==='function')window.saveCart();if(typeof window.toast==='function')window.toast('تمت إضافة '+p.name+' إلى السلة 🛒')});
    page.querySelector('#storeBack').onclick=()=>{if(window.openCategory)window.openCategory(s.category||'all');};
    if(page.querySelector('#storePageWA'))page.querySelector('#storePageWA').onclick=()=>{if(s.whatsapp&&window.sendWhatsApp)window.sendWhatsApp([{store:s.name,name:'طلب مباشر',price:''}],s.whatsapp)};
    page.querySelector('#storePageMap').onclick=()=>{if(window.openLocationPicker)window.openLocationPicker();};
    scrollTo({top:0,behavior:'smooth'});
  }
  window.openStore = storePage;
  const style=document.createElement('style');style.textContent=`.store-page-head{display:flex;gap:16px;align-items:center;background:#fff;border-radius:24px;padding:20px;margin:14px 0;box-shadow:0 8px 30px rgba(0,0,0,.06)}.store-page-logo{width:76px;height:76px;border-radius:22px;display:grid;place-items:center;background:#f1f7f3;font-size:38px;overflow:hidden}.store-page-logo img{width:100%;height:100%;object-fit:cover}.store-actions{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 22px}.store-actions button{min-height:44px}.product-preview-card{cursor:default}.product-preview-card .buy-btn{white-space:nowrap}`;document.head.appendChild(style);
})();
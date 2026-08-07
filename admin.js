(() => {
  const ADMIN_EMAIL='mgdwork12119241@gmail.com';
  const e=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const db=()=>window.supabaseClient;
  function adminModal(){
    const c=document.querySelector('#modalContent');
    c.innerHTML=`<div class="admin-login"><span class="mini-label">الحساب</span><h2>تسجيل الدخول</h2><p class="muted">سجّل بحسابك، وإذا كان الحساب الإداري المصرّح به ستظهر لك لوحة الإدارة تلقائياً.</p><label>البريد الإلكتروني<input id="adminEmail" type="email" autocomplete="email" placeholder="البريد الإلكتروني"></label><label>كلمة المرور<input id="adminPassword" type="password" autocomplete="current-password" placeholder="كلمة المرور"></label><button class="primary" id="adminLoginBtn">دخول</button><p id="adminLoginMsg" class="muted"></p></div>`;
    window.showModal?.();
    c.querySelector('#adminLoginBtn').onclick=async()=>{
      const email=c.querySelector('#adminEmail').value.trim().toLowerCase(),password=c.querySelector('#adminPassword').value;
      const msg=c.querySelector('#adminLoginMsg');
      msg.textContent='جاري تسجيل الدخول...';
      if(!db()){msg.textContent='خدمة الحساب غير متاحة حالياً.';return;}
      const r=await db().auth.signInWithPassword({email,password});
      if(r.error){msg.textContent='تعذر تسجيل الدخول. تأكد من البريد وكلمة المرور.';return;}
      if((r.data.user?.email||'').toLowerCase()!==ADMIN_EMAIL){await db().auth.signOut();msg.textContent='تم تسجيل الدخول، لكن هذا الحساب ليس حساب إدارة.';return;}
      window.closeModal?.();adminPage();
    };
  }
  async function adminPage(){
    const {data:{user}}=await db().auth.getUser();
    if(!user||user.email.toLowerCase()!==ADMIN_EMAIL){adminModal();return;}
    document.querySelectorAll('main>section').forEach(x=>x.hidden=true);
    let p=document.querySelector('#adminPage');if(!p){p=document.createElement('section');p.id='adminPage';p.className='browse-page';document.querySelector('main').appendChild(p)}
    p.hidden=false;
    const stores=(window.stores||[]);
    p.innerHTML=`<div class="admin-head"><div><span class="mini-label">لوحة الإدارة</span><h1>إدارة المتاجر والمنتجات</h1><p class="muted">مرحباً بك. أضف متجرًا ثم أضف منتجاته بالصور والأسعار.</p></div><button class="text-btn" id="adminLogout">تسجيل الخروج</button></div><div class="admin-grid"><div class="admin-card"><h2>إضافة متجر</h2><input id="sName" placeholder="اسم المتجر"><input id="sCat" placeholder="الفئة"><input id="sAddress" placeholder="العنوان"><input id="sLat" type="number" step="any" placeholder="خط العرض"><input id="sLng" type="number" step="any" placeholder="خط الطول"><input id="sWa" placeholder="رقم WhatsApp"><input id="sLogo" placeholder="رابط صورة المتجر"><textarea id="sDesc" placeholder="وصف المتجر"></textarea><button class="primary" id="addStoreAdmin">حفظ المتجر</button><p id="storeMsg" class="muted"></p></div><div class="admin-card"><h2>إضافة منتج</h2><select id="pStore"><option value="">اختر المتجر</option>${stores.map(s=>`<option value="${e(s.id)}">${e(s.name)}</option>`).join('')}</select><input id="pName" placeholder="اسم المنتج"><textarea id="pDesc" placeholder="تفاصيل المنتج"></textarea><input id="pPrice" type="number" step="0.01" placeholder="السعر"><select id="pCurrency"><option>SYP</option><option>USD</option><option>EUR</option></select><input id="pImage" placeholder="رابط صورة المنتج"><input id="pVideo" placeholder="رابط فيديو المنتج"><button class="primary" id="addProductAdmin">حفظ المنتج</button><p id="productMsg" class="muted"></p></div></div><div class="admin-card"><h2>المتاجر الحالية</h2><div class="admin-store-list">${stores.map(s=>`<div><b>${e(s.name)}</b><small>${e(s.category||'')} · ${s.products?.length||0} منتج</small><button data-open-admin="${e(s.id)}">فتح المتجر</button></div>`).join('')||'<p class="muted">لا توجد متاجر بعد.</p>'}</div></div>`;
    p.querySelector('#adminLogout').onclick=async()=>{await db().auth.signOut();window.resetHome?.()};
    p.querySelector('#addStoreAdmin').onclick=async()=>{const q=await db().rpc('admin_add_store',{p_name:p.querySelector('#sName').value,p_category:p.querySelector('#sCat').value,p_address:p.querySelector('#sAddress').value,p_latitude:Number(p.querySelector('#sLat').value)||0,p_longitude:Number(p.querySelector('#sLng').value)||0,p_whatsapp:p.querySelector('#sWa').value,p_logo_url:p.querySelector('#sLogo').value||null,p_description:p.querySelector('#sDesc').value||null});p.querySelector('#storeMsg').textContent=q.error?'تعذر حفظ المتجر.':'تم حفظ المتجر بنجاح ✅';if(!q.error){await window.loadCatalog?.();adminPage()}};
    p.querySelector('#addProductAdmin').onclick=async()=>{const q=await db().rpc('admin_add_product',{p_store_id:p.querySelector('#pStore').value,p_name:p.querySelector('#pName').value,p_description:p.querySelector('#pDesc').value,p_price:Number(p.querySelector('#pPrice').value)||0,p_currency:p.querySelector('#pCurrency').value,p_image_url:p.querySelector('#pImage').value||null,p_video_url:p.querySelector('#pVideo').value||null});p.querySelector('#productMsg').textContent=q.error?'تعذر حفظ المنتج.':'تم حفظ المنتج بنجاح ✅';if(!q.error){await window.loadCatalog?.();adminPage()}};
    p.querySelectorAll('[data-open-admin]').forEach(b=>b.onclick=()=>window.openStore?.(b.dataset.openAdmin));scrollTo({top:0,behavior:'smooth'});
  }
  window.adminModal=adminModal;window.adminPage=adminPage;
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action="login"]');if(b){e.preventDefault();window.closeDrawer?.();adminModal()}});
  const st=document.createElement('style');st.textContent=`.admin-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin:10px 0 20px}.admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.admin-card{background:#fff;border-radius:22px;padding:18px;margin-bottom:16px;box-shadow:0 8px 30px rgba(0,0,0,.06)}.admin-card h2{margin-top:0}.admin-card input,.admin-card textarea,.admin-card select{width:100%;box-sizing:border-box;margin:6px 0;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font:inherit;background:#fff}.admin-card textarea{min-height:80px}.admin-store-list>div{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eee}.admin-store-list small{flex:1;color:#777}@media(max-width:700px){.admin-grid{grid-template-columns:1fr}.admin-head{display:block}}`;document.head.appendChild(st);
})();
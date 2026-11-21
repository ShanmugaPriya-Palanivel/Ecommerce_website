/* Customer storefront built on the existing shared Api/ProductService/CategoryService/CustomerService layer.
   Local mode is the default; Firebase Auth and Firestore REST are enabled by configuration. */
(function () {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = App.esc, money = App.money;
  const CART_KEY = 'markethub_cart_v1';
  const current = () => CustomerAuth.current();
  const cartRead = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}'); } catch { return {}; } };
  const cartSave = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
  const params = new URLSearchParams(location.search);
  const getCustomer = async () => {
    const s=current(); if(!s) return null;
    return CustomerService.get(s.customerId);
  };
  const getProfile = async (id) => (await Api.get('customerProfiles/'+id)) || {};
  const nav = () => {
    const s=current();
    const loginLinks = s ? `<a href="account.html">My Account</a><a href="#" data-customer-logout>Log out</a>` : `<a href="login.html">Log in</a><a href="signup.html">Register</a>`;
    const count = Object.values(cartRead()).reduce((a,x)=>a+Number(x),0);
    return `<header class="store-header"><nav class="store-nav"><a class="store-brand" href="home.html">Market<span>Hub</span></a><div class="store-links"><a href="home.html">Home</a><a href="products.html">Shop</a><a href="categories.html">Categories</a></div><form class="store-search" action="products.html"><input type="search" name="q" placeholder="Search products…" value="${esc(params.get('q')||'')}"></form><div class="store-actions">${loginLinks}<a href="cart.html">Cart (${count})</a></div></nav></header>`;
  };
  const footer = () => `<footer class="store-footer"><div class="store-footer-inner"><div><b>MarketHub</b><p>Everyday essentials, made simple.</p></div><div><a href="home.html">About Us</a><a href="home.html">Contact</a><a href="home.html">Help</a><a href="home.html">Privacy</a></div></div></footer>`;
  const shell = (html) => { $('#store-nav').innerHTML=nav(); $('#store-footer').innerHTML=footer(); $('#store-content').innerHTML=html; };
  const requireLogin = () => { if(!current()){ location.href='login.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search); return false;} return true; };
  const catName = async (id) => { const c=await CategoryService.get(id); return c?c.Name:'Uncategorised'; };
  const productCard = async (p) => `<article class="product-card">${App.img(p.Image,p.Title,'')}<div class="product-info"><div class="product-meta">${esc(await catName(p.Cat_ID))} · ${esc(p.ID)}</div><h3>${esc(p.Title)}</h3><div class="product-price">${money(p.Price)}</div><div class="product-meta">${p.Quantity>0?`${p.Quantity} available`:'Out of stock'}</div><div class="product-buttons"><a class="btn btn-ghost" href="product-details.html?id=${encodeURIComponent(p.ID)}">Details</a><button class="btn btn-primary" data-add="${esc(p.ID)}" ${p.Quantity<=0?'disabled':''}>Add</button></div></div></article>`;
  const activeProducts = async () => (await ProductService.list()).filter(p=>p.Active!==false);
  async function renderHome(){
    const [products,cats]=await Promise.all([activeProducts(),CategoryService.list()]);
    const featured=products.filter(p=>p.Quantity>0).slice(0,4);
    const catHtml=cats.map(c=>`<a class="category-card" href="products.html?category=${encodeURIComponent(c.ID)}">${App.catImg(c.ID,c.Name,'')}<b>${esc(c.Name)}</b></a>`).join('');
    const cards=await Promise.all(featured.map(productCard));
    shell(`<section class="store-hero"><div><span class="status-pill">Welcome to MarketHub</span><h1>Find the things you love, all in one place.</h1><p>Browse the catalogue, discover your favourites and enjoy a simple shopping experience.</p><a class="btn btn-primary" href="products.html">Explore products</a></div><div class="hero-art">🛍️</div></section><div class="section-head"><div><h2>Shop by category</h2><p>Explore categories managed by our store team.</p></div><a href="categories.html">View all</a></div><div class="category-grid">${catHtml||'<div class="empty-state">No categories available yet.</div>'}</div><div class="section-head"><div><h2>Featured products</h2><p>Currently active products in our catalogue.</p></div><a href="products.html">Shop all</a></div><div class="product-grid">${cards.join('')||'<div class="empty-state">No products available yet.</div>'}</div>`);
  }
  async function renderProducts(){
    const [all,cats]=await Promise.all([activeProducts(),CategoryService.list()]);
    const q=(params.get('q')||'').toLowerCase(), cat=params.get('category')||'';
    let list=all.filter(p=>(!q||`${p.Title} ${p.Description} ${p.ID}`.toLowerCase().includes(q))&&(!cat||p.Cat_ID===cat));
    const cards=await Promise.all(list.filter(p=>p.Quantity>0).map(productCard));
    shell(`<div class="section-head"><div><h1>Shop products</h1><p>Browse available products from MarketHub.</p></div></div><div class="store-toolbar"><input id="product-search" type="search" placeholder="Search products…" value="${esc(params.get('q')||'')}"><select id="category-filter"><option value="">All categories</option>${cats.map(c=>`<option value="${esc(c.ID)}" ${cat===c.ID?'selected':''}>${esc(c.Name)}</option>`).join('')}</select></div><div class="product-grid" id="product-results">${cards.join('')||'<div class="empty-state">No available products match your search.</div>'}</div>`);
    $('#product-search').addEventListener('input',App.debounce(()=>{params.set('q',$('#product-search').value);params.set('category',$('#category-filter').value);location.search=params.toString();},350));
    $('#category-filter').addEventListener('change',()=>{params.set('q',$('#product-search').value);params.set('category',$('#category-filter').value);location.search=params.toString();});
  }
  async function renderCategories(){
    const cats=await CategoryService.list();
    shell(`<div class="section-head"><div><h1>Categories</h1><p>Choose a category to browse its products.</p></div></div><div class="category-grid">${cats.map(c=>`<a class="category-card" href="products.html?category=${encodeURIComponent(c.ID)}">${App.catImg(c.ID,c.Name,'')}<b>${esc(c.Name)}</b></a>`).join('')||'<div class="empty-state">No categories available.</div>'}</div>`);
  }
  async function renderDetails(){
    const p=await ProductService.get(params.get('id'));
    if(!p||p.Active===false){shell('<div class="empty-state">This product is not available.</div>');return;}
    const category=await catName(p.Cat_ID);
    shell(`<div class="detail-layout"><div>${App.img(p.Image,p.Title,'detail-image')}</div><div><p class="muted">${esc(category)} · ${esc(p.ID)}</p><h1>${esc(p.Title)}</h1><div class="detail-price">${money(p.Price)}</div><p>${esc(p.Description||'')}</p><p><b>Availability:</b> ${p.Quantity>0?`${p.Quantity} in stock`:'Out of stock'}</p><label class="field" style="max-width:120px">Quantity<input id="detail-qty" class="qty-input" type="number" min="1" max="${p.Quantity}" value="1"></label><p><button class="btn btn-primary" id="detail-add" ${p.Quantity<=0?'disabled':''}>Add to cart</button></p></div></div>`);
    $('#detail-add').onclick=async()=>{try{await addCart(p.ID,Number($('#detail-qty').value));}catch(err){App.toast(err.message,'error');}};
  }
  async function addCart(id,qty=1){
    const p=await ProductService.get(id); if(!p||p.Active===false||p.Quantity<=0)throw new Error('This product is unavailable.');
    if(!Number.isInteger(qty)||qty<1)throw new Error('Quantity must be at least 1.');
    const c=cartRead(), next=Number(c[id]||0)+qty;
    if(next>p.Quantity)throw new Error(`Only ${p.Quantity} unit(s) are available.`);
    c[id]=next;cartSave(c);App.toast('Added to cart.');$('#store-nav').innerHTML=nav();
  }
  async function renderCart(){
    const c=cartRead(), rows=[];
    for(const [id,qty] of Object.entries(c)){const p=await ProductService.get(id);if(!p||p.Active===false){delete c[id];continue;}rows.push({p,qty:Number(qty)});}
    cartSave(c);
    const total=rows.reduce((s,r)=>s+r.p.Price*r.qty,0);
    shell(`<div class="section-head"><div><h1>Your cart</h1><p>Review items before checkout.</p></div><a href="products.html">Continue shopping</a></div>${rows.length?`<div class="store-panel">${rows.map(({p,qty})=>`<div class="cart-row"><a href="product-details.html?id=${encodeURIComponent(p.ID)}">${App.img(p.Image,p.Title,'')}</a><div><b>${esc(p.Title)}</b><div class="muted">${money(p.Price)} each · ${p.Quantity} in stock</div><button class="btn btn-ghost btn-sm" data-remove="${esc(p.ID)}">Remove</button></div><input type="number" min="1" max="${p.Quantity}" value="${qty}" data-qty="${esc(p.ID)}" aria-label="Quantity"><b class="line-total">${money(p.Price*qty)}</b></div>`).join('')}</div><div class="cart-total"><div><span>Subtotal</span><b>${money(total)}</b></div><div class="grand"><span>Total</span><span>${money(total)}</span></div><a class="btn btn-primary" style="width:100%;margin-top:12px" href="checkout.html">Proceed to checkout</a></div>`:'<div class="empty-state">Your cart is empty. <a href="products.html">Start shopping</a>.</div>'}`);
    $$('[data-remove]').forEach(b=>b.onclick=()=>{const x=cartRead();delete x[b.dataset.remove];cartSave(x);renderCart();});
    $$('[data-qty]').forEach(i=>i.onchange=async()=>{const p=await ProductService.get(i.dataset.qty),n=Number(i.value);if(!Number.isInteger(n)||n<1||n>p.Quantity){App.toast('Enter a quantity within available stock.','error');renderCart();return;}const x=cartRead();x[i.dataset.qty]=n;cartSave(x);renderCart();});
  }
  async function renderSignup(){
    shell(`<div class="store-panel store-form"><h1>Create your account</h1><p>Register to shop and track your orders.</p><form id="signup-form"><div class="form-grid"><div class="field"><label>Full name</label><input name="name" required></div><div class="field"><label>Email address</label><input name="email" type="email" required></div><div class="field"><label>Phone number</label><input name="mobile" required minlength="10" maxlength="16"></div><div class="field"><label>Password</label><input name="password" type="password" minlength="6" required></div><div class="field"><label>Confirm password</label><input name="confirm" type="password" minlength="6" required></div><div class="field"><label>Address</label><input name="address" required></div><div class="field"><label>City</label><input name="city" required></div><div class="field"><label>State</label><input name="state" required></div><div class="field"><label>Postal code</label><input name="postal" required></div><div class="field"><label>Country</label><input name="country" required></div></div><p id="form-msg" class="form-error" hidden></p><div class="form-actions"><button class="btn btn-primary" type="submit">Create account</button><a class="btn btn-ghost" href="login.html">I already have an account</a></div></form></div>`);
    $('#signup-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f));const msg=$('#form-msg');msg.hidden=true;
      try{if(d.password!==d.confirm)throw new Error('Passwords do not match.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))throw new Error('Enter a valid email address.');
        const cleanMobile=String(d.mobile).replace(/[\s-]/g,'');
        if(!/^\+?[0-9]{10,15}$/.test(cleanMobile))throw new Error('Enter a valid phone number with 10–15 digits.');
        let customer;
        if(window.FIREBASE_CONFIG&&FIREBASE_CONFIG.useFirebase) {
          const registered=await CustomerAuth.register(d.email,d.password);
          const uniqueId='CU'+String(registered.localId||Date.now()).replace(/[^A-Za-z0-9]/g,'').slice(-10).toUpperCase();
          customer=(await CustomerService.list()).find(c=>c.Email.toLowerCase()===d.email.trim().toLowerCase());
          if(!customer)customer=await CustomerService.create({ID:uniqueId,Name:d.name,Email:d.email,Mobile:cleanMobile});
          CustomerAuth.setCustomerId(customer.ID);
        } else {
          customer=(await CustomerService.list()).find(c=>c.Email.toLowerCase()===d.email.trim().toLowerCase());
          if(!customer)customer=await CustomerService.create({Name:d.name,Email:d.email,Mobile:cleanMobile});
          await CustomerAuth.register(d.email,d.password,customer.ID);
        }
        await Api.put('customerProfiles/'+customer.ID,{Address:d.address,City:d.city,State:d.state,PostalCode:d.postal,Country:d.country});
        location.href='account.html';
      }catch(err){msg.textContent=err.message;msg.hidden=false;}
    };
  }
  async function renderLogin(){
    shell(`<div class="store-panel store-form" style="max-width:460px"><h1>Welcome back</h1><p>Log in to your MarketHub account.</p><form id="login-form"><div class="field"><label>Email address</label><input name="email" type="email" required></div><div class="field" style="margin-top:14px"><label>Password</label><input name="password" type="password" required></div><p id="form-msg" class="form-error" hidden></p><div class="form-actions"><button class="btn btn-primary" type="submit">Log in</button><a href="forgot-password.html">Forgot password?</a></div><p>New here? <a href="signup.html">Create an account</a></p></form></div>`);
    $('#login-form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));try{await CustomerAuth.login(d.email,d.password);location.href=params.get('next')||'account.html';}catch(err){$('#form-msg').textContent=err.message;$('#form-msg').hidden=false;}};
  }
  async function renderForgot(){
    shell(`<div class="store-panel store-form" style="max-width:460px"><h1>Reset password</h1><p>Enter your email and Firebase will send the reset message when enabled.</p><form id="forgot-form"><div class="field"><label>Email address</label><input name="email" type="email" required></div><div class="form-actions"><button class="btn btn-primary">Send reset email</button><a href="login.html">Back to login</a></div><p id="form-msg" class="muted"></p></form></div>`);
    $('#forgot-form').onsubmit=async e=>{e.preventDefault();const email=new FormData(e.currentTarget).get('email');try{const result=await CustomerAuth.sendPasswordReset(email);$('#form-msg').textContent=result.demo?'Demo mode: reset email is not sent until Firebase is enabled.':'Password reset email sent. Check your inbox.';}catch(err){$('#form-msg').textContent=err.message;}};
  }
  async function renderAccount(){
    if(!requireLogin())return;const c=await getCustomer(),p=await getProfile(c.ID);
    shell(`<div class="section-head"><div><h1>My account</h1><p>Welcome, ${esc(c.Name)}.</p></div></div><div class="store-panel"><h3>Account details</h3><p><b>${esc(c.Name)}</b><br>${esc(c.Email)}<br>${esc(c.Mobile)}</p><p>${esc(p.Address||'')} ${esc(p.City||'')} ${esc(p.State||'')} ${esc(p.PostalCode||'')} ${esc(p.Country||'')}</p><p>Admin-managed credit limit: <b>${money(c.CreditLimit||0)}</b></p><a class="btn btn-primary" href="order-history.html">View my orders</a></div>`);
  }
  async function renderCheckout(){
    if(!requireLogin())return;const c=await getCustomer(),profile=await getProfile(c.ID),cart=cartRead(),lines=[];
    for(const [id,qty] of Object.entries(cart)){const p=await ProductService.get(id);if(p&&p.Active!==false)lines.push({p,qty:Number(qty)});}
    const total=lines.reduce((s,l)=>s+l.p.Price*l.qty,0);
    if(!lines.length){shell('<div class="empty-state">Your cart is empty. <a href="products.html">Shop now</a>.</div>');return;}
    shell(`<div class="section-head"><div><h1>Checkout</h1><p>Confirm your delivery details and order.</p></div></div><div class="detail-layout"><form class="store-panel" id="checkout-form"><h3>Delivery details</h3><div class="field"><label>Full name</label><input name="name" required value="${esc(c.Name)}"></div><div class="field"><label>Phone</label><input name="mobile" required value="${esc(c.Mobile)}"></div><div class="field"><label>Address</label><input name="address" required value="${esc(profile.Address||'')}"></div><div class="form-grid"><div class="field"><label>City</label><input name="city" required value="${esc(profile.City||'')}"></div><div class="field"><label>State</label><input name="state" required value="${esc(profile.State||'')}"></div><div class="field"><label>Postal code</label><input name="postal" required value="${esc(profile.PostalCode||'')}"></div><div class="field"><label>Country</label><input name="country" required value="${esc(profile.Country||'')}"></div></div><p id="form-msg" class="form-error" hidden></p><button class="btn btn-primary" type="submit">Continue to payment</button></form><div class="store-panel"><h3>Order summary</h3>${lines.map(l=>`<p>${esc(l.p.Title)} × ${l.qty}<b style="float:right">${money(l.p.Price*l.qty)}</b></p>`).join('')}<hr><h2>Total ${money(total)}</h2></div></div>`);
    $('#checkout-form').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));await Api.put('customerProfiles/'+c.ID,{...profile,Address:d.address,City:d.city,State:d.state,PostalCode:d.postal,Country:d.country,Mobile:d.mobile});sessionStorage.setItem('markethub_checkout_details',JSON.stringify(d));location.href='payment.html';};
  }
  async function renderPayment(){
    if(!requireLogin())return;const c=await getCustomer(),cart=cartRead(),lines=[];
    for(const [id,qty] of Object.entries(cart)){const p=await ProductService.get(id);if(p&&p.Active!==false)lines.push({ID:p.ID,Title:p.Title,Image:p.Image,Price:Number(p.Price),Quantity:Number(qty)});}
    const total=lines.reduce((s,l)=>s+l.Price*l.Quantity,0);const orders=Api.list(await Api.get('orders')).filter(o=>o.CustomerID===c.ID&&o.PaymentMethod==='Credit'&&o.PaymentStatus!=='Paid');
    const outstanding=orders.reduce((s,o)=>s+Number(o.Total||0),0),available=Math.max(0,Number(c.CreditLimit||0)-outstanding);
    shell(`<div class="store-panel store-form"><h1>Payment</h1><p>Choose a payment method for ${money(total)}.</p><form id="payment-form"><div class="field"><label><input type="radio" name="method" value="Cash" checked style="width:auto"> Cash on delivery</label></div><div class="field" style="margin-top:12px"><label><input type="radio" name="method" value="Credit" style="width:auto"> Credit payment</label></div><p class="muted">Credit limit: ${money(c.CreditLimit||0)} · Outstanding: ${money(outstanding)} · Available: ${money(available)}</p><p id="form-msg" class="form-error" hidden></p><button class="btn btn-primary" type="submit">Place order</button></form></div>`);
    $('#payment-form').onsubmit=async e=>{e.preventDefault();const method=new FormData(e.currentTarget).get('method'),msg=$('#form-msg');msg.hidden=true;
      try{if(!lines.length)throw new Error('Your cart is empty.');for(const l of lines){const p=await ProductService.get(l.ID);if(!p||p.Active===false||p.Quantity<l.Quantity)throw new Error(`${l.Title} no longer has enough stock.`);if(Number(p.Price)!==l.Price)throw new Error('A product price changed. Please review your cart again.');}
        if(method==='Credit'&&total>available)throw new Error('Insufficient available credit. Please choose cash payment or contact the store.');
        const details=JSON.parse(sessionStorage.getItem('markethub_checkout_details')||'{}');if(!details.name||!details.address)throw new Error('Please complete checkout details first.');
        const orderId='ORD'+Date.now();const order={ID:orderId,CustomerID:c.ID,CustomerName:details.name,CustomerEmail:c.Email,Delivery:{...details},Items:lines,Subtotal:total,Total:total,PaymentMethod:method,PaymentStatus:method==='Cash'?'Pending':'Pending',OrderStatus:'Placed',CreatedAt:new Date().toISOString()};
        await Api.put('orders/'+orderId,order);
        for(const l of lines){const p=await ProductService.get(l.ID);await ProductService.update(l.ID,{...p,Quantity:p.Quantity-l.Quantity});}
        cartSave({});sessionStorage.setItem('markethub_last_order',orderId);location.href='order-confirmation.html';
      }catch(err){msg.textContent=err.message;msg.hidden=false;}
    };
  }
  async function renderConfirmation(){
    if(!requireLogin())return;const id=sessionStorage.getItem('markethub_last_order'),o=id?await Api.get('orders/'+id):null,s=current();
    if(!o||o.CustomerID!==s.customerId){shell('<div class="empty-state">No completed order was found.</div>');return;}
    shell(`<div class="store-panel" style="text-align:center"><h1>Thank you for your order!</h1><p>Your order has been saved.</p><p><b>Order ID:</b> ${esc(o.ID)}</p><p><b>Total:</b> ${money(o.Total)} · <b>Payment:</b> ${esc(o.PaymentMethod)} · <b>Status:</b> ${esc(o.OrderStatus)}</p><a class="btn btn-primary" href="bill-report.html?id=${encodeURIComponent(o.ID)}">View invoice</a> <a class="btn btn-ghost" href="order-history.html">My orders</a></div>`);
  }
  async function renderHistory(){
    if(!requireLogin())return;const s=current(),orders=Api.list(await Api.get('orders')).filter(o=>o.CustomerID===s.customerId).sort((a,b)=>b.CreatedAt.localeCompare(a.CreatedAt));
    shell(`<div class="section-head"><div><h1>My orders</h1><p>Only your own orders are shown here.</p></div></div>${orders.length?`<div class="store-panel table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Payment</th><th>Payment status</th><th>Order status</th><th></th></tr></thead><tbody>${orders.map(o=>`<tr><td>${esc(o.ID)}</td><td>${new Date(o.CreatedAt).toLocaleDateString()}</td><td>${money(o.Total)}</td><td>${esc(o.PaymentMethod)}</td><td>${esc(o.PaymentStatus)}</td><td>${esc(o.OrderStatus)}</td><td><a href="bill-report.html?id=${encodeURIComponent(o.ID)}">Invoice</a></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">You have not placed any orders yet.</div>'}`);
  }
  async function renderInvoice(){
    if(!requireLogin())return;const id=params.get('id')||sessionStorage.getItem('markethub_last_order'),o=id?await Api.get('orders/'+id):null,s=current();
    if(!o||o.CustomerID!==s.customerId){shell('<div class="empty-state">Invoice not found.</div>');return;}
    shell(`<div class="no-print" style="max-width:850px;margin:0 auto 14px"><button class="btn btn-primary" onclick="window.print()">Print invoice</button></div><article class="invoice"><div class="invoice-head"><div><h1>MarketHub</h1><p class="muted">Customer invoice</p></div><div><h2>INVOICE</h2><b>${esc(o.ID)}</b><p>${new Date(o.CreatedAt).toLocaleString()}</p></div></div><h3>Bill to</h3><p>${esc(o.CustomerName)}<br>${esc(o.CustomerEmail)}<br>${esc(o.Delivery.address)}, ${esc(o.Delivery.city)}, ${esc(o.Delivery.state)} ${esc(o.Delivery.postal)}, ${esc(o.Delivery.country)}</p><div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${o.Items.map(i=>`<tr><td>${esc(i.Title)} (${esc(i.ID)})</td><td>${i.Quantity}</td><td>${money(i.Price)}</td><td>${money(i.Price*i.Quantity)}</td></tr>`).join('')}</tbody></table></div><div class="cart-total"><div><span>Subtotal</span><b>${money(o.Subtotal)}</b></div><div class="grand"><span>Total</span><b>${money(o.Total)}</b></div><p>Payment: ${esc(o.PaymentMethod)} (${esc(o.PaymentStatus)})</p><p>Order status: ${esc(o.OrderStatus)}</p></div></article>`);
  }
  async function render(){
    const page=document.body.dataset.customerPage;
    const renderers={home:renderHome,products:renderProducts,categories:renderCategories,details:renderDetails,cart:renderCart,signup:renderSignup,login:renderLogin,forgot:renderForgot,account:renderAccount,checkout:renderCheckout,payment:renderPayment,confirmation:renderConfirmation,history:renderHistory,invoice:renderInvoice};
    shell('<div class="empty-state">Loading MarketHub…</div>');
    try{await (renderers[page]||renderHome)();}catch(e){console.error(e);shell(`<div class="empty-state">Unable to load this page: ${esc(e.message)} <p><a href="home.html">Return home</a></p></div>`);}
  }
  document.addEventListener('click',async e=>{
    const add=e.target.closest('[data-add]');if(add){try{await addCart(add.dataset.add,1);}catch(err){App.toast(err.message,'error');}}
    if(e.target.closest('[data-customer-logout]')){e.preventDefault();CustomerAuth.logout();location.href='home.html';}
  });
  document.addEventListener('DOMContentLoaded',render);
})();
/* ==============================================
   FIREBASE CONFIGURATION & INITIALIZATION
   ============================================== */
const firebaseConfig = {
  apiKey: "AIzaSyAZmOZoN04s1XPCJ8vYrXcCw20DyIJ3M9I",
  authDomain: "assign-5fb9b.firebaseapp.com",
  databaseURL: "https://assign-5fb9b-default-rtdb.firebaseio.com",
  projectId: "assign-5fb9b",
  storageBucket: "assign-5fb9b.firebasestorage.app",
  messagingSenderId: "878454370015",
  appId: "1:878454370015:web:11e7f899c9dcddc40b036a",
  measurementId: "G-ZLL9Y4K4X1"
};

// Initialize Firebase safely
let db, auth;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    auth = firebase.auth();
} else {
    console.error("Firebase SDK not found. Please add the Firebase scripts to your HTML.");
}

document.addEventListener('DOMContentLoaded', () => {
    
    /* ==============================================
       PART 1: CORE UI & PERFORMANCE LOGIC
       ============================================== */

    // --- 1. Scroll Progress, Navbar & Parallax ---
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (scrollTop / scrollHeight) * 100;
        
        const progressBar = document.getElementById('scrollProgress');
        if(progressBar) progressBar.style.width = scrolled + "%";

        const nav = document.getElementById('mainNav');
        if (nav) {
            scrollTop > 50 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled');
        }

        const heroImg = document.querySelector('.hero-img');
        if(heroImg && window.innerWidth > 768) {
            heroImg.style.transform = `translateY(${scrollTop * 0.15}px)`;
        }
    });

    // --- 2. Main Menu Filtering ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            menuItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.classList.remove('d-none');
                    void item.offsetWidth; // Trigger Reflow
                    item.style.animation = 'slideIn 0.4s ease forwards';
                } else {
                    item.classList.add('d-none');
                }
            });
        });
    });

    // --- 3. Mood Based Suggestion ---
    const moodDishes = [
        { name: "Royal Kaju Katli", emoji: "🍬", desc: "Classic & Rich" },
        { name: "Paneer Butter Masala", emoji: "🥘", desc: "Creamy & Spicy" },
        { name: "Chocolate Truffle", emoji: "🍰", desc: "Decadent Sweet" },
        { name: "Masala Dosa", emoji: "🥞", desc: "Crispy South Indian" },
        { name: "Hakka Noodles", emoji: "🍜", desc: "Desi Chinese Kick" },
        { name: "Dal Makhani", emoji: "🍲", desc: "Buttery Comfort" }
    ];

    window.suggestMood = function() {
        const resultBox = document.getElementById('mood-result');
        if(!resultBox) return;

        resultBox.innerHTML = `<span class="emoji spinner-border spinner-border-sm text-warning" role="status"></span><h4 class="mt-2 fs-5">Chef is thinking...</h4>`;
        
        setTimeout(() => {
            const randomDish = moodDishes[Math.floor(Math.random() * moodDishes.length)];
            resultBox.innerHTML = `
                <div style="animation: zoom 0.5s">
                    <span class="emoji display-4">${randomDish.emoji}</span>
                    <h4 class="dish-name mt-2 text-gold fs-5">${randomDish.name}</h4>
                    <p class="small text-muted mb-0">${randomDish.desc}</p>
                </div>
            `;
        }, 800);
    };

    // --- 4. Global Panel Toggles ---
    const panel = document.getElementById('quickOrderPanel');
    const backdrop = document.getElementById('panelBackdrop');

    window.toggleOrderPanel = function() {
        if(panel && backdrop) {
            panel.classList.toggle('active');
            backdrop.classList.toggle('active');
        }
    };

    // --- 5. Lazy Loading Images & Map ---
    const lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if(entry.target.tagName === 'IMG') {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.onload = () => img.classList.add('loaded');
                    }
                }
                if(entry.target.classList.contains('map-container')) {
                    const iframe = entry.target.querySelector('iframe');
                    if(iframe) iframe.style.opacity = 1; 
                }
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "150px" });

    document.querySelectorAll('.lazy-img').forEach(img => lazyObserver.observe(img));
    const mapContainer = document.querySelector('.map-container');
    if(mapContainer) lazyObserver.observe(mapContainer);

    // --- 6. Gallery Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function() {
            if(lightbox && lightboxImg) {
                lightboxImg.src = this.getAttribute('data-src') || this.src;
                lightbox.style.display = 'flex';
            }
        });
    });

    window.closeLightbox = function() {
        if(lightbox) lightbox.style.display = 'none';
    };

    // --- 7. Contact Form Handler ---
    window.handleForm = function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Sent Successfully!';
        btn.style.backgroundColor = '#25D366';
        setTimeout(() => {
            alert('Thank you! We have received your message.');
            btn.innerText = originalText;
            btn.style.backgroundColor = '';
            e.target.reset();
        }, 2000);
    };
});


/* ==============================================
   PART 2: SMART TABLE ORDERING SYSTEM (TOS)
   Updated with Firebase Realtime Database
   ============================================== */

const TableSystem = {
    // 1. Data & State
    tableNumber: null,
    cart: [],
    
    // Menu Data
    menu: [
        { id: 101, cat: 'starters', name: 'Paneer Tikka', price: 280, img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=150&q=60' },
        { id: 102, cat: 'starters', name: 'Dahi Ke Sholay', price: 240, img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=150&q=60' },
        { id: 201, cat: 'main', name: 'Dal Makhani', price: 220, img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=150&q=60' },
        { id: 202, cat: 'main', name: 'Shahi Paneer', price: 260, img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=150&q=60' },
        { id: 301, cat: 'breads', name: 'Butter Naan', price: 60, img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=150&q=60' },
        { id: 302, cat: 'breads', name: 'Lachha Paratha', price: 50, img: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=150&q=60' },
        { id: 401, cat: 'dessert', name: 'Gulab Jamun', price: 80, img: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&w=150&q=60' },
        { id: 402, cat: 'dessert', name: 'Rasmalai', price: 120, img: 'https://images.unsplash.com/photo-1605197391486-84d33361b3bd?auto=format&fit=crop&w=150&q=60' }
    ],

    // 2. Initialization
    init() {
        const savedTable = localStorage.getItem('vip_table_no');
        const savedCart = localStorage.getItem('vip_cart_data');

        if (savedCart) {
            try { this.cart = JSON.parse(savedCart); this.updateCartUI(); } 
            catch(e) { console.error("Cart error"); }
        }

        if (savedTable) {
            this.tableNumber = savedTable;
            this.launchInterface();
        } else {
            const modal = document.getElementById('tos-table-modal');
            if(modal) modal.classList.add('active');
        }
    },

    // 3. Set Table
    setTable() {
        const input = document.getElementById('tos-table-input');
        if (input.value && input.value > 0) {
            this.tableNumber = input.value;
            localStorage.setItem('vip_table_no', this.tableNumber);
            document.getElementById('tos-table-modal').classList.remove('active');
            this.launchInterface();
        } else {
            input.style.borderColor = '#C62828';
            setTimeout(() => input.style.borderColor = '#eee', 1000);
        }
    },

    // 4. UI Launch
    launchInterface() {
        const displayTable = document.getElementById('tos-display-table');
        if(displayTable) displayTable.innerText = this.tableNumber;
        
        document.getElementById('tos-interface').classList.remove('d-none');
        document.getElementById('tos-floating-cart').classList.remove('d-none');
        this.filterMenu('all');
        setTimeout(() => document.getElementById('tos-interface').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    },

    // 5. Filter Menu
    filterMenu(category) {
        const grid = document.getElementById('tos-menu-grid');
        if(!grid) return;
        grid.innerHTML = ''; 

        const allPills = document.querySelectorAll('.tos-cat-pill');
        allPills.forEach(btn => btn.classList.remove('active'));
        
        if(event && event.target && event.target.classList.contains('tos-cat-pill')) {
             event.target.classList.add('active');
        } else if (allPills.length > 0) {
             const activePill = Array.from(allPills).find(p => p.innerText.toLowerCase() === (category === 'all' ? 'all' : category));
             if(activePill) activePill.classList.add('active');
             else allPills[0].classList.add('active');
        }

        const items = category === 'all' ? this.menu : this.menu.filter(item => item.cat === category);

        items.forEach((item, index) => {
            const card = `
                <div class="col-6 col-md-4 col-lg-3" style="animation: slideIn 0.4s ease forwards; animation-delay: ${index * 50}ms; opacity: 0;">
                    <div class="tos-card">
                        <img src="${item.img}" alt="${item.name}">
                        <h6 class="fw-bold mb-1 small text-truncate">${item.name}</h6>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="text-danger fw-bold small">₹${item.price}</span>
                            <button onclick="TableSystem.addToCart(${item.id})" class="tos-add-btn shadow-sm"><i class="fas fa-plus small"></i></button>
                        </div>
                    </div>
                </div>`;
            grid.innerHTML += card;
        });
    },

    // 6. Cart Logic
    addToCart(id) {
        const item = this.menu.find(p => p.id === id);
        const existing = this.cart.find(c => c.id === id);
        existing ? existing.qty++ : this.cart.push({ ...item, qty: 1 });
        
        this.saveState();
        this.updateCartUI();
        this.toggleCart(true); 
        if (navigator.vibrate) navigator.vibrate(30);
    },

    changeQty(id, delta) {
        const idx = this.cart.findIndex(c => c.id === id);
        if (idx > -1) {
            this.cart[idx].qty += delta;
            if (this.cart[idx].qty <= 0) this.cart.splice(idx, 1);
            this.saveState();
            this.updateCartUI();
        }
    },

    updateCartUI() {
        const list = document.getElementById('tos-cart-items');
        const badge = document.getElementById('tos-cart-count');
        const totalEl = document.getElementById('tos-cart-total');
        if(!list) return;

        let count = 0, total = 0;
        
        if (this.cart.length === 0) {
            list.innerHTML = `<div class="text-center mt-5 text-muted opacity-50"><i class="fas fa-utensils fa-3x mb-3"></i><p>Your plate is empty!</p></div>`;
        } else {
            list.innerHTML = '';
            this.cart.forEach(item => {
                count += item.qty;
                total += (item.price * item.qty);
                list.innerHTML += `
                    <div class="tos-cart-item">
                        <div class="flex-grow-1">
                            <h6 class="mb-0 small fw-bold">${item.name}</h6>
                            <small class="text-muted">₹${item.price} x ${item.qty}</small>
                        </div>
                        <div class="qty-control">
                            <button class="qty-btn" onclick="TableSystem.changeQty(${item.id}, -1)">-</button>
                            <span class="small fw-bold px-1" style="min-width:20px; text-align:center;">${item.qty}</span>
                            <button class="qty-btn" onclick="TableSystem.changeQty(${item.id}, 1)">+</button>
                        </div>
                        <div class="ms-3 fw-bold small">₹${item.price * item.qty}</div>
                    </div>`;
            });
        }

        if(badge) { badge.innerText = count; badge.style.transform = 'scale(1.3)'; setTimeout(() => badge.style.transform = 'scale(1)', 200); }
        if(totalEl) totalEl.innerText = '₹' + total;
    },

    saveState() { localStorage.setItem('vip_cart_data', JSON.stringify(this.cart)); },
    toggleCart(forceOpen) { 
        const panel = document.getElementById('tos-cart-panel');
        if(panel) forceOpen ? panel.classList.add('active') : panel.classList.toggle('active');
    },

    // 7. Checkout (Push to Firebase)
    checkout() {
        if (this.cart.length === 0) return alert('Cart is empty!');
        const btn = document.querySelector('#tos-cart-panel .tos-btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        const orderData = {
            table: this.tableNumber,
            items: this.cart,
            total: this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
            timestamp: firebase ? firebase.database.ServerValue.TIMESTAMP : Date.now(),
            status: 'Received',
            userId: (auth && auth.currentUser) ? auth.currentUser.uid : 'guest'
        };

        if (db) {
            const newOrderKey = db.ref().child('orders').push().key;
            db.ref('orders/' + newOrderKey).set(orderData)
            .then(() => {
                this.finishCheckout(btn, originalText);
            })
            .catch((err) => {
                alert("Error sending order: " + err.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        } else {
            // Fallback for demo without DB connection
            setTimeout(() => this.finishCheckout(btn, originalText), 1500);
        }
    },

    finishCheckout(btn, originalText) {
        alert(`Order successfully sent to Kitchen for Table ${this.tableNumber}!`);
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // Notify AuthSystem to update history (Realtime listener will handle this in AuthSystem, but we dispatch event for immediate feedback)
        const orderEvent = new CustomEvent('vip_order_placed', { detail: { items: [...this.cart], total: this.cart.reduce((s,i)=>s+(i.price*i.qty),0) } });
        window.dispatchEvent(orderEvent);

        this.cart = []; 
        this.saveState();
        this.updateCartUI();
        this.toggleCart();
    },

    requestBill() {
        const modal = document.getElementById('tos-bill-modal');
        const list = document.getElementById('tos-bill-items');
        document.getElementById('tos-bill-table').innerText = this.tableNumber;
        
        let total = 0, html = '';
        const billData = this.cart.length > 0 ? this.cart : this.menu.slice(0, 3); // Demo data if empty
        
        billData.forEach(item => {
            const qty = item.qty || 1;
            total += item.price * qty;
            html += `<div class="d-flex justify-content-between mb-2 small"><span>${item.name} x${qty}</span><span>₹${item.price*qty}</span></div>`;
        });
        
        list.innerHTML = html + `<div class="border-top my-2"></div><div class="d-flex justify-content-between fw-bold"><span>Total</span><span>₹${total}</span></div>`;
        document.getElementById('tos-bill-total').innerText = '₹' + total;
        modal.classList.add('active');
    }
};

/* ==============================================
   PART 3: AUTH & PROFILE LOGIC (Real Firebase)
   ============================================== */

const AuthSystem = {
    user: null,
    
    init() {
        if(auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.user = {
                        uid: user.uid,
                        name: user.displayName || "Guest User",
                        email: user.email || "No Email",
                        photo: user.photoURL || "https://ui-avatars.com/api/?name=User&background=F4B400&color=fff",
                        isAnonymous: user.isAnonymous
                    };
                    this.updateUI(true);
                    this.listenToOrderHistory(user.uid);
                } else {
                    this.user = null;
                    this.updateUI(false);
                }
            });
        }
    },

    openLogin() { document.getElementById('auth-modal-backdrop').classList.add('active'); },
    closeLogin() { document.getElementById('auth-modal-backdrop').classList.remove('active'); },

    login(type) {
        if(!auth) return alert("Firebase not loaded");
        
        const btn = document.querySelector('.btn-google-login');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Signing in...';

        let promise;
        if(type === 'google') {
            const provider = new firebase.auth.GoogleAuthProvider();
            promise = auth.signInWithPopup(provider);
        } else {
            promise = auth.signInAnonymously();
        }

        promise.then((result) => {
            this.closeLogin();
            this.showToast(`Welcome, ${result.user.displayName || 'Guest'}!`);
        }).catch((error) => {
            alert(error.message);
        }).finally(() => {
            btn.innerHTML = originalText;
        });
    },

    logout() {
        if(auth) auth.signOut();
        this.toggleProfile();
    },

    updateUI(isLoggedIn) {
        const loginBtn = document.getElementById('login-trigger-btn');
        const profileTrigger = document.getElementById('user-profile-trigger');
        const navImg = document.getElementById('nav-user-img');

        if (isLoggedIn) {
            loginBtn.classList.add('d-none');
            profileTrigger.classList.remove('d-none');
            navImg.src = this.user.photo;
            this.updateProfilePanel();
        } else {
            loginBtn.classList.remove('d-none');
            profileTrigger.classList.add('d-none');
        }
    },

    toggleProfile() {
        document.getElementById('profile-sidebar').classList.toggle('active');
    },

    updateProfilePanel() {
        if (!this.user) return;
        document.getElementById('sidebar-user-img').src = this.user.photo;
        document.getElementById('sidebar-user-name').innerText = this.user.name;
        document.getElementById('sidebar-user-email').innerText = this.user.email;
        
        const hour = new Date().getHours();
        document.getElementById('greeting-text').innerText = `${hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'}, ${this.user.name.split(' ')[0]}`;
    },

    listenToOrderHistory(uid) {
        if(!db) return;
        
        // Fetch orders where userId matches
        const ordersRef = db.ref('orders');
        ordersRef.orderByChild('userId').equalTo(uid).on('value', (snapshot) => {
            const orders = [];
            snapshot.forEach(child => {
                orders.unshift({ id: child.key, ...child.val() });
            });
            this.renderOrderHistory(orders);
            document.getElementById('total-orders-count').innerText = orders.length;
        });
    },

    renderOrderHistory(orders) {
        const container = document.getElementById('order-history-list');
        if (orders.length === 0) {
            container.innerHTML = `<div class="text-center mt-5 text-muted"><i class="fas fa-utensils fa-2x mb-3 opacity-50"></i><p class="small mb-1">No orders yet</p></div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            const items = order.items ? order.items.map(i => i.name).join(', ') : 'Items';
            const date = new Date(order.timestamp).toLocaleDateString();
            html += `
                <div class="order-history-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div><span class="order-badge">#${order.id.slice(-4)}</span><span class="text-muted x-small ms-2">${date}</span></div>
                        <span class="fw-bold text-danger">₹${order.total}</span>
                    </div>
                    <p class="small text-muted mb-2 text-truncate">${items}</p>
                    <small class="text-success"><i class="fas fa-check-circle me-1"></i> ${order.status}</small>
                </div>`;
        });
        container.innerHTML = html;
    },

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('d-none'));
        document.querySelectorAll('.custom-pills .nav-link').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.remove('d-none');
        event.target.classList.add('active');
    },

    showToast(msg) {
        const toast = document.getElementById('auth-toast');
        document.getElementById('toast-message').innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};

window.TableSystem = TableSystem;
window.AuthSystem = AuthSystem;

// Init Auth
AuthSystem.init();

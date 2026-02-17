document.addEventListener('DOMContentLoaded', () => {
    
    /* ==============================================
       PART 1: CORE UI & PERFORMANCE LOGIC
       ============================================== */

    // --- 1. Scroll Progress, Navbar & Parallax ---
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (scrollTop / scrollHeight) * 100;
        
        // Update Scroll Progress Bar
        const progressBar = document.getElementById('scrollProgress');
        if(progressBar) progressBar.style.width = scrolled + "%";

        // Navbar Glass Effect
        const nav = document.getElementById('mainNav');
        if (nav) {
            scrollTop > 50 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled');
        }

        // Hero Image Parallax (Subtle Depth)
        const heroImg = document.querySelector('.hero-img');
        if(heroImg && window.innerWidth > 768) {
            heroImg.style.transform = `translateY(${scrollTop * 0.15}px)`;
        }
    });

    // --- 2. Main Menu Filtering (Isotope-style) ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Active State
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            // Filter Items with Animation
            menuItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.classList.remove('d-none');
                    // Trigger Reflow for Animation
                    void item.offsetWidth; 
                    item.style.animation = 'slideIn 0.4s ease forwards';
                } else {
                    item.classList.add('d-none');
                }
            });
        });
    });

    // --- 3. Mood Based Suggestion (AI Chef) ---
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

        // Loading State
        resultBox.innerHTML = `<span class="emoji spinner-border spinner-border-sm text-warning" role="status"></span><h4 class="mt-2 fs-5">Chef is thinking...</h4>`;
        
        // Result State
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

    // --- 5. Lazy Loading Images & Map (Performance) ---
    const lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Handle Images
                if(entry.target.tagName === 'IMG') {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.onload = () => img.classList.add('loaded');
                    }
                }
                // Handle Map Iframe
                if(entry.target.classList.contains('map-container')) {
                    const iframe = entry.target.querySelector('iframe');
                    if(iframe && !iframe.getAttribute('src').startsWith('http')) {
                        // Reload or set src if needed (handled via browser native lazy loading usually, but this ensures fade-in)
                        iframe.style.opacity = 1;
                    }
                }
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "100px" });

    document.querySelectorAll('.lazy-img').forEach(img => lazyObserver.observe(img));
    const mapContainer = document.querySelector('.map-container');
    if(mapContainer) lazyObserver.observe(mapContainer);

    // --- 6. Gallery Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function() {
            if(lightbox && lightboxImg) {
                // Use the src of the clicked image
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
        btn.style.backgroundColor = '#25D366'; // WhatsApp Green
        
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
   Logic for the Dine-In Experience
   ============================================== */

const TableSystem = {
    // 1. Data & State
    tableNumber: null,
    cart: [],
    
    // High-Quality Menu Data (Matching Visuals)
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
            try {
                this.cart = JSON.parse(savedCart);
                this.updateCartUI();
            } catch(e) { console.error("Cart data corrupted"); }
        }

        if (savedTable) {
            this.tableNumber = savedTable;
            this.launchInterface();
        } else {
            // Show Login Modal
            const modal = document.getElementById('tos-table-modal');
            if(modal) modal.classList.add('active');
        }
    },

    // 3. Login / Set Table
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

    // 4. Launch The UI
    launchInterface() {
        const displayTable = document.getElementById('tos-display-table');
        if(displayTable) displayTable.innerText = this.tableNumber;
        
        document.getElementById('tos-interface').classList.remove('d-none');
        document.getElementById('tos-floating-cart').classList.remove('d-none');
        
        // Render initial items
        this.filterMenu('all');
        
        // Smooth scroll to interface
        setTimeout(() => {
            document.getElementById('tos-interface').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    },

    // 5. Digital Menu Filtering & Rendering
    filterMenu(category) {
        const grid = document.getElementById('tos-menu-grid');
        if(!grid) return;
        
        grid.innerHTML = ''; // Clear current

        // Update pills styling
        const allPills = document.querySelectorAll('.tos-cat-pill');
        allPills.forEach(btn => btn.classList.remove('active'));
        
        // Highlight active button
        if(event && event.target && event.target.classList.contains('tos-cat-pill')) {
             event.target.classList.add('active');
        } else if (allPills.length > 0) {
             const activePill = Array.from(allPills).find(p => p.innerText.toLowerCase() === (category === 'all' ? 'all' : category));
             if(activePill) activePill.classList.add('active');
             else allPills[0].classList.add('active');
        }

        const items = category === 'all' 
            ? this.menu 
            : this.menu.filter(item => item.cat === category);

        // Render with staggered animation
        items.forEach((item, index) => {
            const delay = index * 50; 
            const card = `
                <div class="col-6 col-md-4 col-lg-3" style="animation: slideIn 0.4s ease forwards; animation-delay: ${delay}ms; opacity: 0;">
                    <div class="tos-card">
                        <img src="${item.img}" alt="${item.name}">
                        <h6 class="fw-bold mb-1 small text-truncate">${item.name}</h6>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="text-danger fw-bold small">₹${item.price}</span>
                            <button onclick="TableSystem.addToCart(${item.id})" class="tos-add-btn shadow-sm">
                                <i class="fas fa-plus small"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
    },

    // 6. Cart Management
    addToCart(id) {
        const item = this.menu.find(p => p.id === id);
        const existing = this.cart.find(c => c.id === id);

        if (existing) {
            existing.qty++;
        } else {
            this.cart.push({ ...item, qty: 1 });
        }
        
        this.saveState();
        this.updateCartUI();
        this.toggleCart(true); // Open sidebar
        
        if (navigator.vibrate) navigator.vibrate(30); // Haptic feedback
    },

    changeQty(id, delta) {
        const idx = this.cart.findIndex(c => c.id === id);
        if (idx > -1) {
            this.cart[idx].qty += delta;
            if (this.cart[idx].qty <= 0) {
                this.cart.splice(idx, 1);
            }
            this.saveState();
            this.updateCartUI();
        }
    },

    // 7. Render Cart UI
    updateCartUI() {
        const list = document.getElementById('tos-cart-items');
        const badge = document.getElementById('tos-cart-count');
        const totalEl = document.getElementById('tos-cart-total');
        
        if(!list) return;

        let count = 0;
        let total = 0;
        
        if (this.cart.length === 0) {
            list.innerHTML = `
                <div class="text-center mt-5 text-muted opacity-50">
                    <i class="fas fa-utensils fa-3x mb-3"></i>
                    <p>Your plate is empty!</p>
                </div>`;
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
                    </div>
                `;
            });
        }

        // Update Badge & Total
        if(badge) badge.innerText = count;
        if(totalEl) totalEl.innerText = '₹' + total;
        
        // Badge animation
        if(badge) {
            badge.style.transform = 'scale(1.3)';
            setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }
    },

    // 8. Helpers
    saveState() {
        localStorage.setItem('vip_cart_data', JSON.stringify(this.cart));
    },

    toggleCart(forceOpen = false) {
        const panel = document.getElementById('tos-cart-panel');
        if(!panel) return;
        
        if (forceOpen) panel.classList.add('active');
        else panel.classList.toggle('active');
    },

    // 9. Checkout & Bill
    checkout() {
        if (this.cart.length === 0) return alert('Cart is empty!');
        
        const btn = document.querySelector('#tos-cart-panel .tos-btn-primary');
        const originalText = btn.innerHTML;
        
        // Simulate API Call
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        setTimeout(() => {
            alert(`Order Sent to Kitchen for Table ${this.tableNumber}!`);
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            // Clear cart but retain table
            this.cart = []; 
            this.saveState();
            this.updateCartUI();
            this.toggleCart(); // Close panel
        }, 1500);
    },

    requestBill() {
        const modal = document.getElementById('tos-bill-modal');
        const list = document.getElementById('tos-bill-items');
        
        document.getElementById('tos-bill-table').innerText = this.tableNumber;
        
        let total = 0;
        let html = '';
        
        // Use current cart OR mock data if cart is empty
        const billData = this.cart.length > 0 ? this.cart : this.menu.slice(0, 3);
        
        if (billData.length === 0) {
            html = '<p class="text-center text-muted">No orders found for this session.</p>';
        } else {
            billData.forEach(item => {
                const qty = item.qty || 1; 
                const cost = item.price * qty;
                total += cost;
                html += `
                    <div class="d-flex justify-content-between mb-2 small">
                        <span>${item.name} <span class="text-muted">x${qty}</span></span>
                        <span>₹${cost}</span>
                    </div>
                `;
            });
            
            const tax = Math.round(total * 0.05);
            html += `
                <div class="border-top my-2"></div>
                <div class="d-flex justify-content-between mb-1 small text-muted"><span>Subtotal</span><span>₹${total}</span></div>
                <div class="d-flex justify-content-between mb-2 small text-muted"><span>GST (5%)</span><span>₹${tax}</span></div>
            `;
            total += tax;
        }
        
        list.innerHTML = html;
        document.getElementById('tos-bill-total').innerText = '₹' + total;
        
        modal.classList.add('active');
    }
};

// Expose TableSystem globally
window.TableSystem = TableSystem;

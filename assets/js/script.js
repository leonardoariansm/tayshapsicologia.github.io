// ============================================
// Smooth Scroll Navigation
// ============================================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navHeight = document.getElementById('navbar').offsetHeight;
        const sectionPosition = section.offsetTop - navHeight;
        
        window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
        });
        
        // Close mobile menu if open
        closeMobileMenu();
    }
}

// ============================================
// Navbar Scroll Effect
// ============================================
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============================================
// Mobile Menu Toggle
// ============================================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        if (!event.target.closest('.hamburger') && !event.target.closest('.mobile-menu')) {
            closeMobileMenu();
        }
    }
});

function closeMobileMenu() {
    if (hamburger && mobileMenu) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
    }
}

// ============================================
// Nav Links - Smooth Scroll
// ============================================
const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
    });
});

// ============================================
// Form Submission Handler
// ============================================
function handleSubmit() {
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;
    
    // Basic validation
    if (!name || !email || !phone || !message) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor ingresa un email válido');
        return;
    }
    
    // Here you would typically send the data to a server
    // For now, we'll just show a success message
    
    // Option 1: Redirect to WhatsApp with pre-filled message
    const whatsappNumber = '593XXXXXXXXX'; // Replace with actual number
    const whatsappMessage = `Hola Salomé, mi nombre es ${name}. ${message}`;
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappURL, '_blank');
    
    // Option 2: Or show success message and clear form
    alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
    clearForm();
}

function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('message').value = '';
}

// ============================================
// Scroll Reveal Animation
// ============================================
function reveal() {
    const reveals = document.querySelectorAll('.service-card, .methodology-item');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Initialize reveal elements
document.addEventListener('DOMContentLoaded', function() {
    const reveals = document.querySelectorAll('.service-card, .methodology-item');
    reveals.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px)';
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });
});

window.addEventListener('scroll', reveal);
reveal(); // Call once on load

// ============================================
// Active Nav Link on Scroll
// ============================================
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navHeight = document.getElementById('navbar').offsetHeight;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - navHeight - 100;
        const sectionBottom = sectionTop + section.offsetHeight;
        const scrollPosition = window.scrollY;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            const currentId = section.getAttribute('id');
            removeAllActiveClasses();
            addActiveClass(currentId);
        }
    });
});

function removeAllActiveClasses() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
}

function addActiveClass(id) {
    const selector = `.nav-link[href="#${id}"]`;
    const activeLink = document.querySelector(selector);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// ============================================
// Load Animation on Page Load
// ============================================
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// ============================================
// Prevent Empty Links
// ============================================
document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
    });
});

// ============================================
// Console Welcome Message
// ============================================
console.log('%c👋 ¡Hola!', 'font-size: 20px; font-weight: bold; color: #14B8A6;');
console.log('%cBienvenido al sitio web de Salomé Argoti', 'font-size: 14px; color: #6B7280;');
console.log('%c¿Interesado en el código? Visita: github.com/tu-usuario', 'font-size: 12px; color: #9CA3AF;');
// Mobile hamburger menu elements
const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const navToggleIcon = document.querySelector('.nav-toggle i');

// Function to close the mobile menu
function closeMobileNav() {
    mobileNav.classList.remove('open');
    // Change icon back to hamburger
    navToggleIcon.classList.add('fa-bars');
    navToggleIcon.classList.remove('fa-times');
}

// Toggle mobile menu open/close and icon change
navToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    // Toggle icon
    navToggleIcon.classList.toggle('fa-bars');
    navToggleIcon.classList.toggle('fa-times');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {
        closeMobileNav();
    });
});

// Close mobile menu when clicking outside of it
document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !navToggle.contains(e.target)) {
        closeMobileNav();
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        // Close mobile menu after clicking a link
        if (mobileNav.classList.contains('open')) {
            closeMobileNav();
        }

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Typing animation for hero text
function typeWriter(text, element, speed = 100) {
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Initialize typing animation on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    const heroText = document.querySelector('.typing-text');
    const textContent = heroText.textContent;
    heroText.textContent = '';
    typeWriter(textContent, heroText);
});

// Fade-in animation on scroll
const fadeElements = document.querySelectorAll('.fade-in');
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

fadeElements.forEach(element => {
    observer.observe(element);
});

// Contact form handling
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    // Add your form submission logic here
    console.log('Form submitted:', Object.fromEntries(formData));
    // Reset form after submission
    contactForm.reset();
    alert('Thank you for your message! I will get back to you soon.');
});

// Close mobile menu on scroll
window.addEventListener('scroll', closeMobileNav);

// Highlight active navigation link based on scroll position
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function activateNavLink() {
    let scrollPosition = window.pageYOffset + 500; // Adjust for navbar height

    sections.forEach(section => {
        if (
            section.offsetTop <= scrollPosition &&
            (section.offsetTop + section.offsetHeight) > scrollPosition
        ) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${section.id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', activateNavLink);

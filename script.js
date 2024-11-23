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
            // Optionally unobserve the element after it becomes visible
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

fadeElements.forEach(element => {
    observer.observe(element);
});

// Close mobile menu on scroll
window.addEventListener('scroll', () => {
    if (mobileNav.classList.contains('open')) {
        closeMobileNav();
    }
});

// Highlight active navigation link based on scroll position
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function activateNavLink() {
    let scrollPosition = window.pageYOffset + 700; // Adjust for navbar height

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

// Skill Categories Filtering
const categoryButtons = document.querySelectorAll('.category-btn');
const skillItems = document.querySelectorAll('.skill-item');
const skillSelect = document.getElementById('skill-category-select'); // Select element for mobile

// Function to filter skills
function filterSkills(category) {
    skillItems.forEach(item => {
        if (category === 'All' || item.getAttribute('data-category') === category) {
            item.style.display = 'flex';
            // Use CSS transitions for fade-in effect instead of JavaScript
            item.classList.remove('hidden');
            setTimeout(() => {
                item.classList.add('visible');
            }, 0); // Trigger reflow
        } else {
            // Use CSS transitions for fade-out effect instead of JavaScript
            item.classList.remove('visible');
            item.classList.add('hidden');
            setTimeout(() => {
                item.style.display = 'none';
            }, 0); // Match the CSS transition duration
        }
    });
}

// Event listeners for category buttons (Desktop)
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to the clicked button
        button.classList.add('active');

        const category = button.getAttribute('data-category');

        filterSkills(category);
    });
});

// Event listener for select dropdown (Mobile)
if (skillSelect) {
    skillSelect.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        filterSkills(selectedCategory);
    });
}

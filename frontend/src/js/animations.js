// animations.js - Centralized animation and interactive functionality

document.addEventListener('DOMContentLoaded', function() {
  // Intersection Observer for scroll animations
  initScrollAnimations();
  
  // Navbar scroll effects
  initNavbarScrollEffects();
  
  // Accordion functionality
  initAccordions();
  
  // Mobile menu toggle
  initMobileMenu();
  
  // Parallax effects
  initParallax();
});

// Initialize scroll-based animations
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const handleIntersect = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // For elements that should stay visible after animation
        if (!entry.target.classList.contains('keep-observing')) {
          observer.unobserve(entry.target);
        }
      } else {
        // Only toggle visibility for elements that need to be re-animated
        if (entry.target.classList.contains('keep-observing')) {
          entry.target.classList.remove('visible');
        }
      }
    });
  };

  const observer = new IntersectionObserver(handleIntersect, observerOptions);
  
  // Observe elements with animation classes
  const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
  animatedElements.forEach(el => observer.observe(el));
}

// Handle navbar scroll effects
function initNavbarScrollEffects() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  
  // Initial check in case page is loaded scrolled down
  handleScroll();
}

// Initialize accordion functionality
function initAccordions() {
  const accordionToggles = document.querySelectorAll('.accordion-toggle');
  
  accordionToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const accordionItem = this.parentElement;
      
      // Toggle current accordion item
      accordionItem.classList.toggle('active');
      
      // Optional: Close other accordion items (uncomment if needed)
      // const parentAccordion = accordionItem.closest('.accordion');
      // if (parentAccordion) {
      //   const siblings = parentAccordion.querySelectorAll('.accordion-item');
      //   siblings.forEach(sibling => {
      //     if (sibling !== accordionItem) {
      //       sibling.classList.remove('active');
      //     }
      //   });
      // }
    });
  });
}

// Initialize mobile menu toggle
function initMobileMenu() {
  const menuToggle = document.querySelector('.navbar-toggler');
  if (!menuToggle) return;
  
  const navMenu = document.querySelector('.navbar-menu');
  
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
    
    // Prevent body scrolling when menu is open
    document.body.classList.toggle('menu-open');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      navMenu && 
      navMenu.classList.contains('open') &&
      !navMenu.contains(e.target) && 
      !menuToggle.contains(e.target)
    ) {
      menuToggle.classList.remove('open');
      navMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    }
  });
  
  // Close menu when pressing escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('open')) {
      menuToggle.classList.remove('open');
      navMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    }
  });
}

// Initialize parallax effects
function initParallax() {
  const parallaxElements = document.querySelectorAll('.parallax-bg, .hero-bg');
  
  if (parallaxElements.length === 0) return;
  
  // Simple parallax effect on scroll
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    parallaxElements.forEach(element => {
      const parentElement = element.parentElement;
      const parentTop = parentElement.offsetTop;
      const speed = element.dataset.speed || 0.3;
      
      // Calculate parallax offset based on scroll position relative to the element
      const offset = (scrollY - parentTop) * speed;
      
      // Apply transform
      element.style.transform = `translateY(${offset}px)`;
    });
  });
}

// Tabs functionality
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      const tabContainer = button.closest('.tabs-container');
      
      // Toggle active class on tab buttons
      tabContainer.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      
      button.classList.add('active');
      
      // Show the corresponding tab content
      tabContainer.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      tabContainer.querySelector(`#${tabId}`).classList.add('active');
    });
  });
}

// Helper function to create smooth scrolling for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      
      // Skip if it's just '#'
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        // Get header height to offset scroll position
        const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        
        window.scrollTo({
          top: targetElement.offsetTop - headerHeight - 20, // Add extra padding
          behavior: 'smooth'
        });
        
        // Update URL but without scrolling
        history.pushState(null, null, targetId);
      }
    });
  });
}

// Run any additional initialization functions here
window.addEventListener('load', () => {
  initTabs();
  initSmoothScroll();
  
  // Add more initialization functions as needed
});

<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - Kids in Motion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .contact-page {
            padding: var(--spacing-xl) 0;
        }

        .contact-header {
            text-align: center;
            margin-bottom: var(--spacing-lg);
        }

        .contact-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-lg);
        }

        .contact-form-container {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            padding: var(--spacing-lg);
        }

        .contact-form-header {
            margin-bottom: var(--spacing-md);
        }

        .contact-form-header h2 {
            color: var(--indigo-dye);
            margin-bottom: var(--spacing-xs);
        }

        .contact-form .form-group {
            margin-bottom: var(--spacing-md);
        }

        .contact-form label {
            display: block;
            margin-bottom: var(--spacing-xs);
            font-weight: 600;
        }

        .contact-form input,
        .contact-form select,
        .contact-form textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: var(--border-radius-sm);
            font-family: var(--font-body);
        }

        .contact-form textarea {
            min-height: 150px;
            resize: vertical;
        }

        .contact-form .btn {
            width: 100%;
        }

        .contact-info-container {
            background-color: var(--indigo-dye);
            color: var(--white);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-lg);
        }

        .contact-info-header {
            margin-bottom: var(--spacing-lg);
        }

        .contact-info-header h2 {
            color: var(--white);
            margin-bottom: var(--spacing-xs);
        }

        .contact-info-list {
            list-style: none;
            margin-bottom: var(--spacing-lg);
        }

        .contact-info-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: var(--spacing-md);
        }

        .contact-info-icon {
            color: var(--imperial-red);
            font-size: 1.25rem;
            margin-right: var(--spacing-sm);
            min-width: 24px;
            text-align: center;
            margin-top: 3px;
        }

        .contact-info-content a {
            color: var(--white);
            text-decoration: none;
            transition: color var(--transition-speed) ease;
        }

        .contact-info-content a:hover {
            color: var(--imperial-red);
        }

        .social-links {
            display: flex;
            gap: var(--spacing-sm);
        }

        .social-link {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--white);
            transition: background-color var(--transition-speed) ease;
        }

        .social-link:hover {
            background-color: var(--imperial-red);
        }

        .contact-map {
            height: 250px;
            border-radius: var(--border-radius-sm);
            overflow: hidden;
            margin-top: var(--spacing-lg);
        }

        .contact-map iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .departments-section {
            margin-top: var(--spacing-xl);
        }

        .departments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-lg);
            margin-top: var(--spacing-md);
        }

        .department-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            padding: var(--spacing-lg);
            text-align: center;
        }

        .department-icon {
            font-size: 2rem;
            color: var(--imperial-red);
            margin-bottom: var(--spacing-sm);
        }

        .department-card h3 {
            color: var(--indigo-dye);
            margin-bottom: var(--spacing-sm);
        }

        .department-card p {
            margin-bottom: var(--spacing-md);
        }

        .department-card a {
            color: var(--imperial-red);
            text-decoration: none;
            font-weight: 600;
        }

        .department-card a:hover {
            text-decoration: underline;
        }

        .faq-section {
            margin-top: var(--spacing-xl);
        }

        .faq-list {
            margin-top: var(--spacing-md);
        }

        .faq-item {
            margin-bottom: var(--spacing-md);
            border: 1px solid #ddd;
            border-radius: var(--border-radius-sm);
            overflow: hidden;
        }

        .faq-question {
            background-color: var(--white);
            padding: var(--spacing-md);
            cursor: pointer;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .faq-question:hover {
            background-color: #f9f9f9;
        }

        .faq-answer {
            padding: 0 var(--spacing-md);
            max-height: 0;
            overflow: hidden;
            transition: max-height var(--transition-speed) ease;
        }

        .faq-answer.active {
            padding: var(--spacing-md);
            border-top: 1px solid #eee;
            max-height: 500px;
        }

        .faq-toggle {
            font-size: 1.25rem;
            color: var(--imperial-red);
        }

        .alert {
            padding: var(--spacing-md);
            border-radius: var(--border-radius-sm);
            margin-bottom: var(--spacing-md);
        }

        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-danger {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        @media (max-width: 768px) {
            .contact-layout {
                grid-template-columns: 1fr;
            }

            .contact-info-container {
                order: -1;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="contact-page">
        <div class="container">
            <div class="contact-header">
                <h1>Contact Us</h1>
                <p>We'd love to hear from you! Get in touch with any questions, suggestions, or inquiries.</p>
            </div>

            <!-- Alert Messages -->
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${errorMessage}
                </div>
            </c:if>

            <c:if test="${not empty successMessage}">
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> ${successMessage}
                </div>
            </c:if>

            <div class="contact-layout">
                <!-- Contact Form -->
                <div class="contact-form-container">
                    <div class="contact-form-header">
                        <h2>Send Us a Message</h2>
                        <p>Fill out the form below and we'll get back to you as soon as possible.</p>
                    </div>

                    <form action="${pageContext.request.contextPath}/contact/submit" method="post" class="contact-form needs-validation">
                        <div class="form-group">
                            <label for="name">Your Name</label>
                            <input type="text" id="name" name="name" placeholder="Enter your name" required>
                        </div>

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" name="email" placeholder="Enter your email" required>
                        </div>

                        <div class="form-group">
                            <label for="phone">Phone Number (Optional)</label>
                            <input type="tel" id="phone" name="phone" placeholder="Enter your phone number">
                        </div>

                        <div class="form-group">
                            <label for="subject">Subject</label>
                            <select id="subject" name="subject" required>
                                <option value="" disabled selected>Select a subject</option>
                                <option value="General Inquiry">General Inquiry</option>
                                <option value="Event Information">Event Information</option>
                                <option value="Volunteer Opportunities">Volunteer Opportunities</option>
                                <option value="Feedback">Feedback</option>
                                <option value="Sponsorship">Sponsorship</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="message">Message</label>
                            <textarea id="message" name="message" placeholder="Type your message here..." required></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>

                <!-- Contact Information -->
                <div class="contact-info-container">
                    <div class="contact-info-header">
                        <h2>Contact Information</h2>
                        <p>Here's how you can reach us directly:</p>
                    </div>

                    <ul class="contact-info-list">
                        <li class="contact-info-item">
                            <div class="contact-info-icon">
                                <i class="fas fa-map-marker-alt"></i>
                            </div>
                            <div class="contact-info-content">
                                <strong>Address:</strong><br>
                                123 Sports Avenue<br>
                                Anytown, USA 12345
                            </div>
                        </li>

                        <li class="contact-info-item">
                            <div class="contact-info-icon">
                                <i class="fas fa-phone"></i>
                            </div>
                            <div class="contact-info-content">
                                <strong>Phone:</strong><br>
                                <a href="tel:5551234567">(555) 123-4567</a>
                            </div>
                        </li>

                        <li class="contact-info-item">
                            <div class="contact-info-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="contact-info-content">
                                <strong>Email:</strong><br>
                                <a href="mailto:info@kidsinmotion.org">info@kidsinmotion.org</a>
                            </div>
                        </li>

                        <li class="contact-info-item">
                            <div class="contact-info-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="contact-info-content">
                                <strong>Office Hours:</strong><br>
                                Monday - Friday: 9:00 AM - 5:00 PM<br>
                                Saturday: 10:00 AM - 2:00 PM<br>
                                Sunday: Closed
                            </div>
                        </li>
                    </ul>

                    <h3>Follow Us</h3>
                    <div class="social-links">
                        <a href="#" class="social-link" aria-label="Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="social-link" aria-label="Instagram">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="#" class="social-link" aria-label="Twitter">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="social-link" aria-label="YouTube">
                            <i class="fab fa-youtube"></i>
                        </a>
                    </div>

                    <div class="contact-map">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3058.8375785278!2d-75.1234567!3d39.9876543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU5JzE1LjYiTiA3NcKwMDcnMjQuNCJX!5e0!3m2!1sen!2sus!4v1615566758977!5m2!1sen!2sus" allowfullscreen="" loading="lazy"></iframe>
                    </div>
                </div>
            </div>

            <!-- Department Contacts -->
            <section class="departments-section">
                <h2 class="section-title">Our Departments</h2>

                <div class="departments-grid">
                    <div class="department-card">
                        <div class="department-icon">
                            <i class="fas fa-clipboard-list"></i>
                        </div>
                        <h3>Logistics</h3>
                        <p>For questions about program coordination, equipment, and logistics.</p>
                        <a href="mailto:logistics@kidsinmotion.org">logistics@kidsinmotion.org</a>
                    </div>

                    <div class="department-card">
                        <div class="department-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3>Member Outreach</h3>
                        <p>For information about becoming a member or volunteer opportunities.</p>
                        <a href="mailto:members@kidsinmotion.org">members@kidsinmotion.org</a>
                    </div>

                    <div class="department-card">
                        <div class="department-icon">
                            <i class="fas fa-handshake"></i>
                        </div>
                        <h3>Community Outreach</h3>
                        <p>For partnerships, sponsorships, and community collaborations.</p>
                        <a href="mailto:community@kidsinmotion.org">community@kidsinmotion.org</a>
                    </div>

                    <div class="department-card">
                        <div class="department-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <h3>Event Coordination</h3>
                        <p>For details about upcoming events, schedules, and registrations.</p>
                        <a href="mailto:events@kidsinmotion.org">events@kidsinmotion.org</a>
                    </div>
                </div>
            </section>

            <!-- FAQ Section -->
            <section class="faq-section">
                <h2 class="section-title">Frequently Asked Questions</h2>

                <div class="faq-list">
                    <div class="faq-item">
                        <div class="faq-question">
                            How do I register my child for an event?
                            <span class="faq-toggle"><i class="fas fa-plus"></i></span>
                        </div>
                        <div class="faq-answer">
                            <p>Registering your child for an event is easy! Simply create an account on our website, browse the upcoming events, and click "Register" on the event you're interested in. You'll be guided through the registration process, which includes providing your child's information and any relevant details.</p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question">
                            What age groups do you serve?
                            <span class="faq-toggle"><i class="fas fa-plus"></i></span>
                        </div>
                        <div class="faq-answer">
                            <p>Our programs cater to children of various age groups, typically ranging from 5 to 14 years old. Each event specifies the appropriate age range, so you can easily find activities suitable for your child. Our young mentors are usually between 14-18 years old.</p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question">
                            How do I become a volunteer?
                            <span class="faq-toggle"><i class="fas fa-plus"></i></span>
                        </div>
                        <div class="faq-answer">
                            <p>To become a volunteer, create an account as a volunteer on our website, complete your profile with your sports experience and skills, and then browse and apply for upcoming volunteer opportunities. We welcome volunteers aged 14 and up with a passion for sports and mentoring younger athletes!</p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question">
                            Are your events free?
                            <span class="faq-toggle"><i class="fas fa-plus"></i></span>
                        </div>
                        <div class="faq-answer">
                            <p>Yes, most of our regular clinics in association with local leagues are completely free. We sometimes hold special fundraising events or camps that may have a nominal fee, but we strive to keep all our programs accessible to everyone in the community. We accept donations to help support our mission.</p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question">
                            Do you offer programs for children with special needs?
                            <span class="faq-toggle"><i class="fas fa-plus"></i></span>
                        </div>
                        <div class="faq-answer">
                            <p>Absolutely! We believe that sports should be accessible to everyone. We offer inclusive programs and specialized clinics designed specifically for children with different abilities. When registering your child, you can provide information about any accommodations they might need.</p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question">
                            How can I sponsor or donate to Kids in Motion?
                            <span class="faq-toggle"><i class="fas fa-plus"></i></span>
                        </div>
                        <div class="faq-answer">
                            <p>We greatly appreciate sponsorships and donations! You can make a donation through our website, or contact our Community Outreach department at community@kidsinmotion.org for information about sponsorship opportunities. As a registered nonprofit, all donations are tax-deductible.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // FAQ accordion functionality
            const faqQuestions = document.querySelectorAll('.faq-question');

            faqQuestions.forEach(question => {
                question.addEventListener('click', function() {
                    const answer = this.nextElementSibling;
                    const icon = this.querySelector('.faq-toggle i');

                    // Toggle answer visibility
                    answer.classList.toggle('active');

                    // Toggle icon
                    if (answer.classList.contains('active')) {
                        icon.classList.remove('fa-plus');
                        icon.classList.add('fa-minus');
                    } else {
                        icon.classList.remove('fa-minus');
                        icon.classList.add('fa-plus');
                    }
                });
            });
        });
    </script>
</body>
</html>
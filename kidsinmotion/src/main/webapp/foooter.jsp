<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<footer>
    <div class="container">
        <div class="footer-content">
            <div class="footer-column">
                <h3>Kids in Motion</h3>
                <p>Our goal is for younger kids to receive sports related mentoring from older kids to help support athletes' goals, foster a good mindset, and help lead productive lives.</p>
                <div class="social-links">
                    <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                    <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                    <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                </div>
            </div>

            <div class="footer-column">
                <h3>Programs</h3>
                <ul class="footer-links">
                    <li><a href="${pageContext.request.contextPath}/programs/baseball">Baseball</a></li>
                    <li><a href="${pageContext.request.contextPath}/programs/basketball">Basketball</a></li>
                    <li><a href="${pageContext.request.contextPath}/programs/soccer">Soccer</a></li>
                    <li><a href="${pageContext.request.contextPath}/programs/special-needs">Inclusive Sports</a></li>
                </ul>
            </div>

            <div class="footer-column">
                <h3>Get Involved</h3>
                <ul class="footer-links">
                    <li><a href="${pageContext.request.contextPath}/volunteers/opportunities">Volunteer</a></li>
                    <li><a href="${pageContext.request.contextPath}/donate">Donate</a></li>
                    <li><a href="${pageContext.request.contextPath}/sponsor">Become a Sponsor</a></li>
                    <li><a href="${pageContext.request.contextPath}/fundraise">Fundraising</a></li>
                </ul>
            </div>

            <div class="footer-column">
                <h3>Contact Us</h3>
                <ul class="footer-links">
                    <li><i class="fas fa-map-marker-alt"></i> 123 Sports Ave, Anytown, USA</li>
                    <li><i class="fas fa-phone"></i> (555) 123-4567</li>
                    <li><i class="fas fa-envelope"></i> info@kidsinmotion.org</li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; ${currentYear} Kids in Motion. All rights reserved.</p>
        </div>
    </div>
</footer>
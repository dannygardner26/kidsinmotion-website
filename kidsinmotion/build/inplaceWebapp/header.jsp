<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<header>
    <div class="container">
        <nav class="navbar">
            <a href="${pageContext.request.contextPath}/" class="logo">Kids <span>in Motion</span></a>

            <button class="mobile-menu-btn" id="mobileMenuBtn">
                <i class="fas fa-bars"></i>
            </button>

            <ul class="nav-links" id="navLinks">
                <li><a href="${pageContext.request.contextPath}/">Home</a></li>
                <li><a href="${pageContext.request.contextPath}/about">About</a></li>
                <li><a href="${pageContext.request.contextPath}/events/upcoming">Events</a></li>
                <li><a href="${pageContext.request.contextPath}/volunteers/opportunities">Volunteer</a></li>
                <li><a href="${pageContext.request.contextPath}/contact">Contact</a></li>
            </ul>

            <div class="user-actions">
                <c:choose>
                    <c:when test="${empty sessionScope.user}">
                        <a href="${pageContext.request.contextPath}/auth/login" class="btn btn-sm btn-outline">Log In</a>
                        <a href="${pageContext.request.contextPath}/auth/register" class="btn btn-sm btn-primary">Sign Up</a>
                    </c:when>
                    <c:otherwise>
                        <a href="${pageContext.request.contextPath}/dashboard" class="btn btn-sm btn-outline">
                            <i class="fas fa-user"></i> Dashboard
                        </a>
                        <a href="${pageContext.request.contextPath}/auth/logout" class="btn btn-sm btn-primary">Log Out</a>
                    </c:otherwise>
                </c:choose>
            </div>
        </nav>
    </div>
</header>
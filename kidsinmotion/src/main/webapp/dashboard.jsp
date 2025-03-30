<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Dashboard - Kids in Motion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .dashboard-page {
            padding: var(--spacing-xl) 0;
            background-color: var(--isabelline);
        }

        .dashboard-header {
            margin-bottom: var(--spacing-lg);
        }

        .dashboard-welcome {
            font-size: 1.5rem;
            margin-bottom: var(--spacing-sm);
        }

        .dashboard-layout {
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: var(--spacing-lg);
        }

        .dashboard-nav {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }

        .dashboard-nav-header {
            background-color: var(--indigo-dye);
            color: var(--white);
            padding: var(--spacing-md);
            font-family: var(--font-heading);
        }

        .dashboard-nav-list {
            list-style: none;
        }

        .dashboard-nav-item {
            border-bottom: 1px solid #eee;
        }

        .dashboard-nav-link {
            display: flex;
            align-items: center;
            padding: var(--spacing-md);
            color: var(--jet);
            text-decoration: none;
            transition: all var(--transition-speed) ease;
        }

        .dashboard-nav-link:hover {
            background-color: #f9f9f9;
            color: var(--imperial-red);
        }

        .dashboard-nav-link.active {
            background-color: #f0f0f0;
            color: var(--imperial-red);
            font-weight: 600;
            border-left: 4px solid var(--imperial-red);
        }

        .dashboard-nav-icon {
            margin-right: var(--spacing-sm);
            width: 20px;
            text-align: center;
        }

        .dashboard-content {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            padding: var(--spacing-lg);
        }

        .dashboard-section {
            margin-bottom: var(--spacing-lg);
        }

        .dashboard-section:last-child {
            margin-bottom: 0;
        }

        .dashboard-section-title {
            margin-bottom: var(--spacing-md);
            color: var(--indigo-dye);
            font-size: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .dashboard-section-title .btn {
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
        }

        .profile-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-md);
        }

        .profile-info-group {
            margin-bottom: var(--spacing-md);
        }

        .profile-info-label {
            font-weight: 600;
            margin-bottom: var(--spacing-xs);
            color: var(--jet);
        }

        .profile-info-value {
            padding: 0.75rem;
            background-color: #f5f5f5;
            border-radius: var(--border-radius-sm);
        }

        .profile-actions {
            margin-top: var(--spacing-lg);
            display: flex;
            gap: var(--spacing-md);
        }

        .event-table {
            width: 100%;
            border-collapse: collapse;
        }

        .event-table th,
        .event-table td {
            padding: var(--spacing-sm);
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .event-table th {
            font-weight: 600;
            color: var(--indigo-dye);
            background-color: #f5f5f5;
        }

        .event-table tr:hover {
            background-color: #f9f9f9;
        }

        .event-table .btn {
            font-size: 0.875rem;
            padding: 0.5rem 0.75rem;
        }

        .event-status {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-upcoming {
            background-color: #e6f7ff;
            color: #1890ff;
        }

        .status-completed {
            background-color: #f6ffed;
            color: #52c41a;
        }

        .status-canceled {
            background-color: #fff2f0;
            color: #ff4d4f;
        }

        .status-pending {
            background-color: #fffbe6;
            color: #faad14;
        }

        .no-events-message {
            text-align: center;
            padding: var(--spacing-lg) 0;
            color: #999;
        }

        .edit-profile-form {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-md);
        }

        .form-group {
            margin-bottom: var(--spacing-md);
        }

        .form-group label {
            display: block;
            margin-bottom: var(--spacing-xs);
            font-weight: 600;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: var(--border-radius-sm);
            font-family: var(--font-body);
        }

        .form-actions {
            grid-column: 1 / -1;
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-sm);
            margin-top: var(--spacing-md);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        @media (max-width: 768px) {
            .dashboard-layout {
                grid-template-columns: 1fr;
            }

            .dashboard-nav {
                margin-bottom: var(--spacing-md);
            }

            .profile-actions {
                flex-direction: column;
            }

            .profile-actions .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="dashboard-page">
        <div class="container">
            <!-- Dashboard Header -->
            <div class="dashboard-header">
                <h1>My Dashboard</h1>
                <p class="dashboard-welcome">Welcome back, ${sessionScope.user.firstName}!</p>
            </div>

            <!-- Alert Messages -->
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger mb-3">
                    <i class="fas fa-exclamation-circle"></i> ${errorMessage}
                </div>
            </c:if>

            <c:if test="${not empty successMessage}">
                <div class="alert alert-success mb-3">
                    <i class="fas fa-check-circle"></i> ${successMessage}
                </div>
            </c:if>

            <!-- Dashboard Layout -->
            <div class="dashboard-layout">
                <!-- Sidebar Navigation -->
                <div class="dashboard-nav">
                    <div class="dashboard-nav-header">
                        <h2>My Account</h2>
                    </div>
                    <ul class="dashboard-nav-list">
                        <li class="dashboard-nav-item">
                            <a href="#profile" class="dashboard-nav-link active" data-tab="profile">
                                <span class="dashboard-nav-icon"><i class="fas fa-user"></i></span>
                                Profile
                            </a>
                        </li>

                        <c:if test="${sessionScope.user.role == 'PARENT'}">
                            <li class="dashboard-nav-item">
                                <a href="#registrations" class="dashboard-nav-link" data-tab="registrations">
                                    <span class="dashboard-nav-icon"><i class="fas fa-child"></i></span>
                                    My Registrations
                                </a>
                            </li>
                        </c:if>

                        <c:if test="${sessionScope.user.role == 'VOLUNTEER'}">
                            <li class="dashboard-nav-item">
                                <a href="#volunteer-schedule" class="dashboard-nav-link" data-tab="volunteer-schedule">
                                    <span class="dashboard-nav-icon"><i class="fas fa-calendar-alt"></i></span>
                                    Volunteer Schedule
                                </a>
                            </li>
                        </c:if>

                        <li class="dashboard-nav-item">
                            <a href="#password" class="dashboard-nav-link" data-tab="password">
                                <span class="dashboard-nav-icon"><i class="fas fa-lock"></i></span>
                                Change Password
                            </a>
                        </li>

                        <li class="dashboard-nav-item">
                            <a href="${pageContext.request.contextPath}/auth/logout" class="dashboard-nav-link">
                                <span class="dashboard-nav-icon"><i class="fas fa-sign-out-alt"></i></span>
                                Log Out
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Main Content Area -->
                <div class="dashboard-content">
                    <!-- Profile Tab -->
                    <div id="profile" class="tab-content active">
                        <div class="dashboard-section">
                            <h2 class="dashboard-section-title">
                                My Profile
                                <a href="#" class="btn btn-sm btn-outline edit-profile-btn">Edit Profile</a>
                            </h2>

                            <!-- Profile Display View -->
                            <div class="profile-view">
                                <div class="profile-info">
                                    <div>
                                        <div class="profile-info-group">
                                            <div class="profile-info-label">First Name</div>
                                            <div class="profile-info-value">${user.firstName}</div>
                                        </div>

                                        <div class="profile-info-group">
                                            <div class="profile-info-label">Last Name</div>
                                            <div class="profile-info-value">${user.lastName}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="profile-info-group">
                                            <div class="profile-info-label">Email</div>
                                            <div class="profile-info-value">${user.email}</div>
                                        </div>

                                        <div class="profile-info-group">
                                            <div class="profile-info-label">Phone Number</div>
                                            <div class="profile-info-value">${user.phoneNumber}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="profile-info-group">
                                            <div class="profile-info-label">Account Type</div>
                                            <div class="profile-info-value">${user.role}</div>
                                        </div>

                                        <div class="profile-info-group">
                                            <div class="profile-info-label">Member Since</div>
                                            <div class="profile-info-value">
                                                <fmt:formatDate value="${user.createdAt}" pattern="MMMM d, yyyy" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Profile Edit Form -->
                            <div class="profile-edit" style="display: none;">
                                <form action="${pageContext.request.contextPath}/dashboard/profile/update" method="post" class="edit-profile-form needs-validation">
                                    <div class="form-group">
                                        <label for="firstName">First Name</label>
                                        <input type="text" id="firstName" name="firstName" value="${user.firstName}" required>
                                    </div>

                                    <div class="form-group">
                                        <label for="lastName">Last Name</label>
                                        <input type="text" id="lastName" name="lastName" value="${user.lastName}" required>
                                    </div>

                                    <div class="form-group">
                                        <label for="email">Email</label>
                                        <input type="email" id="email" name="email" value="${user.email}" required readonly>
                                        <small>Email cannot be changed</small>
                                    </div>

                                    <div class="form-group">
                                        <label for="phoneNumber">Phone Number</label>
                                        <input type="tel" id="phoneNumber" name="phoneNumber" value="${user.phoneNumber}" required>
                                    </div>

                                    <div class="form-actions">
                                        <button type="button" class="btn btn-outline cancel-edit-btn">Cancel</button>
                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Registrations Tab (PARENT) -->
                    <c:if test="${sessionScope.user.role == 'PARENT'}">
                        <div id="registrations" class="tab-content">
                            <div class="dashboard-section">
                                <h2 class="dashboard-section-title">
                                    My Registrations
                                    <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-sm btn-primary">Find Events</a>
                                </h2>

                                <c:choose>
                                    <c:when test="${not empty participantRegistrations}">
                                        <table class="event-table">
                                            <thead>
                                                <tr>
                                                    <th>Child Name</th>
                                                    <th>Event</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <c:forEach var="registration" items="${participantRegistrations}">
                                                    <tr>
                                                        <td>${registration.childFullName}</td>
                                                        <td>${registration.event.title}</td>
                                                        <td><fmt:formatDate value="${registration.event.startDate}" pattern="MMMM d, yyyy" /></td>
                                                        <td>
                                                            <c:choose>
                                                                <c:when test="${registration.event.startDate.time > currentDate.time}">
                                                                    <span class="event-status status-upcoming">Upcoming</span>
                                                                </c:when>
                                                                <c:when test="${registration.event.endDate.time < currentDate.time}">
                                                                    <span class="event-status status-completed">Completed</span>
                                                                </c:when>
                                                                <c:otherwise>
                                                                    <span class="event-status status-pending">In Progress</span>
                                                                </c:otherwise>
                                                            </c:choose>
                                                        </td>
                                                        <td>
                                                            <a href="${pageContext.request.contextPath}/events/${registration.event.id}" class="btn btn-sm btn-outline">View Details</a>

                                                            <c:if test="${registration.event.startDate.time > currentDate.time}">
                                                                <a href="${pageContext.request.contextPath}/participants/cancel/${registration.id}"
                                                                   class="btn btn-sm btn-outline cancel-registration"
                                                                   data-name="${registration.childFullName}"
                                                                   data-event="${registration.event.title}">Cancel</a>
                                                            </c:if>
                                                        </td>
                                                    </tr>
                                                </c:forEach>
                                            </tbody>
                                        </table>
                                    </c:when>
                                    <c:otherwise>
                                        <div class="no-events-message">
                                            <p>You don't have any event registrations yet.</p>
                                            <a href="${pageContext.request.contextPath}/events/upcoming" class="btn btn-primary mt-2">Browse Upcoming Events</a>
                                        </div>
                                    </c:otherwise>
                                </c:choose>
                            </div>
                        </div>
                    </c:if>

                    <!-- Volunteer Schedule Tab (VOLUNTEER) -->
                    <c:if test="${sessionScope.user.role == 'VOLUNTEER'}">
                        <div id="volunteer-schedule" class="tab-content">
                            <div class="dashboard-section">
                                <h2 class="dashboard-section-title">
                                    My Volunteer Schedule
                                    <a href="${pageContext.request.contextPath}/volunteers/opportunities" class="btn btn-sm btn-primary">Find Opportunities</a>
                                </h2>

                                <c:choose>
                                    <c:when test="${not empty volunteerCommitments}">
                                        <table class="event-table">
                                            <thead>
                                                <tr>
                                                    <th>Event</th>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <c:forEach var="commitment" items="${volunteerCommitments}">
                                                    <tr>
                                                        <td>${commitment.event.title}</td>
                                                        <td><fmt:formatDate value="${commitment.event.startDate}" pattern="MMMM d, yyyy" /></td>
                                                        <td>
                                                            <fmt:formatDate value="${commitment.event.startDate}" pattern="h:mm a" /> -
                                                            <fmt:formatDate value="${commitment.event.endDate}" pattern="h:mm a" />
                                                        </td>
                                                        <td>
                                                            <c:choose>
                                                                <c:when test="${commitment.status == 'CONFIRMED' && commitment.event.startDate.time > currentDate.time}">
                                                                    <span class="event-status status-upcoming">Confirmed</span>
                                                                </c:when>
                                                                <c:when test="${commitment.status == 'PENDING'}">
                                                                    <span class="event-status status-pending">Pending</span>
                                                                </c:when>
                                                                <c:when test="${commitment.status == 'REJECTED'}">
                                                                    <span class="event-status status-canceled">Rejected</span>
                                                                </c:when>
                                                                <c:when test="${commitment.event.endDate.time < currentDate.time}">
                                                                    <span class="event-status status-completed">Completed</span>
                                                                </c:when>
                                                                <c:otherwise>
                                                                    <span class="event-status status-pending">In Progress</span>
                                                                </c:otherwise>
                                                            </c:choose>
                                                        </td>
                                                        <td>
                                                            <a href="${pageContext.request.contextPath}/events/${commitment.event.id}" class="btn btn-sm btn-outline">View Details</a>

                                                            <c:if test="${commitment.status != 'REJECTED' && commitment.event.startDate.time > currentDate.time}">
                                                                <a href="${pageContext.request.contextPath}/volunteers/cancel/${commitment.id}"
                                                                   class="btn btn-sm btn-outline cancel-volunteer"
                                                                   data-event="${commitment.event.title}">Cancel</a>
                                                            </c:if>
                                                        </td>
                                                    </tr>
                                                </c:forEach>
                                            </tbody>
                                        </table>
                                    </c:when>
                                    <c:otherwise>
                                        <div class="no-events-message">
                                            <p>You don't have any volunteer commitments yet.</p>
                                            <a href="${pageContext.request.contextPath}/volunteers/opportunities" class="btn btn-primary mt-2">Browse Volunteer Opportunities</a>
                                        </div>
                                    </c:otherwise>
                                </c:choose>
                            </div>
                        </div>
                    </c:if>

                    <!-- Change Password Tab -->
                    <div id="password" class="tab-content">
                        <div class="dashboard-section">
                            <h2 class="dashboard-section-title">Change Password</h2>

                            <form action="${pageContext.request.contextPath}/dashboard/password/update" method="post" class="edit-profile-form needs-validation" id="password-form">
                                <div class="form-group">
                                    <label for="currentPassword">Current Password</label>
                                    <input type="password" id="currentPassword" name="currentPassword" required>
                                </div>

                                <div class="form-group">
                                    <label for="newPassword">New Password</label>
                                    <input type="password" id="newPassword" name="newPassword" required>
                                </div>

                                <div class="form-group">
                                    <label for="confirmPassword">Confirm New Password</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                                </div>

                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Update Password</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Tab Navigation
            const tabLinks = document.querySelectorAll('.dashboard-nav-link[data-tab]');
            const tabContents = document.querySelectorAll('.tab-content');

            tabLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();

                    const targetTab = this.getAttribute('data-tab');

                    // Remove active classes
                    tabLinks.forEach(link => link.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));

                    // Add active class to clicked tab and corresponding content
                    this.classList.add('active');
                    document.getElementById(targetTab).classList.add('active');

                    // Update URL hash
                    window.location.hash = targetTab;
                });
            });

            // Check for hash in URL
            if (window.location.hash) {
                const hash = window.location.hash.substring(1);
                const tabLink = document.querySelector(`.dashboard-nav-link[data-tab="${hash}"]`);

                if (tabLink) {
                    tabLink.click();
                }
            }

            // Edit Profile Toggle
            const editProfileBtn = document.querySelector('.edit-profile-btn');
            const cancelEditBtn = document.querySelector('.cancel-edit-btn');
            const profileView = document.querySelector('.profile-view');
            const profileEdit = document.querySelector('.profile-edit');

            if (editProfileBtn && cancelEditBtn && profileView && profileEdit) {
                editProfileBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    profileView.style.display = 'none';
                    profileEdit.style.display = 'block';
                });

                cancelEditBtn.addEventListener('click', function() {
                    profileView.style.display = 'block';
                    profileEdit.style.display = 'none';
                });
            }

            // Password confirmation validation
            const passwordForm = document.getElementById('password-form');
            const newPasswordField = document.getElementById('newPassword');
            const confirmPasswordField = document.getElementById('confirmPassword');

            if (passwordForm && newPasswordField && confirmPasswordField) {
                passwordForm.addEventListener('submit', function(e) {
                    if (newPasswordField.value !== confirmPasswordField.value) {
                        e.preventDefault();
                        alert('The new password and confirmation password do not match.');
                    }
                });
            }

            // Cancel Registration Confirmation
            const cancelRegistrationLinks = document.querySelectorAll('.cancel-registration');

            cancelRegistrationLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();

                    const childName = this.getAttribute('data-name');
                    const eventTitle = this.getAttribute('data-event');

                    if (confirm(`Are you sure you want to cancel ${childName}'s registration for "${eventTitle}"?`)) {
                        window.location.href = this.getAttribute('href');
                    }
                });
            });

            // Cancel Volunteer Commitment Confirmation
            const cancelVolunteerLinks = document.querySelectorAll('.cancel-volunteer');

            cancelVolunteerLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();

                    const eventTitle = this.getAttribute('data-event');

                    if (confirm(`Are you sure you want to cancel your volunteer commitment for "${eventTitle}"?`)) {
                        window.location.href = this.getAttribute('href');
                    }
                });
            });
        });
    </script>
</body>
</html>
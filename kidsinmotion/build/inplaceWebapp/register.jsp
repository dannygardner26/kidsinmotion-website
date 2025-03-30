<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Kids in Motion</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/styles.css">
    <style>
        .auth-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 200px);
            padding: var(--spacing-xl) 0;
        }

        .auth-card {
            background-color: var(--white);
            border-radius: var(--border-radius-md);
            box-shadow: 0 5px 30px rgba(0, 0, 0, 0.1);
            padding: var(--spacing-lg);
            width: 100%;
            max-width: 550px;
        }

        .auth-header {
            text-align: center;
            margin-bottom: var(--spacing-lg);
        }

        .auth-header h1 {
            color: var(--indigo-dye);
        }

        .auth-form .form-group {
            display: block;
            margin-bottom: var(--spacing-md);
        }

        .auth-form label {
            display: block;
            margin-bottom: var(--spacing-xs);
            font-weight: 600;
        }

        .auth-form input, .auth-form select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: var(--border-radius-sm);
            font-family: var(--font-body);
        }

        .auth-form .btn {
            width: 100%;
            margin-top: var(--spacing-md);
        }

        .auth-footer {
            text-align: center;
            margin-top: var(--spacing-lg);
            padding-top: var(--spacing-md);
            border-top: 1px solid #eee;
        }

        .form-row {
            display: flex;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-md);
        }

        .form-row .form-group {
            flex: 1;
            margin-bottom: 0;
        }

        .terms-agreement {
            display: flex;
            align-items: flex-start;
            margin-bottom: var(--spacing-md);
        }

        .terms-agreement input {
            width: auto;
            margin-right: var(--spacing-xs);
            margin-top: 5px;
        }

        .alert {
            padding: var(--spacing-md);
            border-radius: var(--border-radius-sm);
            margin-bottom: var(--spacing-md);
        }

        .alert-danger {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
                gap: 0;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>Create an Account</h1>
                <p>Join our community and get involved</p>
            </div>

            <!-- Alert Messages -->
            <c:if test="${not empty errorMessage}">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${errorMessage}
                </div>
            </c:if>

            <form action="${pageContext.request.contextPath}/auth/register" method="post" class="auth-form needs-validation">
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" name="firstName" placeholder="Enter your first name" value="${param.firstName}" required>
                    </div>

                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" name="lastName" placeholder="Enter your last name" value="${param.lastName}" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" value="${param.email}" required>
                </div>

                <div class="form-group">
                    <label for="phoneNumber">Phone Number</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" placeholder="Enter your phone number" value="${param.phoneNumber}" required>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Create a password" required>
                    </div>

                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="role">I am a:</label>
                    <select id="role" name="role" required>
                        <option value="" disabled selected>Select your role</option>
                        <option value="PARENT" ${param.role == 'PARENT' ? 'selected' : ''}>Parent</option>
                        <option value="VOLUNTEER" ${param.role == 'VOLUNTEER' ? 'selected' : ''}>Volunteer</option>
                    </select>
                </div>

                <div class="terms-agreement">
                    <input type="checkbox" id="terms" name="terms" required>
                    <label for="terms">I agree to the <a href="${pageContext.request.contextPath}/terms" target="_blank">Terms of Service</a> and <a href="${pageContext.request.contextPath}/privacy" target="_blank">Privacy Policy</a></label>
                </div>

                <button type="submit" class="btn btn-primary">Create Account</button>
            </form>

            <div class="auth-footer">
                <p>Already have an account? <a href="${pageContext.request.contextPath}/auth/login">Sign In</a></p>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
    <script>
        // Password match validation
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        function validatePassword() {
            if (password.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity('Passwords do not match');
            } else {
                confirmPassword.setCustomValidity('');
            }
        }

        password.addEventListener('change', validatePassword);
        confirmPassword.addEventListener('keyup', validatePassword);
    </script>
</body>
</html>
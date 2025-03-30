<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Kids in Motion</title>
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
            max-width: 450px;
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

        .auth-form input {
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

        .social-login {
            display: flex;
            justify-content: center;
            gap: var(--spacing-md);
            margin: var(--spacing-md) 0;
        }

        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            color: var(--white);
            font-size: 1.25rem;
            transition: transform var(--transition-speed) ease;
        }

        .social-btn:hover {
            transform: translateY(-3px);
        }

        .facebook {
            background-color: #3b5998;
        }

        .google {
            background-color: #db4437;
        }

        .remember-me {
            display: flex;
            align-items: center;
            margin-bottom: var(--spacing-md);
        }

        .remember-me input {
            width: auto;
            margin-right: var(--spacing-xs);
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
    </style>
</head>
<body>
    <!-- Header -->
    <jsp:include page="/WEB-INF/partials/header.jsp" />

    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>Welcome Back</h1>
                <p>Sign in to access your account</p>
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

            <form action="${pageContext.request.contextPath}/auth/login" method="post" class="auth-form needs-validation">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Enter your password" required>
                </div>

                <div class="remember-me">
                    <input type="checkbox" id="remember" name="remember">
                    <label for="remember">Remember me</label>
                </div>

                <button type="submit" class="btn btn-primary">Sign In</button>
            </form>

            <div class="auth-footer">
                <p>Don't have an account? <a href="${pageContext.request.contextPath}/auth/register">Sign Up</a></p>
                <p><a href="${pageContext.request.contextPath}/auth/forgot-password">Forgot Password?</a></p>

                <p class="mt-2">Or sign in with:</p>
                <div class="social-login">
                    <a href="${pageContext.request.contextPath}/auth/oauth/facebook" class="social-btn facebook">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="${pageContext.request.contextPath}/auth/oauth/google" class="social-btn google">
                        <i class="fab fa-google"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <jsp:include page="/WEB-INF/partials/footer.jsp" />

    <!-- JavaScript -->
    <script src="${pageContext.request.contextPath}/js/main.js"></script>
</body>
</html>
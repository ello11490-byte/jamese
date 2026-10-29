<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register | Sweet Creation By Jhen</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<header class="site-header">
    <a class="logo" href="index.html">
        Sweet Creation <span>By Jhen</span>
    </a>
    <nav class="navbar">
        <a href="index.html">Home</a>
        <a href="login.php">Login</a>
    </nav>
</header>

<main class="section app-section">
    <div class="form-card">
        <p class="eyebrow">JOIN OUR SWEET COMMUNITY</p>
        <h2>Create Customer Account</h2>

        <?php if ($message !== ""): ?>
            <p class="demo-note" role="status">
                <?= htmlspecialchars($message, ENT_QUOTES, "UTF-8") ?>
            </p>
        <?php endif; ?>

        <?php if (!$success): ?>
        <form method="POST" action="register.php">
            <label for="full_name">Full Name</label>
            <input id="full_name" name="full_name" type="text"
                   maxlength="150" required
                   value="<?= htmlspecialchars($_POST["full_name"] ?? "", ENT_QUOTES, "UTF-8") ?>">

            <label for="email">Email Address</label>
            <input id="email" name="email" type="email"
                   maxlength="150" required
                   value="<?= htmlspecialchars($_POST["email"] ?? "", ENT_QUOTES, "UTF-8") ?>">

            <label for="password">Password</label>
            <input id="password" name="password" type="password"
                   minlength="8" required>

            <label for="confirm_password">Confirm Password</label>
            <input id="confirm_password" name="confirm_password"
                   type="password" minlength="8" required>

            <button class="btn full-btn" type="submit">Register</button>
        </form>
        <?php endif; ?>

        <p class="small-text">
            Already have an account? <a href="login.php">Log in here</a>.
        </p>
    </div>
</main>

<footer class="footer">
    <a class="footer-logo" href="index.html">Sweet Creation By Jhen</a>
    <p>Every Cake Tells a Sweet Story</p>
</footer>
</body>
</html>
